// login user part
document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const loginEmail = document.getElementById("loginEmail").value;
    const loginPassword = document.getElementById("loginPassword").value;
    const loginMessage = document.getElementById("loginMessage");

    try {        
        if (!loginEmail || !loginPassword) {
            loginMessage.textContent = "Please fill in all fields.";
            return;
        };
        
        const res = await fetch("http://localhost:3000/api/v1/users/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                email: loginEmail,
                password: loginPassword,
            })
        });
        const data = await res.json();
    
        if(res.ok){
            localStorage.setItem("token", data.token);
            loginMessage.textContent = data.message;
            loginMessage.style.display = "block";
            
            setTimeout(() => {
                window.location.href = "/frontend/pages/chatbot.html";
            }, 3000);
    
        } else{
            // show error message
            loginMessage.textContent = data.message || "login failed";
            loginMessage.style.display = "block";
        }
    } catch (error) {
        loginMessage.textContent = "An error occurred";
        loginMessage.style.display = "block";
    }
});
