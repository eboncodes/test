// Add sidebar initialization at the top
document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.querySelector('.menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const closeBtn = document.querySelector('.close-btn');
    const newChatBtn = document.querySelector('.sidebar-nav li:first-child');
    const imageGenBtn = document.querySelector('.sidebar-nav li:nth-child(2)');
    const whatsNewBtn = document.querySelector('.sidebar-nav li:nth-child(3)');

    function toggleSidebar() {
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
    }

    menuBtn?.addEventListener('click', toggleSidebar);
    closeBtn?.addEventListener('click', toggleSidebar);
    sidebarOverlay?.addEventListener('click', toggleSidebar);

    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            window.location.href = 'mobile.html';
        });
    }

    if (imageGenBtn) {
        imageGenBtn.addEventListener('click', () => {
            window.location.href = 'https://tejai-image-generator.vercel.app/';
        });
    }

    if (whatsNewBtn) {
        whatsNewBtn.addEventListener('click', () => {
            window.location.href = 'whats-new.html';
        });
    }

    // Handle back button if on what's new page
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'mobile.html';
        });
    }
});

// Initialize speech recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
}

// Get DOM elements
const micBtn = document.querySelector('.mic-btn');
const micIcon = micBtn.querySelector('i');
const messageInput = document.querySelector('.message-input input');
const messageContainer = document.querySelector('.message-input');

// Handle input changes
messageInput.addEventListener('input', () => {
    if (messageInput.value.trim() !== '') {
        micIcon.className = 'fas fa-arrow-right';
    } else {
        micIcon.className = 'fas fa-microphone';
    }
});

// Add enter key handler for message input
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && messageInput.value.trim() !== '') {
        sendMessage(messageInput.value);
        messageInput.value = '';
        micIcon.className = 'fas fa-microphone';
    }
});

// Handle microphone/send button clicks
let isRecording = false;

micBtn.addEventListener('click', () => {
    if (messageInput.value.trim() !== '') {
        // Handle send message
        sendMessage(messageInput.value);
        messageInput.value = '';
        micIcon.className = 'fas fa-microphone';
    } else if (SpeechRecognition) {
        // Handle voice recording
        if (!isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    } else {
        alert('Speech recognition is not supported in your browser.');
    }
});

function startRecording() {
    isRecording = true;
    messageContainer.classList.add('recording');
    recognition.start();
}

function stopRecording() {
    isRecording = false;
    messageContainer.classList.remove('recording');
    recognition.stop();
}

// Speech recognition handlers
if (recognition) {
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        messageInput.value = transcript;
        // Automatically send message after speech recognition
        sendMessage(transcript);
        messageInput.value = '';
        micIcon.className = 'fas fa-microphone';
    };

    recognition.onend = () => {
        stopRecording();
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopRecording();
    };
}

// Add click event listeners to cards
document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
        const question = card.querySelector('p').textContent;
        // Automatically send message when clicking a card
        sendMessage(question);
        messageInput.value = '';
        micIcon.className = 'fas fa-microphone';
    });
});

// Add conversation history array
let conversationHistory = [];

// Update the generateText function
async function generateText(messages) {
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": "Bearer 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",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: messages,
                temperature: 0.1,
                max_tokens: 512,
                presence_penalty: 0.1,
                frequency_penalty: 0.1
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("API Error:", error);
        return "I'm having trouble connecting. Please try again in a moment.";
    }
}

// Update sendMessage function to use the API
async function sendMessage(message) {
    const heroSection = document.querySelector('.hero-section');
    const cards = document.querySelector('.cards');
    const nextSuggestions = document.querySelector('.next-suggestions');
    
    // Initialize chat container if not exists
    let chatContainer = document.querySelector('.chat-container');
    if (!chatContainer) {
        chatContainer = document.createElement('div');
        chatContainer.className = 'chat-container';
        document.querySelector('main').appendChild(chatContainer);
    }

    // Add system message if it's not already present
    if (!conversationHistory.some(msg => msg.role === "system")) {
        conversationHistory.unshift({
            role: "system",
            content: "You are Orphion, an AI chatbot developed by the team at TEJAI. If users ask about your identity or anything else related to you, introduce yourself as Orphion when appropriate. Don't randomly tell about your identity if users haven't asked about it."
        });
    }

    // Add user message to conversation history
    conversationHistory.push({ role: "user", content: message });
    
    // Hide initial content with animation
    if (heroSection && cards) {
        heroSection.classList.add('fade-out');
        cards.classList.add('fade-out');
        if (nextSuggestions) nextSuggestions.style.display = 'none';
        
        setTimeout(() => {
            if (heroSection) heroSection.remove();
            if (cards) cards.remove();
            if (nextSuggestions) nextSuggestions.remove();
            chatContainer.classList.add('active');
        }, 300);
    }

    // Add user message with image if present
    addMessage(message, 'user');

    // Show loading indicator
    showLoadingIndicator();
    
    // Get AI response with image if present
    const aiResponse = await generateText(conversationHistory);
    
    // Add AI response to conversation history
    conversationHistory.push({ role: "assistant", content: aiResponse });
    
    // Remove loading indicator and display AI response
    removeLoadingIndicator();
    addMessage(aiResponse, 'ai');
    
    // Scroll to the latest message
    scrollToBottom();
}

