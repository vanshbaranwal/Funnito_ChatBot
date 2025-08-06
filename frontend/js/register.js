
// register user part
document.getElementById("registerForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const registerEmail = document.getElementById("registerEmail").value;
    const registerPassword = document.getElementById("registerPassword").value;

    try {    

        if (!name || !registerEmail || !registerPassword) {
            document.getElementById("registerMessage").textContent = "Please fill in all fields.";
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
            document.getElementById("registerMessage").textContent = "Registration successful!!";

            setTimeout(() => {
               window.location.href = "/frontend/pages/verify.html"; 
            }, 3000);
        } else{
            document.getElementById("registerMessage").textContent = data.message || "Registration failed";
        }
    } catch (error) {
        document.getElementById("registerMessage").textContent = "An error occurred";
    }
})




