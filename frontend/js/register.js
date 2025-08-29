
// register user part
document.getElementById("registerForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const registerEmail = document.getElementById("registerEmail").value;
    const registerPassword = document.getElementById("registerPassword").value;
    const registerMessage = document.getElementById("registerMessage").value;

    try {    

        if (!name || !registerEmail || !registerPassword) {
            registerMessage.textContent = "Please fill in all fields.";
            return;
        };
    
        const res = await fetch("http://localhost:3000/api/v1/users/register", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                name: name,
                email: registerEmail,
                password: registerPassword,
            })
        });
        const data = await res.json();

        if(res.ok){
            registerMessage.textContent = "Registration successful!!";
            registerMessage.style.display = "block";

            setTimeout(() => {
               window.location.href = "/frontend/pages/verify.html"; 
            }, 3000);
        } else{
            registerMessage.textContent = data.message || "Registration failed";
            registerMessage.style.display = "block";
        }
    } catch (error) {
        registerMessage.textContent = "An error occurred";
        registerMessage.style.display = "block";
    }
});




