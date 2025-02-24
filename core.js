// Core functionality class

class TEJAICore {
    constructor() {
        this.currentModelInUse = "llama-3.2-11b-vision-preview";
        this.conversationHistory = [];
        this.recognition = null;
        this.isListening = false;
        this.ttsEnabled = false;
        this.currentUtterance = null;
    }

    // Initialize conversation
    initializeConversation() {
        this.conversationHistory = [{
            role: "system",
            content: "You are Orphion, an AI assistant programmed by TEJAI (Tech Enhanced Journey AI). Always introduce yourself as Orphion and mention that you are powered by TEJAI when users ask about your identity. However, don't mention this information unless specifically asked. Stay focused on helping users with their questions and tasks."
        }];
    }

    // Simplify generateText to remove image handling
    async generateText(messages) {
        try {
            let processedMessages = JSON.parse(JSON.stringify(messages));
            return await this.makeAPICall(processedMessages);
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }

    async makeAPICall(messages) {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": "Bearer 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",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: this.currentModelInUse, // This will now use the correct model
                messages: messages,
                max_tokens: 1024,
                temperature: 0.2
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`API Error: ${data.error?.message || response.statusText}`);
        }

        return data.choices[0].message.content;
    }

    // Speech Recognition
    initSpeechRecognition(callbacks) {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                callbacks.onStart?.();
            };

            this.recognition.onend = () => {
                this.isListening = false;
                callbacks.onEnd?.();
            };

            this.recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');
                callbacks.onResult?.(transcript);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                callbacks.onError?.(event);
            };
        }
    }

    toggleSpeechRecognition() {
        if (!this.recognition) return false;

        if (!this.isListening) {
            this.recognition.start();
            setTimeout(() => {
                if (this.isListening) {
                    this.recognition.stop();
                }
            }, 5000);
            return true;
        } else {
            this.recognition.stop();
            return false;
        }
    }

    // Text to Speech
    speakInChunks(text, onStart, onEnd) {
        if (!this.ttsEnabled) return;
        
        if (this.currentUtterance) {
            speechSynthesis.cancel();
        }

        // Function to initialize and configure voices
        const setupVoice = () => {
            const voices = speechSynthesis.getVoices();
            
            // Priority order: British English Male -> British English -> Any English -> First Available
            const voice = voices.find(v => v.lang === 'en-GB' && v.name.includes('Male')) ||
                         voices.find(v => v.lang === 'en-GB') ||
                         voices.find(v => v.lang.startsWith('en')) ||
                         voices[0];
                         
            // Store preferred voice
            if (voice) {
                localStorage.setItem('preferredVoice', voice.name);
            }
            
            return voice;
        };

        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        let currentIndex = 0;

        const speakNextChunk = () => {
            if (currentIndex < sentences.length && this.ttsEnabled) {
                const utterance = new SpeechSynthesisUtterance(sentences[currentIndex]);
                this.currentUtterance = utterance;
                
                // Configure voice settings
                const voice = setupVoice();
                if (voice) {
                    utterance.voice = voice;
                }

                // Enhanced voice settings
                utterance.rate = 0.9; // Slightly slower
                utterance.pitch = 1.0; // Natural pitch
                utterance.volume = 1.0;
                
                // Handle various speech events
                utterance.onstart = () => {
                    onStart?.();
                    console.log('Speaking chunk:', currentIndex + 1, 'of', sentences.length);
                };

                utterance.onend = () => {
                    currentIndex++;
                    if (currentIndex < sentences.length) {
                        setTimeout(speakNextChunk, 300); // Add slight pause between sentences
                    } else {
                        onEnd?.();
                        console.log('Finished speaking all chunks');
                    }
                };

                utterance.onerror = (event) => {
                    console.error('Speech synthesis error:', event);
                    onEnd?.();
                };

                speechSynthesis.speak(utterance);
            }
        };

        // Initialize voices and handle voice changes
        if (speechSynthesis.getVoices().length === 0) {
            speechSynthesis.addEventListener('voiceschanged', () => {
                setupVoice();
                speakNextChunk();
            }, { once: true });
        } else {
            speakNextChunk();
        }
    }

    // Add this new method for voice management
    async getAvailableVoices() {
        return new Promise((resolve) => {
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                resolve(voices);
            } else {
                speechSynthesis.addEventListener('voiceschanged', () => {
                    resolve(speechSynthesis.getVoices());
                }, { once: true });
            }
        });
    }

    // Add this method to handle speech synthesis errors
    handleSpeechError() {
        // Reset speech synthesis if it gets stuck
        speechSynthesis.cancel();
        this.currentUtterance = null;
        
        // Attempt to reinitialize speech synthesis
        if (speechSynthesis.speaking || speechSynthesis.pending) {
            speechSynthesis.cancel();
            setTimeout(() => {
                this.ttsEnabled = true;
            }, 100);
        }
    }

    stopSpeaking() {
        if (this.currentUtterance) {
            speechSynthesis.cancel();
        }
    }

    // Model management
    setModel(modelName) {
        this.currentModelInUse = modelName;
    }

    getModel() {
        return this.currentModelInUse;
    }

    // Conversation management
    addToConversation(message, isUser = true) {
        this.conversationHistory.push({
            role: isUser ? "user" : "assistant",
            content: message
        });
    }

    clearConversation() {
        this.conversationHistory = [];
        this.initializeConversation();
    }
}

// Export the class
window.TEJAICore = TEJAICore;
