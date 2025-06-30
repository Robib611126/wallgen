document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('wallpaperForm');
    const submitBtn = form.querySelector('.generate-btn');
    const btnContent = submitBtn.querySelector('.btn-content');
    const loadingState = submitBtn.querySelector('.loading-state');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const previewSection = document.getElementById('previewSection');
    const previewPlaceholder = document.getElementById('previewPlaceholder');
    
    const SUBMIT_URL = '/submit-wallpaper';

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Hide previous messages
        successMessage.style.display = 'none';
        errorMessage.style.display = 'none';
        
        // Validate required fields
        if (!validateForm()) {
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        
        // Collect form data
        const formData = collectFormData();
        
        try {
            // Send POST request to our backend proxy
            const response = await fetch(SUBMIT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                // Check if we received an image
                if (result.image_data) {
                    // Hide any previous messages
                    successMessage.style.display = 'none';
                    errorMessage.style.display = 'none';
                    
                    // Show the generated wallpaper
                    showGeneratedImage(result.image_data, result.message);
                } else {
                    // Show success message for text responses
                    showNotification(successMessage);
                }
                
                // Optional: Reset form after successful submission
                // form.reset();
            } else {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }
            
        } catch (error) {
            console.error('Error submitting form:', error);
            
            // Update error message with more specific information
            const errorMessageSpan = errorMessage.querySelector('span');
            if (error.message.includes('timeout')) {
                errorMessageSpan.textContent = 'Request timed out. The service may be busy, please try again.';
            } else if (error.message.includes('connect')) {
                errorMessageSpan.textContent = 'Unable to connect to the wallpaper service. Please try again later.';
            } else {
                errorMessageSpan.textContent = 'Failed to send request. Please try again.';
            }
            
            showNotification(errorMessage);
        } finally {
            // Hide loading state
            setLoadingState(false);
        }
    });
    
    function validateForm() {
        const requiredFields = [
            'visualTheme',
            'dominantColor', 
            'emotionalMood',
            'mainFocus',
            'lightingStyle',
            'aspectRatio'
        ];
        
        let isValid = true;
        
        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            const formGroup = field.closest('.form-group');
            
            // Remove previous error styling
            field.style.borderColor = '';
            
            if (!field.value.trim()) {
                // Add error styling
                field.style.borderColor = '#ff6b6b';
                field.focus();
                isValid = false;
                
                // Add shake animation
                formGroup.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    formGroup.style.animation = '';
                }, 500);
            }
        });
        
        if (!isValid) {
            // Show a general error message
            const tempError = document.createElement('div');
            tempError.className = 'error-message';
            tempError.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Please fill in all required fields.</span>';
            tempError.style.display = 'block';
            
            form.appendChild(tempError);
            
            setTimeout(() => {
                tempError.remove();
            }, 3000);
        }
        
        return isValid;
    }
    
    function collectFormData() {
        const formData = {
            visualTheme: document.getElementById('visualTheme').value,
            dominantColor: document.getElementById('dominantColor').value,
            emotionalMood: document.getElementById('emotionalMood').value,
            mainFocus: document.getElementById('mainFocus').value,
            lightingStyle: document.getElementById('lightingStyle').value,
            styleKeywords: document.getElementById('styleKeywords').value || '',
            aspectRatio: document.getElementById('aspectRatio').value,
            allowNSFW: document.getElementById('allowNSFW').checked,
            dynamic: document.getElementById('dynamic').value || ''
        };
        
        // Add timestamp for tracking
        formData.timestamp = new Date().toISOString();
        
        return formData;
    }
    
    function setLoadingState(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            btnContent.style.display = 'none';
            loadingState.style.display = 'flex';
        } else {
            submitBtn.disabled = false;
            btnContent.style.display = 'flex';
            loadingState.style.display = 'none';
        }
    }
    
    function showGeneratedImage(imageData, message) {
        // Hide placeholder and show image in preview section
        previewPlaceholder.style.display = 'none';
        
        // Create or get the image display container
        let imageContainer = document.getElementById('imageContainer');
        if (!imageContainer) {
            imageContainer = document.createElement('div');
            imageContainer.id = 'imageContainer';
            imageContainer.className = 'image-container';
            previewSection.appendChild(imageContainer);
        }
        
        // Clear previous content
        imageContainer.innerHTML = '';
        
        // Create image display wrapper
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'generated-image-wrapper';
        
        // Create success message
        const successMsg = document.createElement('div');
        successMsg.className = 'notification success-notification';
        successMsg.style.display = 'block';
        successMsg.style.position = 'relative';
        successMsg.style.margin = '0 0 24px 0';
        successMsg.innerHTML = `<i class="fas fa-check-circle"></i><span>${message}</span>`;
        imageWrapper.appendChild(successMsg);
        
        // Create image element
        const image = document.createElement('img');
        image.src = imageData;
        image.className = 'generated-image';
        image.alt = 'Generated AI Wallpaper';
        imageWrapper.appendChild(image);
        
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '12px';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.flexWrap = 'wrap';
        buttonContainer.style.marginTop = '24px';
        
        // Add download button
        const downloadBtn = document.createElement('a');
        downloadBtn.href = imageData;
        downloadBtn.download = `ai-wallpaper-${Date.now()}.jpg`;
        downloadBtn.className = 'download-btn';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Wallpaper';
        buttonContainer.appendChild(downloadBtn);
        
        // Add generate another button
        const generateBtn = document.createElement('button');
        generateBtn.className = 'generate-another-btn';
        generateBtn.innerHTML = '<i class="fas fa-redo"></i> Generate Another';
        generateBtn.onclick = () => {
            imageContainer.style.display = 'none';
            previewPlaceholder.style.display = 'flex';
            form.scrollIntoView({ behavior: 'smooth' });
        };
        buttonContainer.appendChild(generateBtn);
        
        imageWrapper.appendChild(buttonContainer);
        imageContainer.appendChild(imageWrapper);
        
        // Show the container with animation
        imageContainer.style.display = 'block';
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Enhanced floating label functionality
    const floatingLabels = document.querySelectorAll('.floating-label');
    floatingLabels.forEach(group => {
        const input = group.querySelector('select, input');
        const label = group.querySelector('label');
        
        // Initialize label position on load
        if (input.value && input.value !== '') {
            label.style.transform = 'translateY(-50%) scale(0.875)';
            label.style.top = '0';
            label.style.left = '12px';
            label.style.color = 'var(--accent-primary)';
            label.style.background = 'var(--bg-primary)';
            label.style.fontWeight = '600';
            label.style.zIndex = '1';
        }
        
        // Handle input changes for floating effect
        input.addEventListener('change', function() {
            if (this.value && this.value !== '') {
                label.style.transform = 'translateY(-50%) scale(0.875)';
                label.style.top = '0';
                label.style.left = '12px';
                label.style.color = 'var(--accent-primary)';
                label.style.background = 'var(--bg-primary)';
                label.style.fontWeight = '600';
                label.style.zIndex = '1';
            } else {
                label.style.transform = 'translateY(-50%) scale(1)';
                label.style.top = '50%';
                label.style.left = '16px';
                label.style.color = 'var(--text-tertiary)';
                label.style.background = 'transparent';
                label.style.fontWeight = '500';
                label.style.zIndex = 'auto';
            }
        });
    });
    
    // Auto-hide notifications after 5 seconds
    function showNotification(element) {
        element.style.display = 'block';
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
    
    // Add shake animation for validation errors
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
});
