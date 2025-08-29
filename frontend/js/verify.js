// verify user part
document.getElementById("verifyForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const token = document.getElementById("verificationToken").value;
    const verifyMessage = document.getElementById("verifyMessage");

    try {
        const res = await fetch("http://localhost:3000/api/v1/users/verify", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                token: token,
            })
        });
        
        const data = await res.json();
        
        if(res.ok && data.success){
            verifyMessage.textContent = data.message;
            verifyMessage.style.display = "block";
            setTimeout(() => {
                window.location.href = "/frontend/pages/chatbot.html";
            }, 2000);
        } else{
            verifyMessage.textContent = data.message || "verification failed";
            verifyMessage.style.display = "block"; 
        }
    } catch (error) {
        verifyMessage.textContent = "An error occurred";
        verifyMessage.style.display = "block";
    }
});
