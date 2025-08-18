
// get all dom elements
const messageContainer = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const attachBtn = document.getElementById("attachBtn");
const fileInput = document.getElementById("fileInput");
const typingIndicator = document.getElementById("typingIndicator");

// store message pairs (user message with its bot reply)
let messagePairs = [];

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

// get current time in 12 hr format
function getCurrentTime(){
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour 0 should be 12
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours}:${minutes} ${ampm}`;
}

// add message to chat
function addMessage(content, type, pairId = null, isFile = false){
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    if(pairId !== null){
        messageDiv.setAttribute('data-pair-id', pairId);
    }

    let messageText;

    if(isFile){
        if(content.type === "application/pdf"){
            messageText = document.createElement('a');
            messageText.href = URL.createObjectURL(content);
            messageText.textContent = "📄 " + content.name;
            messageText.target = "_blank";
        } else if(content.type.startsWith("image/")){
            messageText = document.createElement('img');
            messageText.src = URL.createObjectURL(content);
            messageText.style.maxWidth = "200px";
            messageText.style.borderRadius = "8px";
        } else{
            messageText = document.createElement('a');
            messageText.href = URL.createObjectURL(content);
            messageText.textContent = content.name;
            messageText.download = content.name;
        }
    } else{
        messageText = document.createElement('span');
        messageText.textContent = content;
    }

    const messageTime = document.createElement('span');
    messageTime.className = 'message-time';
    messageTime.textContent = getCurrentTime();

    // add delete button only for user message
    if(type === 'user'){
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteMessagePair(pairId);
        };
        messageDiv.appendChild(deleteBtn);
    }

    messageDiv.appendChild(messageText);
    messageDiv.appendChild(messageTime);

    messageContainer.appendChild(messageDiv);
    scrollToBottom();

    return messageDiv;
}

// delete message pair (user message + bot reply to the user)
function deleteMessagePair(pairId){
    const userMessage = document.querySelector(`[data-pair-id = "${pairId}"].user`);
    const botMessage = document.querySelector(`[data-pair-id = "${pairId}"].bot`);

    if(userMessage){
        userMessage.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            userMessage.remove();
        }, 300);
    }
    if(botMessage){
        botMessage.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            botMessage.remove();
        }, 300);
    }

    // remove from message pair array
    messagePairs = messagePairs.filter(pair => pair.Id !== pairId);
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

    // generate unique pair id
    const pairId = Date.now();

    // add user message
    addMessage(message, 'user', pairId);

    // store the pair
    messagePairs.push({id: pairId, userMessage: message});

    // clear input
    messageInput.value = '';
    autoResize();
    updateSendButton();

    // show typing indicator and echo the messages
    showTypingIndicator();

    setTimeout(() => {
        hideTypingIndicator();
        addMessage(message, 'bot', pairId); // echo the same message with same pair id
    }, 1000 + Math.random() * 1000); // random delay between 1-2 seconds
}

// send file function (pdf, images, and other files)
function sendFile(file){
    const pairId = Date.now();

    // show users uploaded file
    addMessage(file, 'user', pairId, true);

    // store pair
    messagePairs.push({id: pairId, userMessage: file.name});

    // bot response (echo file back)
    showTypingIndicator();
    setTimeout(() => {
        hideTypingIndicator();
        addMessage(file, 'bot', pairId, true);
    }, 1000 + Math.random() * 1000);
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

attachBtn.addEventListener('click', () => {
    fileInput.click();
});
fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if(file){
        sendFile(file);
    }
    e.target.value = ''; // reset so the same file can be uploaded again.
})

// initial button state
updateSendButton();