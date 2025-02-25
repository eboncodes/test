document.addEventListener("DOMContentLoaded", () => {
    // Add this at the beginning for voice initialization
    if ('speechSynthesis' in window) {
        // Force load voices early
        speechSynthesis.getVoices();
        
        // Reset speech synthesis if page is hidden/visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                speechSynthesis.cancel();
            }
        });

        // Handle speech synthesis timeout
        let speechTimeout;
        const resetSpeechTimeout = () => {
            if (speechTimeout) clearTimeout(speechTimeout);
            speechTimeout = setTimeout(() => {
                if (speechSynthesis.speaking) {
                    speechSynthesis.cancel();
                    tejai.handleSpeechError();
                }
            }, 10000); // 10 second timeout
        };

        // Monitor speech synthesis
        setInterval(() => {
            if (speechSynthesis.speaking) {
                resetSpeechTimeout();
            }
        }, 1000);
    }

    // Add this near the top with other initializations
    let webSearchEnabled = false;

    // Add these near the top with other modal-related code
    // Remove these variables/constants
    // const thoughtModal = document.getElementById('thoughtModal');
    // const thoughtContent = document.getElementById('thoughtContent');

    // Add these near other state variables at the top
    let webSearchFeatureEnabled = false;
    // let deepThinkingFeatureEnabled = false;

    // Add these variables near the top with other state variables
    // let deepThinkingEnabled = false;
    // const deepThinkingModel = "deepseek-r1-distill-qwen-32b";

    // Add near the top with other state variables
    let deepThinkEnabled = false;
    const deepThinkModel = "deepseek-r1-distill-qwen-32b";

    // Initialize core functionality
    const tejai = new TEJAICore();
    
    // Initialize conversation
    tejai.initializeConversation();

    // Initialize speech recognition with callbacks
    tejai.initSpeechRecognition({
        onStart: () => {
            input.placeholder = "Listening...";
            speechAnimation.classList.remove('hidden');
            sendButton.querySelector('i').classList.add('text-blue-500');
        },
        onEnd: () => {
            input.placeholder = "Message Orphion";
            speechAnimation.classList.add('hidden');
            sendButton.querySelector('i').classList.remove('text-blue-500');
        },
        onResult: (transcript) => {
            input.value = transcript;
            const icon = sendButton.querySelector("i");
            if (input.value.trim()) {
                icon.classList.replace("ri-mic-line", "ri-arrow-right-line");
            }
        },
        onError: () => {
            input.placeholder = "Message TEJAI";
            speechAnimation.classList.add('hidden');
        }
    });

    // Add debounce function at the top
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Add processing state variable
    let isProcessing = false;

    // Replace the assignRandomPrompts function with an empty one or remove it
    function assignRandomPrompts() {
        // Function disabled since suggestion boxes were removed
        return;
    }

    // Call assignRandomPrompts initially
    assignRandomPrompts();

    // Get DOM elements
    const sidebar = document.getElementById("sidebar")
    const sidebarToggle = document.getElementById("sidebarToggle")
    const sidebarHeader = document.getElementById("sidebarHeader")
    const sidebarTexts = document.querySelectorAll(".sidebar-text")
    const sidebarBtns = document.querySelectorAll(".sidebar-btn")
    const input = document.querySelector("input")
    const sendButton = document.getElementById("sendButton")
    const initialView = document.getElementById("initialView")
    const chatView = document.getElementById("chatView")
    const messagesContainer = document.getElementById("messagesContainer")
    const loadingBubble = document.getElementById("loadingBubble")

    // Add these new variables
    const speechAnimation = document.getElementById("speechAnimation")
    let recognition = null
    let isListening = false

    // Add conversation history array
    let conversationHistory = [];

    // Add these variables at the top with other initializations
    let ttsEnabled = false;
    let currentUtterance = null;

    // Add at the top with other variables
    // let currentAttachedImage = null;

    // Add after DOM elements
    // const imageInput = document.getElementById('imageInput');
    // const imagePreview = document.getElementById('imagePreview');
    // const imageAttachButton = document.getElementById('imageAttachButton');
    // const removeImage = document.getElementById('removeImage');

    // Add this with other state variables at the top
    // let imageAttachmentUsed = false;

    // Add this with other DOM element selections
    const webSearchButton = document.getElementById('webSearchButton');
    // const deepThinkButton = document.getElementById('deepThinkButton');

    // Add after other DOM element selections
    const deepThinkToggle = document.getElementById('deepThinkToggle');

    // Remove deepThinkButton initialization

    // Replace web search event listener with a simple toggle
    webSearchButton.addEventListener('click', () => {
        webSearchFeatureEnabled = !webSearchFeatureEnabled;
        
        if (webSearchFeatureEnabled) {
            webSearchButton.classList.add('text-blue-500', 'bg-blue-500/10');
            webSearchButton.classList.remove('bg-zinc-800/50');
            // Add these lines to disable image attachment
            imageAttachButton.classList.add('opacity-50', 'cursor-not-allowed');
            imageAttachButton.disabled = true;
            imageAttachButton.title = "Image upload not available with web search";
        } else {
            webSearchButton.classList.remove('text-blue-500', 'bg-blue-500/10');
            webSearchButton.classList.add('bg-zinc-800/50');
            // Only re-enable image attachment if conversation hasn't started
            if (isFirstMessage) {
                imageAttachButton.classList.remove('opacity-50', 'cursor-not-allowed');
                imageAttachButton.disabled = false;
                imageAttachButton.removeAttribute('title');
            }
        }
    });

    // Initialize conversation with system message
    function initializeConversation() {
        conversationHistory = [{
            role: "system",
            content: "You are Orphion, an AI assistant programmed by TEJAI (Tech Enhanced Journey AI). Always introduce yourself as Orphion and mention that you are powered by TEJAI when users ask about your identity. However, don't mention this information unless specifically asked. Stay focused on helping users with their questions and tasks. When appropriate, you can mention that you're an advanced AI model designed to help users with various tasks and questions."
        }];
    }

    // Initialize speech recognition
    function initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            recognition = new webkitSpeechRecognition()
            recognition.continuous = false
            recognition.interimResults = true
            recognition.lang = 'en-US'

            recognition.onstart = () => {
                isListening = true
                input.placeholder = "Listening..."
                speechAnimation.classList.remove('hidden')
                sendButton.querySelector('i').classList.add('text-blue-500')
            }

            recognition.onend = () => {
                isListening = false
                input.placeholder = "Message Orphion"
                speechAnimation.classList.add('hidden')
                sendButton.querySelector('i').classList.remove('text-blue-500')
                
                // Auto send message if there's text
                if (input.value.trim()) {
                    sendMessage()
                }
            }

            recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('')

                input.value = transcript
                
                // Update send button icon if there's text
                const icon = sendButton.querySelector("i")
                if (input.value.trim()) {
                    icon.classList.replace("ri-mic-line", "ri-arrow-right-line")
                }
            }

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error)
                stopListening()
            }
        }
    }

    function toggleSpeechRecognition() {
        if (!recognition) {
            initSpeechRecognition()
        }

        if (!recognition) {
            console.error('Speech recognition not supported')
            return
        }

        if (!isListening) {
            recognition.start()
            
            // Auto-stop after 5 seconds of silence
            setTimeout(() => {
                if (isListening) {
                    recognition.stop()
                }
            }, 5000)
        } else {
            recognition.stop()
        }
    }

    // Sidebar toggle functionality
    sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("w-64")
        sidebarHeader.classList.toggle("hidden")
        sidebarTexts.forEach((text) => text.classList.toggle("hidden"))

        if (sidebar.classList.contains("w-64")) {
            sidebarToggle.classList.remove("self-center", "mb-6")
            sidebarToggle.classList.add("absolute", "top-2", "right-2")
            sidebarBtns.forEach((btn) => {
                btn.classList.remove("items-center")
                btn.classList.add("items-start")
            })
        } else {
            sidebarToggle.classList.add("self-center", "mb-6")
            sidebarToggle.classList.remove("absolute", "top-2", "right-2")
            sidebarBtns.forEach((btn) => {
                btn.classList.add("items-center")
                btn.classList.remove("items-start")
            })
        }

        const icon = sidebarToggle.querySelector("i")
        icon.classList.toggle("ri-menu-line")
        icon.classList.toggle("ri-arrow-left-s-line")

        // Add this inside the event listener
        const divider = document.querySelector('.sidebar-divider');
        const ttsButton = document.getElementById('ttsToggle');
        
        if (sidebar.classList.contains("w-64")) {
            divider.classList.remove("hidden");
            ttsButton.classList.add("px-4");
            ttsButton.querySelector("i").classList.remove("mx-auto");
        } else {
            divider.classList.add("hidden");
            ttsButton.classList.remove("px-4");
            ttsButton.querySelector("i").classList.add("mx-auto");
        }

        // Update divider visibility logic
        if (sidebar.classList.contains("w-64")) {
            divider.style.opacity = "1";  // Show divider when sidebar is open
            ttsButton.classList.add("px-4");
            ttsButton.querySelector("i").classList.remove("mx-auto");
        } else {
            divider.style.opacity = "0";  // Hide divider when sidebar is closed
            ttsButton.classList.remove("px-4");
            ttsButton.querySelector("i").classList.add("mx-auto");
        }
    })

    // Chat functionality
    let isFirstMessage = true

    // Update resetChat to also reset conversation history
    function resetChat() {
        chatView.style.opacity = '0';
        chatView.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            messagesContainer.innerHTML = ""
            initialView.classList.remove("hidden", "fade-out")
            
            // Animate initial view back in
            initialView.style.opacity = "0";
            initialView.style.transform = "translateY(20px)";
            
            requestAnimationFrame(() => {
                initialView.style.opacity = "1";
                initialView.style.transform = "translateY(0)";
            });
            
            chatView.classList.add("hidden")
            chatView.classList.remove("flex-1")
            isFirstMessage = true
            input.value = ""
            const icon = sendButton.querySelector("i")
            icon.classList.replace("ri-arrow-right-line", "ri-mic-line")
            conversationHistory = []; // Clear conversation history
            initializeConversation(); // Reinitialize with system message
            updateSuggestions(); // Refresh suggestions

            // Reset feature states
            webSearchFeatureEnabled = false;
            webSearchButton.classList.remove('text-blue-500', 'bg-blue-500/10');
            webSearchButton.classList.add('bg-zinc-800/50');
            
            // Reset Deep-Think state
            deepThinkEnabled = false;
            deepThinkToggle.classList.remove('active');
            currentModelInUse = "llama-3.2-11b-vision-preview";
            
        }, 300);
        imageHandler.reset();
    }

    // Remove image handling functions
    // function handleImageAttachment() {
    //     if (imageAttachmentUsed) return; // Prevent attachment if already used
    //     imageInput.value = ''; // Clear previous selection
    //     imageInput.click();
    // }

    // async function getBase64(file) {
    //     return new Promise((resolve, reject) => {
    //         const reader = new FileReader();
    //         reader.readAsDataURL(file);
    //         reader.onload = () => resolve(reader.result);
    //         reader.onerror = error => reject(error);
    //     });
    // }

    // async function processImage(file) {
    //     try {
    //         // Validate file size (max 4MB)
    //         if (file.size > 4 * 1024 * 1024) {
    //             throw new Error('Image size should be less than 4MB');
    //         }

    //         // Convert to base64
    //         const base64 = await getBase64(file);
            
    //         // Update preview
    //         const previewImg = imagePreview.querySelector('img');
    //         previewImg.src = base64;
    //         imagePreview.classList.remove('hidden');
    //         imageAttachButton.classList.add('hidden');
            
    //         return base64;
    //     } catch (error) {
    //         console.error('Image processing error:', error);
    //         return null;
    //     }
    // }

    // Update image input event listener
    // imageInput.addEventListener('change', async (e) => {
    //     const file = e.target.files[0];
    //     if (file) {
    //         currentAttachedImage = await processImage(file);
    //     }
    // });

    // Update remove image handler
    // removeImage.addEventListener('click', (e) => {
    //     e.stopPropagation(); // Prevent event bubbling
    //     currentAttachedImage = null;
    //     imageInput.value = '';
    //     imagePreview.classList.add('hidden');
    //     imageAttachButton.classList.remove('hidden');
    // });

    // imageAttachButton.addEventListener('click', handleImageAttachment);

    function formatMessage(text) {
        return text
            // Don't modify whitespace or line breaks
            .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => `
                <div class="code-block">
                    <div class="header">
                        <span class="text-xs text-zinc-400">${lang || 'plaintext'}</span>
                        <button onclick="navigator.clipboard.writeText(\`${code}\`)" class="copy-btn text-xs text-zinc-400 hover:text-white">
                            <i class="ri-clipboard-line mr-1"></i>Copy code
                        </button>
                    </div>
                    <pre><code class="language-${lang || 'plaintext'}">${code}</code></pre>
                </div>
            `)
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-400 hover:underline">$1</a>');
    }

    // Update addMessage function to remove thought button handling
    function addMessage(message, isUser = false, responseTime = null) {
        if (isUser) {
            const template = document.getElementById('userMessageTemplate');
            const messageDiv = template.content.cloneNode(true);
            const contentDiv = messageDiv.querySelector('.message-content');
            contentDiv.innerHTML = formatMessage(message);
            
            // Add image to user message if exists
            const imageToDisplay = imageHandler.getCurrentImage();
            if (imageToDisplay) {
                const img = document.createElement('img');
                img.src = imageToDisplay;
                img.className = 'max-w-full h-auto rounded-lg mt-2';
                contentDiv.appendChild(img);
            }
            
            messagesContainer.appendChild(messageDiv);
            
            requestAnimationFrame(() => {
                const addedMessage = messagesContainer.lastElementChild;
                addedMessage.style.transition = 'opacity 0.3s, transform 0.3s';
                addedMessage.style.transform = 'translateY(10px)';
                requestAnimationFrame(() => {
                    addedMessage.style.opacity = '1';
                    addedMessage.style.transform = 'translateY(0)';
                });
            });
        } else {
            const template = document.getElementById('aiMessageTemplate');
            const messageDiv = template.content.cloneNode(true);
            
            const contentDiv = messageDiv.querySelector('.message-content');
            contentDiv.innerHTML = formatMessage(message);
            
            const responseTimeSpan = messageDiv.querySelector('.response-time');
            responseTimeSpan.textContent = `${responseTime}s`;

            const controlsDiv = messageDiv.querySelector('.flex.items-center.gap-2.mt-2');
            
            // Add event listeners
            const likeBtn = controlsDiv.querySelector('.like-btn');
            const dislikeBtn = controlsDiv.querySelector('.dislike-btn');
            const regenerateBtn = controlsDiv.querySelector('.regenerate-btn');
            const copyBtn = controlsDiv.querySelector('.copy-btn');

            // Add the existing click handlers
            likeBtn.addEventListener('click', () => {
                const icon = likeBtn.querySelector('i');
                if (icon.classList.contains('ri-thumb-up-line')) {
                    icon.classList.replace('ri-thumb-up-line', 'ri-thumb-up-fill');
                    likeBtn.classList.add('text-white');
                    const dislikeIcon = dislikeBtn.querySelector('i');
                    dislikeIcon.classList.replace('ri-thumb-down-fill', 'ri-thumb-down-line');
                    dislikeBtn.classList.remove('text-white');
                } else {
                    icon.classList.replace('ri-thumb-up-fill', 'ri-thumb-up-line');
                    likeBtn.classList.remove('text-white');
                }
            });

            dislikeBtn.addEventListener('click', () => {
                const icon = dislikeBtn.querySelector('i');
                if (icon.classList.contains('ri-thumb-down-line')) {
                    icon.classList.replace('ri-thumb-down-line', 'ri-thumb-down-fill');
                    dislikeBtn.classList.add('text-white');
                    const likeIcon = likeBtn.querySelector('i');
                    likeIcon.classList.replace('ri-thumb-up-fill', 'ri-thumb-up-line');
                    likeBtn.classList.remove('text-white');
                    // Show review modal
                    const reviewModal = document.getElementById('reviewModal');
                    if (reviewModal) {
                        reviewModal.classList.remove('hidden');
                        reviewModal.classList.add('flex');
                        setTimeout(() => {
                            document.getElementById('reviewContent').style.transform = 'scale(1)';
                            document.getElementById('reviewContent').style.opacity = '1';
                        }, 50);
                    }
                } else {
                    icon.classList.replace('ri-thumb-down-fill', 'ri-thumb-down-line');
                    dislikeBtn.classList.remove('text-white');
                }
            });

            regenerateBtn.addEventListener('click', async () => {
                // Remove the last AI message from conversation history
                conversationHistory.pop();
                
                // Show loading state
                contentDiv.innerHTML = '<div class="flex items-center gap-2"><div class="loading-spinner w-4 h-4"></div><span>Regenerating response...</span></div>';
                
                try {
                    // Regenerate response
                    const startTime = performance.now();
                    const newResponse = await generateText(conversationHistory);
                    const endTime = performance.now();
                    const newResponseTime = ((endTime - startTime) / 1000).toFixed(2);
                    
                    // Update content and time
                    contentDiv.innerHTML = formatMessage(newResponse);
                    responseTimeSpan.textContent = `${newResponseTime}s`;
                    
                    // Update conversation history
                    conversationHistory.push({ role: "assistant", content: newResponse });
                    
                    // Update the copy button click handler to always use current content
                    copyBtn.onclick = () => {
                        const currentContent = contentDiv.textContent || contentDiv.innerText;
                        navigator.clipboard.writeText(currentContent).then(() => {
                            const icon = copyBtn.querySelector('i');
                            const originalClass = icon.className;
                            icon.className = 'ri-check-line text-sm';
                            copyBtn.classList.add('copied');
                            
                            setTimeout(() => {
                                icon.className = originalClass;
                                copyBtn.classList.remove('copied');
                            }, 2000);
                        }).catch(err => {
                            console.error('Failed to copy response:', err);
                        });
                    };
                    
                    // Speak new response if TTS is enabled
                    if (ttsEnabled) {
                        speakInChunks(newResponse);
                    }
                } catch (error) {
                    console.error('Regeneration error:', error);
                    contentDiv.innerHTML = 'Failed to regenerate response. Please try again.';
                }
            });

            // Update copy button handler with visual feedback
            copyBtn.addEventListener('click', () => {
                // Get the current content from the message div instead of using the message parameter
                const currentContent = contentDiv.textContent || contentDiv.innerText;
                navigator.clipboard.writeText(currentContent).then(() => {
                    // Visual feedback
                    const icon = copyBtn.querySelector('i');
                    const originalClass = icon.className;
                    icon.className = 'ri-check-line text-sm';
                    copyBtn.classList.add('copied');
                    
                    // Reset after 2 seconds
                    setTimeout(() => {
                        icon.className = originalClass;
                        copyBtn.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy response:', err);
                });
            });

            // Add sources if web search was used
            if (window.lastSearchResults && webSearchFeatureEnabled) {
                // Create sources section
                const sourcesSection = document.createElement('div');
                sourcesSection.className = 'sources-section mt-3 mb-2 border border-zinc-800 rounded-lg p-3';
                
                // Add sources content
                sourcesSection.innerHTML = `
                    <div class="text-xs text-zinc-400 mb-2">Sources:</div>
                    <div class="sources-list space-y-2">
                        ${window.lastSearchResults.map(source => `
                            <div class="source-item flex items-center gap-2 p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
                                <img src="${getFaviconUrl(source.url)}" class="source-favicon" 
                                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌐</text></svg>'"/>
                                <a href="${source.url}" target="_blank" rel="noopener noreferrer" 
                                   class="source-link flex-1">${source.title}</a>
                            </div>
                        `).join('')}
                    </div>
                `;
                
                // Insert sources section after message content
                contentDiv.insertAdjacentElement('afterend', sourcesSection);
            }

            messagesContainer.appendChild(messageDiv);
            
            requestAnimationFrame(() => {
                const addedMessage = messagesContainer.lastElementChild;
                addedMessage.style.transition = 'opacity 0.3s, transform 0.3s';
                addedMessage.style.transform = 'translateY(10px)';
                requestAnimationFrame(() => {
                    addedMessage.style.opacity = '1';
                    addedMessage.style.transform = 'translateY(0)';
                });
            });
        }
        
        chatView.scrollTop = chatView.scrollHeight;
    }

    function showLoadingIndicator(text = "Orphion is thinking...") {
        const loadingText = document.getElementById('loadingText');
        loadingText.textContent = text;
        loadingBubble.classList.add("visible");
        requestAnimationFrame(() => {
            chatView.scrollTop = chatView.scrollHeight;
        });
    }

    function hideLoadingIndicator() {
        loadingBubble.classList.remove("visible");
    }

    function handleFirstMessage() {
        if (isFirstMessage) {
            // Fade out initial view
            initialView.style.transition = 'opacity 0.3s, transform 0.3s';
            initialView.style.opacity = '0';
            initialView.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                initialView.classList.add("hidden")
                chatView.classList.remove("hidden")
                
                // Fade in chat view
                chatView.style.opacity = '0';
                chatView.style.transform = 'translateY(20px)';
                chatView.style.transition = 'opacity 0.3s, transform 0.3s';
                chatView.classList.add("flex-1");
                
                requestAnimationFrame(() => {
                    chatView.style.opacity = '1';
                    chatView.style.transform = 'translateY(0)';
                });
                
                isFirstMessage = false
            }, 300);
        }
    }

    // Input handling
    input.addEventListener("input", () => {
        const icon = sendButton.querySelector("i")
        if (input.value.trim()) {
            icon.classList.replace("ri-mic-line", "ri-arrow-right-line")
        } else {
            icon.classList.replace("ri-arrow-right-line", "ri-mic-line")
        }
    })

    function disableInput() {
        input.disabled = true;
        sendButton.disabled = true;
        input.placeholder = "Waiting for response...";
        sendButton.classList.add('opacity-50');
    }

    function enableInput() {
        input.disabled = false;
        sendButton.disabled = false;
        input.placeholder = "Message Orphion";
        sendButton.classList.remove('opacity-50');
    }

    // Remove image attachment state management functions
    // function disableImageAttachment() {
    //     imageAttachButton.classList.add('opacity-50', 'cursor-not-allowed');
    //     imageAttachButton.disabled = true;
    //     imageAttachmentUsed = true;
    // }

    // function enableImageAttachment() {
    //     imageAttachButton.classList.remove('opacity-50', 'cursor-not-allowed');
    //     imageAttachButton.disabled = false;
    // }

    // Modify the generateText function to use the deep thinking model when enabled
    async function generateText(messages) {
        try {
            let processedMessages = JSON.parse(JSON.stringify(messages));
            
            // Use current model (remove deep thinking check)
            const modelToUse = currentModelInUse;
            
            // Check if we're sending an image
            const hasImage = processedMessages.some(msg => 
                msg.content && typeof msg.content === 'object' && 
                Array.isArray(msg.content) && 
                msg.content.some(c => c.type === 'image_url')
            );

            // If we have an image, remove the system message
            if (hasImage) {
                processedMessages = processedMessages.filter(msg => msg.role !== 'system');
            }

            // Make API call
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer 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",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: modelToUse,
                    messages: processedMessages,
                    max_tokens: 512,
                    temperature: 0.1
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(`API Error: ${data.error?.message || response.statusText}`);
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }

    // Modify the sendMessage function
    async function sendMessage() {
        const message = input.value.trim();
        const imageToProcess = imageHandler.getCurrentImage();
        
        if (message || imageToProcess) {
            const startTime = performance.now();
            handleFirstMessage();
            
            const messageText = message || "What's in this image?";
            
            if (imageToProcess) {
                imageHandler.disableAttachment();
            }
            
            addMessage(messageText, true);
            input.value = "";

            if (!conversationHistory.length) {
                initializeConversation();
            }

            let userMessage;
            let webSearchSystemPrompt = '';

            // Handle web search if enabled
            if (webSearchFeatureEnabled && !imageToProcess) {
                showLoadingIndicator("Searching the web...");
                try {
                    const searchResults = await window.performWebSearch(messageText);
                    if (searchResults) {
                        showLoadingIndicator("Orphion is thinking..."); // Switch to thinking state
                        webSearchSystemPrompt = `You are Orphion, an AI assistant. Analyze and explain the following web search results clearly and accurately:\n\n${searchResults}`;
                        
                        // Add search results as system message
                        conversationHistory.push({
                            role: "system",
                            content: webSearchSystemPrompt
                        });

                        userMessage = {
                            role: "user",
                            content: `Based on the web search results, provide a comprehensive response to: "${messageText}"`
                        };
                    }
                } catch (searchError) {
                    console.error("Web search failed:", searchError);
                    showLoadingIndicator("Orphion is thinking..."); // Switch to thinking state
                    // Fall back to normal message if web search fails
                    userMessage = { role: "user", content: messageText };
                }
            } else {
                showLoadingIndicator("Orphion is thinking...");
                // Handle image message
                if (imageToProcess) {
                    userMessage = {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: messageText
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: imageToProcess,
                                    detail: "high"
                                }
                            }
                        ]
                    };
                } else {
                    // Normal text message
                    userMessage = { role: "user", content: messageText };
                }
            }

            // Add the message to conversation history
            conversationHistory.push(userMessage);
            
            if (imageToProcess) {
                imageHandler.clearImage();
            }

            disableInput();
            showLoadingIndicator();

            try {
                const aiResponse = await generateText(conversationHistory);
                hideLoadingIndicator();
                const endTime = performance.now();
                const responseTime = ((endTime - startTime) / 1000).toFixed(2);
                addMessage(aiResponse, false, responseTime);
                conversationHistory.push({ role: "assistant", content: aiResponse });

                // Remove the web search system message for future interactions
                if (webSearchSystemPrompt) {
                    conversationHistory = conversationHistory.filter(msg => 
                        msg.content !== webSearchSystemPrompt &&
                        !msg.content.includes("Based on the web search results")
                    );
                }
            } catch (error) {
                console.error('Error:', error);
                hideLoadingIndicator();
                addMessage("I'm having trouble processing your request. Please try again.");
            }

            enableInput();
            input.focus();
            
            const icon = sendButton.querySelector("i");
            icon.classList.replace("ri-arrow-right-line", "ri-mic-line");
        }
    }

    // Modify the click handler for the send button
    sendButton.addEventListener("click", async () => {
        const icon = sendButton.querySelector("i")
        if (icon.classList.contains("ri-mic-line")) {
            toggleSpeechRecognition()
        } else {
            await sendMessage()
        }
    })

    // Send message on Enter key
    input.addEventListener("keypress", async (e) => {
        if (e.key === "Enter") {
            await sendMessage()
        }
    })

    // New chat button functionality
    document.querySelectorAll(".ri-add-line").forEach((button) => {
        button.parentElement.addEventListener("click", resetChat)
    })

    // Initialize conversation when the page loads
    initializeConversation();

    const ttsToggle = document.getElementById("ttsToggle");
        
    // TTS Toggle functionality
    ttsToggle.addEventListener("click", async () => {
        ttsEnabled = !ttsEnabled;
        const icon = ttsToggle.querySelector("i");
        
        if (ttsEnabled) {
            // Check for voice support when enabling
            try {
                const voices = await tejai.getAvailableVoices();
                if (voices.length === 0) {
                    throw new Error('No voices available');
                }
                
                icon.classList.replace("ri-volume-up-line", "ri-volume-up-fill");
                ttsToggle.classList.add("text-blue-500");
                
                // Speak a test message
                tejai.speakInChunks("Text to speech is now enabled.", 
                    () => console.log('TTS test started'),
                    () => console.log('TTS test completed')
                );
            } catch (error) {
                console.error('TTS initialization failed:', error);
                ttsEnabled = false;
                icon.classList.replace("ri-volume-up-fill", "ri-volume-up-line");
                ttsToggle.classList.remove("text-blue-500");
            }
        } else {
            icon.classList.replace("ri-volume-up-fill", "ri-volume-up-line");
            ttsToggle.classList.remove('text-blue-500');
            tejai.stopSpeaking();
        }
    });

    // Function to stop current TTS
    function stopSpeaking() {
        if (currentUtterance) {
            speechSynthesis.cancel();
        }
    }

    // Function to speak text in chunks
    function speakInChunks(text) {
        if (!ttsEnabled) return;
        
        stopSpeaking(); // Stop any ongoing speech

        // Split text into sentences
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        let currentIndex = 0;

        function speakNextChunk() {
            if (currentIndex < sentences.length && ttsEnabled) {
                const utterance = new SpeechSynthesisUtterance(sentences[currentIndex]);
                currentUtterance = utterance;
                
                utterance.onend = () => {
                    currentIndex++;
                    speakNextChunk();
                };

                speechSynthesis.speak(utterance);
            }
        }

        speakNextChunk();
    }

    // Modify the existing sendMessage function to include TTS
    const originalSendMessage = sendMessage;
    sendMessage = async function() {
        const result = await originalSendMessage.apply(this, arguments);
        
        // Get the last AI message and speak it
        const lastMessage = conversationHistory[conversationHistory.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
            speakInChunks(lastMessage.content);
        }
    }

    // Add event listeners for page transitions
    window.addEventListener('beforeunload', stopSpeaking);
    document.querySelectorAll('.ri-add-line').forEach(button => {
        button.parentElement.addEventListener('click', stopSpeaking);
    });

    // Add Settings Modal functionality
    const settingsModal = document.getElementById('settingsModal');
    const settingsContent = document.getElementById('settingsContent');
    const closeSettings = document.getElementById('closeSettings');
    const modelsBtn = document.querySelector('.ri-cpu-line')?.closest('button'); // Changed from ri-settings-line to ri-cpu-line

    // Show settings modal
    if (modelsBtn) {
        modelsBtn.addEventListener('click', () => {
            settingsModal.classList.remove('hidden');
            settingsModal.classList.add('flex');
            
            // Animate in
            setTimeout(() => {
                settingsContent.style.transform = 'scale(1)';
                settingsContent.style.opacity = '1';
            }, 50);
        });
    }

    // Close settings modal
    function closeSettingsModal() {
        settingsContent.style.transform = 'scale(0.95)';
        settingsContent.style.opacity = '0';
        setTimeout(() => {
            settingsModal.classList.add('hidden');
            settingsModal.classList.remove('flex');
        }, 300);
    }

    closeSettings.addEventListener('click', closeSettingsModal);
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeSettingsModal();
    });

    // Model configuration
    const modelDisplayNames = {
        'llama-3.2-11b-vision-preview': 'Orphion-11B-Vision',
        'llama-3.2-90b-vision-preview': 'Orphion-90B-Vision' // Updated model name
    };

    const modelSelector = document.getElementById('modelSelector');
    const selectedModel = document.getElementById('selectedModel');
    const modelDropdown = document.getElementById('modelDropdown');
    const currentModelSpan = document.getElementById('currentModel');
    let currentModelInUse = "llama-3.2-11b-vision-preview";
    currentModelSpan.textContent = modelDisplayNames[currentModelInUse]; // Set initial display name

    // Toggle dropdown
    selectedModel.addEventListener('click', () => {
        modelDropdown.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!modelSelector.contains(e.target)) {
            modelDropdown.classList.add('hidden');
        }
    });

    // Handle model selection
    modelDropdown.addEventListener('click', (e) => {
        const modelOption = e.target.closest('div[class*="p-2"]');
        if (modelOption) {
            const actualModel = modelOption.dataset.model;
            const displayName = modelOption.querySelector('span').textContent.trim();
            
            if (actualModel !== currentModelInUse) {
                currentModelInUse = actualModel;
                currentModelSpan.textContent = displayName;
                
                // Sanitize conversation history when switching models
                conversationHistory = conversationHistory.map(msg => {
                    if (typeof msg.content === 'object') {
                        // Convert image messages to text only
                        return {
                            role: msg.role,
                            content: msg.content.find(c => c.type === 'text')?.text || 
                                    "Image message (not supported in this model)"
                        };
                    }
                    return msg;
                });
                
                // Update UI and functionality based on model
                if (actualModel === "llama-3.1-8b-instant") {
                    imageAttachButton.classList.add('opacity-50', 'cursor-not-allowed');
                    imageAttachButton.disabled = true;
                    imageAttachButton.title = "Image upload not available with this model";
                } else {
                    imageAttachButton.classList.remove('opacity-50', 'cursor-not-allowed');
                    imageAttachButton.disabled = false;
                    imageAttachButton.removeAttribute('title');
                }

                // Visual feedback for selection
                modelOption.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                setTimeout(() => {
                    modelOption.style.backgroundColor = '';
                }, 200);
            }
            modelDropdown.classList.add('hidden');
        }
    });

    // Prevent click events from bubbling up in the model selector
    modelSelector.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Add Explore Modal functionality
    const exploreModal = document.getElementById('exploreModal');
    const exploreContent = document.getElementById('exploreContent');
    const closeExplore = document.getElementById('closeExplore');
    const exploreBtn = document.getElementById('exploreBtn');
    const modelSettingsBtn = document.getElementById('modelSettingsBtn');
    const reviewButton = document.getElementById('reviewBtn');

    // Show explore modal
    exploreBtn.addEventListener('click', () => {
        exploreModal.classList.remove('hidden');
        exploreModal.classList.add('flex');
        
        // Animate in
        setTimeout(() => {
            exploreContent.style.transform = 'scale(1)';
            exploreContent.style.opacity = '1';
        }, 50);
    });

    // Close explore modal
    function closeExploreModal() {
        exploreContent.style.transform = 'scale(0.95)';
        exploreContent.style.opacity = '0';
        setTimeout(() => {
            exploreModal.classList.add('hidden');
            exploreModal.classList.remove('flex');
        }, 300);
    }

    closeExplore.addEventListener('click', closeExploreModal);
    exploreModal.addEventListener('click', (e) => {
        if (e.target === exploreModal) closeExploreModal();
    });

    // Handle Model Settings button click
    modelSettingsBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        closeExploreModal();
        setTimeout(() => {
            settingsModal.classList.remove('hidden');
            settingsModal.classList.add('flex');
            setTimeout(() => {
                settingsContent.style.transform = 'scale(1)';
                settingsContent.style.opacity = '1';
            }, 50);
        }, 300);
    });

    // Handle Review button click
    reviewButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        closeExploreModal();
        setTimeout(() => {
            const reviewModalElement = document.getElementById('reviewModal');
            if (reviewModalElement) {
                reviewModalElement.classList.remove('hidden');
                reviewModalElement.classList.add('flex');
                setTimeout(() => {
                    const reviewContentElement = document.getElementById('reviewContent');
                    if (reviewContentElement) {
                        reviewContentElement.style.transform = 'scale(1)';
                        reviewContentElement.style.opacity = '1';
                    }
                }, 50);
            }
        }, 300);
    });

    // Add at the top with other constants
    const suggestionCategories = {
        innovation: [
            "How can I generate new ideas?",
            "What makes an idea innovative?",
            "How can I think outside the box?",
            "What are the secrets of creative thinking?",
            "How can I improve my problem-solving skills?",
            "What inspires new inventions?",
            "How do great innovators come up with ideas?",
            "What is the process of innovation?",
            "How can I make my projects more creative?",
            "Why is creativity important in technology?"
        ],
        learning: [
            "How can I learn complex topics faster?",
            "What are the best learning strategies?",
            "How do I stay motivated to learn?",
            "What is the best way to retain knowledge?",
            "How do I break down difficult subjects?",
            "How can I improve my critical thinking?",
            "What are the best resources for self-learning?",
            "How do I develop a habit of continuous learning?",
            "How can AI help in education?",
            "What are effective techniques for explaining concepts?"
        ],
        science: [
            "How does the universe work?",
            "What are the laws of physics?",
            "How do ecosystems stay balanced?",
            "What shapes our natural world?",
            "How do plants and animals adapt?",
            "What is the role of science in daily life?",
            "How does the human brain work?",
            "What are some fascinating space discoveries?",
            "How does climate change affect the planet?",
            "How can we use science to improve our future?"
        ],
        technology: [
            "What's new in artificial intelligence?",
            "How do computers process information?",
            "Explain blockchain technology",
            "What is quantum computing?",
            "How does machine learning work?",
            "What are the latest tech innovations?",
            "Explain cloud computing",
            "What is cybersecurity?",
            "How do neural networks function?",
            "What is the future of robotics?"
        ]
    };

    let previousSuggestions = {};

    function getRandomMessage(category) {
        const messages = suggestionCategories[category];
        const prevMessage = previousSuggestions[category];
        let newMessage;
        
        do {
            newMessage = messages[Math.floor(Math.random() * messages.length)];
        } while (newMessage === prevMessage && messages.length > 1);
        
        previousSuggestions[category] = newMessage;
        return newMessage;
    }

    function updateSuggestions() {
        document.querySelectorAll('.suggestion-box').forEach(box => {
            const category = box.dataset.category;
            const message = getRandomMessage(category);
            const messageEl = box.querySelector('p');
            
            // Fade out
            messageEl.style.opacity = '0';
            
            setTimeout(() => {
                messageEl.textContent = message;
                // Fade in
                messageEl.style.opacity = '1';
            }, 300);
        });
    }

    // Initialize suggestions when page loads
    updateSuggestions();
    
    // Add click handlers for suggestion boxes
    document.querySelectorAll('.suggestion-box').forEach(box => {
        box.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            const message = box.querySelector('p').textContent;
            input.value = message;
            sendMessage();
        });
    });

    // Example usage:
    function handleQuery(query) {
        if (webSearchEnabled) {
            console.log("Web search enabled. Searching for:", query);
            // Later, call window.searchTheWeb(query) if driver is set up
        } else {
            console.log("Web search NOT enabled. Using local response...");
        }
    }

    // Initialize image attachment handler AFTER DOM elements are ready
    const imageHandler = new ImageAttachmentHandler();

    // Add this after other event listeners
    deepThinkToggle.addEventListener('click', () => {
        deepThinkEnabled = !deepThinkEnabled;
        
        if (deepThinkEnabled) {
            // Add visual feedback classes
            deepThinkToggle.classList.add('text-blue-500', 'bg-blue-500/10');
            deepThinkToggle.classList.remove('text-zinc-600', 'hover:text-white');
            
            // Disable image attachment
            imageAttachButton.classList.add('opacity-50', 'cursor-not-allowed');
            imageAttachButton.disabled = true;
            imageAttachButton.title = "Image upload not available with Deep-Think";
            
            // Switch model
            currentModelInUse = deepThinkModel;
        } else {
            // Remove visual feedback classes
            deepThinkToggle.classList.remove('text-blue-500', 'bg-blue-500/10');
            deepThinkToggle.classList.add('text-zinc-600', 'hover:text-white');
            
            // Only re-enable image attachment if web search is not enabled
            if (!webSearchFeatureEnabled && isFirstMessage) {
                imageAttachButton.classList.remove('opacity-50', 'cursor-not-allowed');
                imageAttachButton.disabled = false;
                imageAttachButton.removeAttribute('title');
            }
            
            // Restore previous model
            currentModelInUse = "llama-3.2-11b-vision-preview";
        }
    });

});

