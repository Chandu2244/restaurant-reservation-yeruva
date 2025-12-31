let myFormEl = document.getElementById("myForm");

let passwordEl = document.getElementById("password");
let passwordErrMsgEl = document.getElementById("passwordErrMsg");

let emailEl = document.getElementById("email");
let emailErrMsgEl = document.getElementById("emailErrMsg");

passwordEl.addEventListener("blur", function(event) {
  if (event.target.value === "") {
    passwordErrMsgEl.textContent = "Required*";
  } else {
    passwordErrMsgEl.textContent = "";
  }
});

emailEl.addEventListener("blur", function(event) {
  if (event.target.value === "") {
    emailErrMsgEl.textContent = "Required*";
  } else {
    emailErrMsgEl.textContent = "";
  }
});

myFormEl.addEventListener("submit", function(event) {
  event.preventDefault();
});

const API_BASE = "http://localhost:3000";

const loginBtn = document.getElementById("loginBtn");
const errorMsg = document.getElementById("errorMsg");

loginBtn.onclick = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    errorMsg.innerText = "Please enter email and password";
    return;
  }

  
  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    console.log(data);

    if (!response.ok) {
      errorMsg.innerText = data;
      return;
    }

    // 1️⃣ Store token
    const token = data.jwtToken;
    localStorage.setItem("token", token);

    // 2️⃣ Decode token to get role
    const payload = JSON.parse(atob(token.split(".")[1]));
    const role = payload.role;

    // 3️⃣ Redirect based on role
    if (role === "ADMIN") {
      window.location.href = "../admin/admin.html";
    } else {
      window.location.href = "../user/user.html";
    }

  } catch (error) {
    errorMsg.innerText = "Server error. Please try again.";
  }
};
