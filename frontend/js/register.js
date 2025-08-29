
// register user part
document.getElementById("registerForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const registerEmail = document.getElementById("registerEmail").value;
    const registerPassword = document.getElementById("registerPassword").value;
    const registerMessage = document.getElementById("registerMessage").value;
    // const regex = /^[a-zA-Z0-9_]+$/;

    try {    

        if (!name || !registerEmail || !registerPassword) {
            registerMessage.textContent = "Please fill in all fields.";
            return;
        };
        
        // if(!regex.test(username)){
        //     registerMessage.textContent = "the username should contain letters, numbers and underscores."
        //     return;
        // }
    
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
            document.getElementById("registerMessage").textContent = "Registration successful!!";
            document.getElementById("registerMessage").style.display = "block";

            setTimeout(() => {
               window.location.href = "/frontend/pages/verify.html"; 
            }, 3000);
        } else{
            document.getElementById("registerMessage").textContent = data.message || "Registration failed";
            document.getElementById("registerMessage").style.display = "block";
        }
    } catch (error) {
        document.getElementById("registerMessage").textContent = "An error occurred";
        document.getElementById("registerMessage").style.display = "block";
    }
})




