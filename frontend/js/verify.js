// verify user part
document.getElementById("verifyForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const token = document.getElementById("verificationToken").value;

    const res = await fetch("http://localhost:3000/api/v1/users/verify", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            token: token,
        })
    });
    
    const data = await res.json();
    
    if(res.ok && data.success){
        document.getElementById("verifyMessage").textContent = data.message;
        setTimeout(() => {
            window.location.href = "/frontend/pages/chatbot.html";
        }, 3000);
    } else{
        document.getElementById("verifyMessage").textContent = data.message || "verification failed"; 
    }
});
