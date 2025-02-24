document.addEventListener('DOMContentLoaded', () => {
    const modalHTML = `
        <div id="reviewModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
            <div id="reviewContent" class="bg-[#121212] rounded-xl p-6 w-96 transform scale-95 opacity-0 transition-all duration-300">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-semibold text-white">Share your feedback</h3>
                    <button id="closeReview" class="text-zinc-500 hover:text-white">
                        <i class="ri-close-line text-xl"></i>
                    </button>
                </div>
                
                <!-- Move reactions above textarea -->
                <div class="flex justify-start gap-6 mb-4">
                    <button class="reaction-btn group" data-emotion="happy">
                        <i class="ri-emotion-happy-line text-3xl text-zinc-500 group-hover:text-yellow-500 transition-colors"></i>
                    </button>
                    <button class="reaction-btn group" data-emotion="neutral">
                        <i class="ri-emotion-normal-line text-3xl text-zinc-500 group-hover:text-blue-500 transition-colors"></i>
                    </button>
                    <button class="reaction-btn group" data-emotion="sad">
                        <i class="ri-emotion-unhappy-line text-3xl text-zinc-500 group-hover:text-red-500 transition-colors"></i>
                    </button>
                </div>
                
                <p class="text-xs text-zinc-500 mb-2" id="emojiHelper">Please select an emoji</p>
                
                <textarea 
                    placeholder="Tell us what you think..."
                    class="w-full h-32 bg-[#1a1a1a] text-white rounded-lg p-3 mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-zinc-600"
                ></textarea>

                <button id="sendFeedback" disabled class="w-full bg-blue-600/50 text-white/50 rounded-lg py-2 transition-all duration-300">
                    Send Feedback
                </button>
            </div>
        </div>
    `;

    // Insert modal into body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Initialize review functionality
    const modal = document.getElementById('reviewModal');
    const modalContent = document.getElementById('reviewContent');
    const closeBtn = document.getElementById('closeReview');
    const sendBtn = document.getElementById('sendFeedback');
    const reactionBtns = document.querySelectorAll('.reaction-btn');
    const reviewBtn = document.querySelector('.ri-magic-line')?.closest('button');
    const emojiHelper = document.getElementById('emojiHelper');
    
    // Show modal
    if (reviewBtn) {
        reviewBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            
            // Animate in
            setTimeout(() => {
                modalContent.style.transform = 'scale(1)';
                modalContent.style.opacity = '1';
            }, 50);
        });
    }

    // Handle reactions
    let selectedReaction = null;
    reactionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Reset all buttons to default state
            reactionBtns.forEach(b => {
                const icon = b.querySelector('i');
                icon.classList.remove('text-yellow-500', 'text-blue-500', 'text-red-500');
                icon.classList.add('text-zinc-500');
            });
            
            // Select clicked button
            const icon = btn.querySelector('i');
            selectedReaction = btn.dataset.emotion;
            
            // Remove hover classes and add permanent color
            icon.classList.remove('text-zinc-500', 'group-hover:text-yellow-500', 'group-hover:text-blue-500', 'group-hover:text-red-500');
            icon.classList.add(
                selectedReaction === 'happy' ? 'text-yellow-500' :
                selectedReaction === 'neutral' ? 'text-blue-500' : 'text-red-500'
            );

            // Enable send button
            sendBtn.disabled = false;
            sendBtn.classList.remove('bg-blue-600/50', 'text-white/50');
            sendBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
            
            // Hide helper text
            emojiHelper.classList.add('hidden');
        });
    });

    // Close modal function
    function closeModal() {
        modalContent.style.transform = 'scale(0.95)';
        modalContent.style.opacity = '0';
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            // Reset form
            modal.querySelector('textarea').value = '';
            
            // Reset emojis to default state with hover effects
            reactionBtns.forEach(btn => {
                const icon = btn.querySelector('i');
                icon.className = 'ri-emotion-' + 
                    (btn.dataset.emotion === 'happy' ? 'happy' : 
                    btn.dataset.emotion === 'neutral' ? 'normal' : 'unhappy') + 
                    '-line text-3xl text-zinc-500 group-hover:' + 
                    (btn.dataset.emotion === 'happy' ? 'text-yellow-500' : 
                    btn.dataset.emotion === 'neutral' ? 'text-blue-500' : 'text-red-500') + 
                    ' transition-colors';
            });
            
            selectedReaction = null;
            sendBtn.disabled = true;
            sendBtn.classList.add('bg-blue-600/50', 'text-white/50');
            sendBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            emojiHelper.classList.remove('hidden');
        }, 300);
    }

    // Close handlers
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Modify the send feedback handler
    sendBtn.addEventListener('click', async () => {
        if (!selectedReaction) {
            emojiHelper.classList.remove('hidden');
            return;
        }

        const feedback = modal.querySelector('textarea').value;

        try {
            // Show loading state
            sendBtn.disabled = true;
            sendBtn.textContent = 'Sending...';

            // Create emoji mapping
            const emojiMap = {
                'happy': '😊',
                'neutral': '😐',
                'sad': '😔'
            };

            // Prepare Discord webhook message
            const payload = {
                content: `New Feedback\n${emojiMap[selectedReaction]} **Reaction:** ${selectedReaction}\n💭 **Message:** ${feedback || 'No message provided'}`,
                username: 'Orphion Feedback', // Changed
                avatar_url: 'https://imgur.com/EKtF9Wu.png'
            };

            console.log('Sending feedback:', payload);

            const response = await fetch('https://discord.com/api/webhooks/1327987410990272562/--gVQXY95vXrHdMshWYlVvrWG0-JzqpZhwni1slR-f0XTTA2mtViBC21jZjnaKUsh0ZM', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log('Feedback sent successfully');
            
            // Reset button text before closing modal
            sendBtn.textContent = 'Send Feedback';
            
            // Success - close the modal
            closeModal();
        } catch (error) {
            console.error('Error sending feedback:', error);
            sendBtn.textContent = 'Error! Try again';
            sendBtn.disabled = false;
            
            // Reset button after 2 seconds
            setTimeout(() => {
                sendBtn.textContent = 'Send Feedback';
            }, 2000);
        }
    });
});
