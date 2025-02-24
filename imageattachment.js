class ImageAttachmentHandler {
    constructor() {
        this.currentAttachedImage = null;
        this.imageAttachmentUsed = false;
        
        // DOM Elements
        this.imageInput = document.getElementById('imageInput');
        this.imagePreview = document.getElementById('imagePreview');
        this.imageAttachButton = document.getElementById('imageAttachButton');
        this.removeImageButton = document.getElementById('removeImage');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Image input change handler
        this.imageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                this.currentAttachedImage = await this.processImage(file);
            }
        });

        // Remove image handler
        this.removeImageButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearImage();
        });

        // Attach image button handler
        this.imageAttachButton.addEventListener('click', () => this.handleImageAttachment());
    }

    handleImageAttachment() {
        if (this.imageAttachmentUsed) return;
        this.imageInput.value = '';
        this.imageInput.click();
    }

    async getBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    async processImage(file) {
        try {
            // Validate file size (max 4MB)
            if (file.size > 4 * 1024 * 1024) {
                throw new Error('Image size should be less than 4MB');
            }

            // Convert to base64
            const base64 = await this.getBase64(file);
            
            // Update preview
            const previewImg = this.imagePreview.querySelector('img');
            previewImg.src = base64;
            this.imagePreview.classList.remove('hidden');
            this.imageAttachButton.classList.add('hidden');
            
            return base64;
        } catch (error) {
            console.error('Image processing error:', error);
            return null;
        }
    }

    clearImage() {
        this.currentAttachedImage = null;
        this.imageInput.value = '';
        this.imagePreview.classList.add('hidden');
        this.imageAttachButton.classList.remove('hidden');
    }

    disableAttachment() {
        this.imageAttachButton.classList.add('opacity-50', 'cursor-not-allowed');
        this.imageAttachButton.disabled = true;
        this.imageAttachButton.classList.remove('hidden');  // Make sure button is visible
        this.imagePreview.classList.add('hidden');  // Hide preview
        this.imageAttachmentUsed = true;
    }

    enableAttachment() {
        this.imageAttachButton.classList.remove('opacity-50', 'cursor-not-allowed');
        this.imageAttachButton.disabled = false;
        this.imageAttachmentUsed = false;
    }

    getCurrentImage() {
        return this.currentAttachedImage;
    }

    formatMessageWithImage(message) {
        if (!this.currentAttachedImage) return { role: "user", content: message };

        return {
            role: "user",
            content: [
                {
                    type: "text",
                    text: message || "What's in this image?"
                },
                {
                    type: "image_url",
                    image_url: {
                        url: this.currentAttachedImage,
                        detail: "high"
                    }
                }
            ]
        };
    }

    reset() {
        this.clearImage();
        this.enableAttachment();
    }
}

// Export for global use
window.ImageAttachmentHandler = ImageAttachmentHandler;