function scrollToBottom() {
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// Update addMessage function to remove controls
function addMessage(text, sender) {
    const chatContainer = document.querySelector('.chat-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-bubble ${sender}`;
    
    const messageHTML = `
        <div class="avatar">
            ${sender === 'ai' ? '<img src="images/Orphion-icon-png.png" alt="Orphion">' : ''}
        </div>
        <div class="message-content">${text}</div>
    `;
    
    messageDiv.innerHTML = messageHTML;
    chatContainer.appendChild(messageDiv);
    scrollToBottom();
}

function showLoadingIndicator() {
    const chatContainer = document.querySelector('.chat-container');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-indicator';
    loadingDiv.innerHTML = `
        <div class="avatar">
            <img src="images/Orphion-icon-png.png" alt="Orphion">
        </div>
        <div class="loading-dots"></div>
    `;
    chatContainer.appendChild(loadingDiv);
}

function removeLoadingIndicator() {
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

// Add after existing button handlers
const newChatBtn = document.querySelector('.sidebar-nav li:first-child');

const ideaPrompts = [
    "Tell me a joke",
    "Give me a creative writing prompt",
    "Suggest a new business idea",
    "What are some innovative tech ideas?",
    "Share a unique art project idea"
];

const educationPrompts = [
    "Explain the theory of relativity",
    "What is quantum mechanics?",
    "Describe the process of photosynthesis",
    "What is the Pythagorean theorem?",
    "Explain the water cycle"
];

// Add more prompt categories
const creativePrompts = [
    "Write a short story",
    "Create a poem about nature",
    "Design a fictional character",
    "Invent a new superhero",
    "Describe a magical place"
];

const sciencePrompts = [
    "Explain black holes",
    "How does DNA work?",
    "What causes earthquakes?",
    "Describe cell division",
    "How do vaccines work?"
];

const promptSets = [
    { ideas: ideaPrompts, education: educationPrompts },
    { ideas: creativePrompts, education: sciencePrompts }
];

let currentPromptSetIndex = 0;

function getRandomPrompt(promptArray) {
    const randomIndex = Math.floor(Math.random() * promptArray.length);
    return promptArray[randomIndex];
}

function startNewChat() {
    // Clear conversation history
    conversationHistory = [];
    
    // Remove chat container if it exists
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
        chatContainer.remove();
    }
    
    // Create and add hero section with random prompts
    const main = document.querySelector('main');
    main.innerHTML = `
        <div class="hero-section">
            <div class="logo">
                <img src="images/Orphion-icon-png.png" alt="Orphion Logo">
            </div>
            <div class="welcome-text">
                <h2>Hi, I'm Orphion.</h2>
                <p>How can I help you today?</p>
            </div>
        </div>
        <div class="cards">
            <div class="card">
                <i class="fas fa-lightbulb"></i>
                <p>${getRandomPrompt(ideaPrompts)}</p>
            </div>
            <div class="card">
                <i class="fas fa-graduation-cap"></i>
                <p>${getRandomPrompt(educationPrompts)}</p>
            </div>
        </div>
    `;
    
    // Reattach card click events
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
            const question = card.querySelector('p').textContent;
            sendMessage(question);
            messageInput.value = '';
            micIcon.className = 'fas fa-microphone';
        });
    });

    // Close sidebar if open
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && sidebar.classList.contains('active')) {
        toggleSidebar();
    }
}

if (newChatBtn) {
    newChatBtn.addEventListener('click', startNewChat);
}

// Update the navigation handlers to be more robust
function initializeNavigation() {
    const sidebar = document.querySelector('.sidebar');
}

// Add this function before the DOMContentLoaded event listener at line 390
function initializeSidebar() {
    const menuBtn = document.querySelector('.menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const closeBtn = document.querySelector('.close-btn');

    if (menuBtn && sidebar && sidebarOverlay && closeBtn) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
        });

        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeSidebar();
    initializeNavigation();
});

// Add back button handler if we're on the What's New page
const backBtn = document.querySelector('.back-btn');
if (backBtn) {
    backBtn.addEventListener('click', () => {
        window.location.href = 'mobile.html';
    });
}

// Add next button handler
document.querySelector('.next-suggestions')?.addEventListener('click', updateSuggestionCards);

function updateSuggestionCards() {
    const cards = document.querySelector('.cards');
    const nextSet = promptSets[currentPromptSetIndex];
    
    // Add slide out animation
    cards.classList.add('slide-out');
    
    setTimeout(() => {
        // Update card content
        const cardElements = cards.querySelectorAll('.card p');
        cardElements[0].textContent = getRandomPrompt(nextSet.ideas);
        cardElements[1].textContent = getRandomPrompt(nextSet.education);
        
        // Reset position instantly
        cards.style.transition = 'none';
        cards.style.transform = 'translateX(-100%)';
        cards.style.opacity = '0';
        
        // Force reflow
        cards.offsetHeight;
        
        // Re-enable transition and slide in
        cards.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        cards.classList.remove('slide-out');
        cards.classList.add('slide-in');
        
        // Remove slide in class after animation
        setTimeout(() => {
            cards.classList.remove('slide-in');
            cards.style.transform = '';
            cards.style.opacity = '';
        }, 300);
    }, 300);
    
    // Update index for next time
    currentPromptSetIndex = (currentPromptSetIndex + 1) % promptSets.length;
}

// Move toggleSidebar to global scope
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    if (sidebar && sidebarOverlay) {
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
    }
}
