

// getting all the elements from the html file.
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendButton = document.getElementById("sendButton");
const fileInput = document.getElementById("fileInput");
const selectedFilesDiv = document.getElementById("selectedFiles");
const typingIndicator = document.getElementById("typingIndicator");

// all the files that the user will select will be stored in this array.
let selectedFilesArray = [];

// set up all the event listners when the page loads
setupEventListners();

function setupEventListners() {
    // when the user selects the send button
    sendButton.addEventListener('click', () => {
        sendMessage();
    });

    // when the user presses enter in the text input
    chatInput.addEventListener('keydown', (event) => {
        if(event.key === 'Enter' && !event.shiftKey){
            event.preventDefault(); // don't add a new line
            sendMessage();
        }
    });

    // when user selects files
    fileInput.addEventListener('change', (event) => {
        handleFileSelection(event);
    });

    // auto resize the text input as user types
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        const newHeight = Math.min(chatInput.scrollHeight, 100); // need to know what this line does
        chatInput.style.height = newHeight + 'px';
    });

}

function handleFileSelection(event){
    const files = event.target.files; // get all the selected files

    // adding each file to our array (but not adding dublicates)
    for(let i=0; i<files.length; i++){
        const file = files[i];
        let isDuplicate = false;

        // check if we already have this file
        for(let j=0; j<selectedFilesArray.length; j++){
            if(selectedFilesArray[j].name === file.name && selectedFilesArray[j].size === file.size){
                isDuplicate = true;
                break;
            }
        }

        // only add if its not dublicate
        if(!isDuplicate){
            selectedFilesArray.push(file);
        }
    }

    updateSelectedFilesDisplay(); // show the files on screen
    event.target.value = ''; // clear the file input 
}

// show all the selected files on the screen
function updateSelectedFilesDisplay(){
    selectedFilesDiv.innerHTML = ''; // clear previous files

    // create a display element for each file
    for(let i=0; i<selectedFilesArray.length; i++){
        const file = selectedFilesArray[i];
        const fileElement = document.createElement("div");
        fileElement.className = 'selected-file';

        // choose the right icon for the file type
        const fileIcon = file.type.indexOf('image/') === 0 ? '🖼️' : '📄';

        // shorten long file names
        let fileName = file.name;
        if(fileName.length>20){
            fileName = fileName.substring(0, 20) + '...';
        }

        // create html for this file
        fileElement.innerHTML = 
            '<span>' + fileIcon + ' ' + fileName + '</span>' +
            '<button class="remove-file" onclick="removeFile(' + i + ')">x</button>';
        
        selectedFilesDiv.appendChild(fileElement);
    }
}

// remove a file from the selected files list 
function removeFile(index){
    selectedFilesArray.splice(index, 1); // remove the file at this position
    updateSelectedFilesDisplay();
}

// main function that sends the message
function sendMessage(){
    const message = chatInput.value.trim(); // get the text and remove the extra spaces
    const filesToSend = selectedFilesArray.slice(); // make a copy of the files array

    // don't send if there is no message or no files
    if(!message && filesToSend.length === 0){
        return;
    }

    // disable the input while we're processing
    sendButton.disabled = true;
    chatInput.disabled = true;


    // add the users message to the chat 
    if(message || filesToSend.length > 0){
        addMessage('user', message, filesToSend);
    }

    // clear the input 
    chatInput.value = '';
    selectedFilesArray = [];
    updateSelectedFilesDisplay();
    chatInput.style.height = 'auto';

    // show that the bot is typing
    showTypingIndicator();

    // wait a bit to make it more realistic, then show the bot's response
    const waitTime = 1000 + Math.random() * 1000; // random time between 1-2 seconds
    setTimeout(() => {
       hideTypingIndicator();
       addMessage('bot', message, filesToSend); // echo the message back
       
       // re-enable the input
       sendButton.disabled = false;
       chatInput.disabled = false;
       chatInput.focus();
    }, waitTime);
}

// show the typing indicator
function showTypingIndicator(){
    typingIndicator.style.display = 'flex';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// hide the typing indicator
function hideTypingIndicator(){
    typingIndicator.style.display = 'none';
}

// add a message to the chat
function addMessage(sender, text, files){
    // create the main message container
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ' + sender;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    // add text if there is any
    if(text){
        const textdiv = document.createElement('div');
        if(sender === 'bot' && text){
            textdiv.textContent = 'echo: ' + text;
        }else{
            textdiv.textContent = text
        }
        contentDiv.appendChild(textdiv);
    }

    // add file preview if there are any files
    if(files && files.length>0){
        for(let i=0; i<files.length; i++){
            createFilePreview(files[i], contentDiv);
        }
    }

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // scroll to the bottom to show messages
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// create a preview for the file
function createFilePreview(file, parentElement){
    const previewDiv = document.createElement('div');
    previewDiv.className = 'file-preview';

    if(file.type.indexOf('image/') === 0){
        // its an image file
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = file.name;

        // clean up the url when the image loads (to save memory)
        img.onload = function(){
            URL.revokeObjectURL(img.src);
        };

        previewDiv.appendChild(img);
    }else if(file.type === 'application/pdf'){
        // its a pdf file
        const pdfDiv = document.createElement('div');
        pdfDiv.className = 'pdf-preview';

        const fileSizeMB = (file.size/ 1024/ 1024).toFixed(2);

        pdfDiv.innerHTML = 
            '<div class="pdf-icon">PDF</div>' + '<div>' +
            '<div style="font-weight: 500;">' + file.name + '</div>' +
            '<div style="font-size: 12px; color: #666;">' + fileSizeMB + ' MB</div>' + '</div>';

        previewDiv.appendChild(pdfDiv);
    }else{
        // its some other type of file
        const fileDiv = document.createElement('div');
        fileDiv.className = 'pdf-preview';

        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
                
        fileDiv.innerHTML = 
            '<div class="pdf-icon">📄</div>' + '<div>' +
            '<div style="font-weight: 500;">' + file.name + '</div>' +
            '<div style="font-size: 12px; color: #666;">' + fileSizeMB + ' MB</div>' + '</div>';

        previewDiv.appendChild(fileDiv);
    }

    parentElement.appendChild(previewDiv);
}