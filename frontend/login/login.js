/* =========================
   Form Elements
========================= */
const myFormEl = document.getElementById("myForm");

const emailEl = document.getElementById("email");
const emailErrMsgEl = document.getElementById("emailErrMsg");

const passwordEl = document.getElementById("password");
const passwordErrMsgEl = document.getElementById("passwordErrMsg");

const loginBtn = document.getElementById("loginBtn");
const errorMsg = document.getElementById("errorMsg");

/* =========================
   Input Field Validation
========================= */

// Email validation on blur
emailEl.addEventListener("blur", function (event) {
  if (event.target.value === "") {
    emailErrMsgEl.textContent = "Required*";
  } else {
    emailErrMsgEl.textContent = "";
  }
});

// Password validation on blur
passwordEl.addEventListener("blur", function (event) {
  if (event.target.value === "") {
    passwordErrMsgEl.textContent = "Required*";
  } else {
    passwordErrMsgEl.textContent = "";
  }
});

/* =========================
   Prevent Default Form Submit
========================= */
myFormEl.addEventListener("submit", function (event) {
  event.preventDefault();
});

/* =========================
   API Configuration
========================= */
const API_BASE = "http://localhost:3000";

/* =========================
   Login Handler
========================= */
loginBtn.onclick = async () => {
  const email = emailEl.value.trim();
  const password = passwordEl.value.trim();

  // Basic validation before API call
  if (!email || !password) {
    errorMsg.innerText = "Please enter email and password";
    return;
  }

  try {
    // API request
    const response = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    // Read response as text (handles both success & error)
    const text = await response.text();

    // Handle login error
    if (!response.ok) {
      errorMsg.innerText = text;
      return;
    }

    // Parse successful response
    const data = JSON.parse(text);

    /* =========================
       Token Handling
    ========================= */

    // Store JWT token
    const token = data.jwtToken;
    localStorage.setItem("token", token);

    // Decode token to get role
    const payload = JSON.parse(atob(token.split(".")[1]));
    const role = payload.role;

    /* =========================
       Role-based Redirection
    ========================= */
    if (role === "ADMIN") {
      window.location.href = "../admin/admin.html";
    } else {
      window.location.href = "../user/user.html";
    }

  } catch (error) {
    // Server or network error
    errorMsg.innerText = "Server error. Please try again.";
  }
};
