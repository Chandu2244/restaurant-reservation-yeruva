/* =========================
   Constants & DOM Elements
========================= */
const API_BASE = "https://restaurant-reservation-yeruva.onrender.com";

const logoutBtn = document.getElementById("logoutBtn");
const dateInput = document.getElementById("date");
const timeSlotInput = document.getElementById("timeSlot");
const guestsInput = document.getElementById("guests");
const bookBtn = document.getElementById("bookBtn");
const reservationsBody = document.getElementById("reservationsBody");

/* =========================
   Utility
========================= */
function getToken() {
  return localStorage.getItem("token");
}

/* =========================
   Logout
========================= */
logoutBtn.onclick = () => {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("token");
    window.location.href = "../login/login.html";
  }
};

/* =========================
   Create Reservation (POST)
========================= */
bookBtn.onclick = async () => {
  const date = dateInput.value.trim();
  const time_slot = timeSlotInput.value.trim();
  const guests = guestsInput.value.trim();

  if (!date || !time_slot || !guests) {
    alert("All fields are required");
    return;
  }

  const response = await fetch(`${API_BASE}/reservations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify({ date, time_slot, guests })
  });

  const message = await response.text();
  alert(message);

  if (response.ok) {
    fetchMyReservations();
  }
};


guestsInput.addEventListener("keydown", (e) => {
  const value = guestsInput.value;

  // Allow backspace & delete
  if (e.key === "Backspace" || e.key === "Delete") return;

  // Block more than 2 characters
  if (value.length >= 2) {
    e.preventDefault();
    return;
  }

  // Allow 1–9 when empty
  if (value === "" && /^[1-9]$/.test(e.key)) return;

  // Allow 10, 11, 12 only
  if (
    value === "1" &&
    (e.key === "0" || e.key === "1" || e.key === "2")
  ) {
    return;
  }

  // Block everything else
  e.preventDefault();
});

/* =========================
   Fetch + Render Reservations
========================= */
async function fetchMyReservations() {
  reservationsBody.innerHTML = "";

  const response = await fetch(`${API_BASE}/reservations`, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  const data = await response.json();
  renderReservations(data);
}

/* =========================
   Render Table Rows
========================= */
function renderReservations(data) {
  data.forEach((r) => {
    const tr = document.createElement("tr");

    const action =
      r.status === "CANCELLED"
        ? `<span class="cancelled-text">Cancelled</span>`
        : `<button class="text-cancel-btn" onclick="cancelReservation(${r.id})">Cancel</button>`;

    tr.innerHTML = `
      <td>${r.date}</td>
      <td>${r.time_slot}</td>
      <td>${r.guests}</td>
      <td>${r.table_number}</td>
      <td>${action}</td>
    `;

    reservationsBody.appendChild(tr);
  });
}

/* =========================
   Time Slot Options Generator
========================= */
function getTimeSlotOptions(selectedTime) {
  let options = "";

  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, "0") + ":00";
    options += `
      <option value="${hour}" ${hour === selectedTime ? "selected" : ""}>
        ${hour}
      </option>
    `;
  }

  return options;
}
timeSlotInput.innerHTML = getTimeSlotOptions();

/* =========================
   Cancel Reservation (DELETE)
========================= */
async function cancelReservation(id) {
  if (!confirm("Are you sure you want to cancel?")) return;

  await fetch(`${API_BASE}/reservations/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  fetchMyReservations();
}

/* =========================
   Initial Load
========================= */
fetchMyReservations();
