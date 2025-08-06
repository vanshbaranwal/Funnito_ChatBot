// login user part
document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const loginEmail = document.getElementById("loginEmail").value;
    const loginPassword = document.getElementById("loginPassword").value;
    
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
        document.getElementById("loginMessage").textContent = data.message;
        // show chatbot ui hide login form
    } else{
        // show error message
        document.getElementById("loginMessage").textContent = data.message || "login failed";
    }
});
