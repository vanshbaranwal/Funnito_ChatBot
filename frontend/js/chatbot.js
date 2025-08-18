
// get all dom elements
const messageContainer = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const typingIndicator = document.getElementById("typingIndicator");

// auto resize textarea function
function autoResize(){
    messageInput.style.height = 'auto';
    const maxHeight = 120;
    const scrollHeight = messageInput.scrollHeight;
    messageInput.style.height = Math.min(scrollHeight, maxHeight) + 'px'; 
}

// update send button state
function updateSendButton(){
    const hasText = messageInput.value.trim().length > 0;
    sendBtn.disabled = !hasText;
    sendBtn.style.opacity = hasText ? '1' : '0.5';
}

// add message to chat
function addMessage(text, type){
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;

    messageContainer.appendChild(messageDiv);
    scrollToBottom();
}

// show typing indicator
function showTypingIndicator(){
    typingIndicator.style.display = 'block';
    messageContainer.appendChild(typingIndicator);
    scrollToBottom();
}

// hide typing indicator
function hideTypingIndicator(){
    typingIndicator.style.display = 'none';
}

// scroll to bottom
function scrollToBottom(){
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

// send message function
function sendMessage(){
    const message = messageInput.value.trim();
    if(!message) return;

    // add user message
    addMessage(message, 'user');

    // clear input
    messageInput.value = '';
    autoResize();
    updateSendButton();

    // show typing indicator and echo the messages
    showTypingIndicator();

    setTimeout(() => {
        hideTypingIndicator();
        addMessage(message, 'bot'); // echo the same message
    }, 1000 + Math.random() * 1000); // random delay between 1-2 seconds
}

// event listeners
sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter' && !e.shiftKey){
        e.preventDefault();
        sendMessage();
    }
});

messageInput.addEventListener('input', () => {
    autoResize();
    updateSendButton();
});

// initial button state
updateSendButton();