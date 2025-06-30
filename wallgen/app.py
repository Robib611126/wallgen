import os
import requests
from flask import Flask, render_template, request, jsonify

# create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

WEBHOOK_URL = 'https://n8n-pba6.onrender.com/webhook/defd9e82-00be-4c15-b5f3-3be6c7b8fc04'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/test')
def webhook_test():
    return render_template('webhook-test.html')

@app.route('/test-webhook', methods=['POST'])
def test_webhook():
    try:
        data = request.get_json()
        webhook_url = data.get('webhookUrl')
        test_data = data.get('testData')
        
        if not webhook_url:
            return jsonify({'error': 'No webhook URL provided'}), 400
        
        # Test with GET request since the webhook expects GET
        response = requests.get(webhook_url, params=test_data, timeout=10)
        
        if response.status_code == 200:
            return jsonify({'success': True, 'message': 'Webhook responded successfully'})
        else:
            return jsonify({'error': f'Webhook returned status {response.status_code}: {response.text}'}), response.status_code
            
    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timeout'}), 408
    except requests.exceptions.ConnectionError:
        return jsonify({'error': 'Connection failed'}), 503
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/submit-wallpaper', methods=['POST'])
def submit_wallpaper():
    try:
        # Get JSON data from the request
        form_data = request.get_json()
        
        app.logger.info(f'Received form data: {form_data}')
        
        if not form_data:
            app.logger.error('No data provided in request')
            return jsonify({'error': 'No data provided'}), 400
        
        app.logger.info(f'Sending request to webhook: {WEBHOOK_URL}')
        
        # Forward the request to the external webhook using GET with query parameters
        response = requests.get(
            WEBHOOK_URL,
            params=form_data,
            timeout=60  # Increased timeout for image generation
        )
        
        app.logger.info(f'Webhook response status: {response.status_code}')
        app.logger.info(f'Webhook response content-type: {response.headers.get("content-type", "unknown")}')
        
        # Check if the request was successful
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            
            # Check if the response is an image
            if content_type.startswith('image/'):
                # Save the image temporarily and return a URL for the frontend to display
                import base64
                image_data = base64.b64encode(response.content).decode('utf-8')
                return jsonify({
                    'success': True, 
                    'message': 'Wallpaper generated successfully!',
                    'image_data': f'data:{content_type};base64,{image_data}'
                })
            else:
                # Handle text/JSON responses (like "Workflow was started")
                try:
                    response_data = response.json()
                    return jsonify({'success': True, 'message': response_data.get('message', 'Wallpaper request submitted successfully')})
                except:
                    return jsonify({'success': True, 'message': 'Wallpaper request submitted successfully'})
        else:
            app.logger.error(f'Webhook returned status {response.status_code}: {response.text}')
            # Provide more user-friendly error messages
            if response.status_code == 500:
                return jsonify({'error': 'The wallpaper generation service is currently unavailable. Please check your N8N workflow configuration.'}), 500
            elif response.status_code == 404:
                return jsonify({'error': 'Webhook endpoint not found. Please verify the webhook URL.'}), 404
            else:
                return jsonify({'error': f'Wallpaper service returned error (status {response.status_code})'}), response.status_code
            
    except requests.exceptions.Timeout:
        app.logger.error('Request timeout to webhook')
        return jsonify({'error': 'Request timeout - the service may be slow to respond'}), 408
    except requests.exceptions.ConnectionError as e:
        app.logger.error(f'Connection error to webhook: {str(e)}')
        return jsonify({'error': 'Unable to connect to wallpaper generation service'}), 503
    except Exception as e:
        app.logger.error(f'Error submitting to webhook: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

# app.py  – bottom of file
import os

if __name__ == "__main__":
    # Render assigns the port number as an environment variable named PORT.
    # Fall back to 5000 if it isn’t set (handy for local testing).
    port = int(os.environ.get("PORT", 5000))

    # Turn off debug in production to avoid leaking stack traces.
    app.run(host="0.0.0.0", port=port, debug=False)

