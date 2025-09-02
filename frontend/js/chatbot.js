// getting all the dom elements
const messageContainer = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const attachBtn = document.getElementById("attachBtn");
const fileInput = document.getElementById("fileInput");
const typingIndicator = document.getElementById("typingIndicator");
// user popup elements
const userIcon = document.getElementById("userIcon");
const userPopup = document.getElementById("userPopup");
const logoutBtn = document.getElementById("logoutBtn");

let userData = null;

async function fetchUserData() {
    try {
        const response = await fetch("http://localhost:5500/api/v1/users/get-profile", {
            method: "GET",
            credentials: "include" // ensures cookies token are sent
        });

        if(!response.ok){
            throw new Error("failed to fetch user profile.");
        }

        const data = await response.json();
        userData = {
            username: data.user.name,
            email: data.user.email,
            signedInAt: data.user.created_at,
        };
    } catch (error) {
        console.error("error fetching user profile: ", error);
    }
}



// storing user message and bot reply message.
let messages = [];

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
function addMessage(content, type, messageId = null, isFile = false){
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    //generating unique message id if not provided
    if(messageId === null){
        messageId = Date.now() + Math.random();
    }
    messageDiv.setAttribute('data-message-id', messageId);

    let messageText;

    if(isFile){
        if(content.type === "application/pdf"){
            messageText = document.createElement('a');
            messageText.href = URL.createObjectURL(content);
            messageText.textContent = "📄 " + content.name;
            messageText.target = "_blank"; // "_blank" means to open file in a new tab.

        } else if(content.type.startsWith("image/")){
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.target = "_blank";

            const img = document.createElement('img');
            img.src = link.href;
            img.style.maxWidth = "200px";
            img.style.borderRadius = "8px";

            link.appendChild(img);
            messageText = link; // this assigns an <a> tag containing an <img> tag.

        } else{
            messageText = document.createElement('a');
            messageText.href = URL.createObjectURL(content);
            messageText.textContent = content.name;
            messageText.download = content.name;
            messageText.target = "_blank";
        }
    } else{
        messageText = document.createElement('span');
        messageText.textContent = content;
    }

    const messageTime = document.createElement('span');
    messageTime.className = 'message-time';
    messageTime.textContent = getCurrentTime();

    // add delete button for user and bot messages
    if(type === 'user' || type === 'bot'){
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteIndividualMessage(messageId);
        };
        messageDiv.appendChild(deleteBtn);
    }

    messageDiv.appendChild(messageText);
    messageDiv.appendChild(messageTime);

    messageContainer.appendChild(messageDiv);
    scrollToBottom();

    return messageDiv;
}

// delete individual message
function deleteIndividualMessage(messageId){
    const messageElement = document.querySelector(`[data-message-id = "${messageId}"]`);

    if(messageElement){
        messageElement.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            messageElement.remove();
        }, 300);
    }

    // remove from messages array
    messages = messages.filter(msg => msg.id !== messageId);
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

    // generate unique message id for user message
    const userMessageId = Date.now() + Math.random();

    // add user message
    addMessage(message, 'user', userMessageId);

    // // store the pair
    // messagePairs.push({id: pairId, userMessage: message});

    // clear input
    messageInput.value = '';
    autoResize();
    updateSendButton();

    // show typing indicator and echo the messages
    showTypingIndicator();

    setTimeout(() => {
        hideTypingIndicator();
        const botMessageId = Date.now() + Math.random();
        addMessage(message, 'bot', botMessageId); // echo the same message with same pair id
    }, 1000 + Math.random() * 1000); // random delay between 1-2 seconds
}

// send file function (pdf, images, and other files)
function sendFile(file){
    const userMessageId = Date.now() + Math.random();

    // show users uploaded file
    addMessage(file, 'user', userMessageId, true);

    // bot response (echo file back)
    showTypingIndicator();
    setTimeout(() => {
        hideTypingIndicator();
        const botMessageId = Date.now() + Math.random();
        addMessage(file, 'bot', botMessageId, true);
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

// open popup when user icon is clicked
userIcon.addEventListener("click", (e) => {
    e.preventDefault();

    if(userData){
        document.getElementById("popupUsername").textContent = userData.username;
        document.getElementById("popupEmail").textContent = userData.email;
        document.getElementById("popupTime").textContent = userData.signedInAt;
    } else{
        document.getElementById("popupUsername").textContent = "guest";
        document.getElementById("popupEmail").textContent = "not logged inn";
        document.getElementById("popupTime").textContent = "-";
    }
    userPopup.style.display = "flex";
});

logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
        // calling backend logout route
        const response = await fetch("http://localhost:5500/api/v1/users/logout", {
            method: "POST",
            credentials: "include"
        });

        const data = await response.json();

        if(data.status){
            alert("logged out! successfully!");
            window.location.href = "/frontend/pages/index.html";
        } else{
            alert("log out failed: " + data.message);
        }

    } catch (error) {
        console.error("error logging out: ", error);
        alert("something went wrong while logging out.")
    }
});
window.addEventListener("click", (e) => {
    if(e.target === userPopup){
        userPopup.style.display = "none";
    }
});

// user profile call
fetchUserData();
// initial button state
updateSendButton();