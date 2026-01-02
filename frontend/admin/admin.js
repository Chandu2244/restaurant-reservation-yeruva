/* =========================
   Constants & Config
========================= */
const API_BASE = "https://restaurant-reservation-yeruva.onrender.com";
const token = localStorage.getItem("token");

/* =========================
   DOM Elements
========================= */
const searchBtn = document.getElementById("searchBtn");
const dateInput = document.getElementById("dateFilter");
const tableBody = document.getElementById("reservationsBody");
const logoutBtn = document.getElementById("logoutBtn");

/* =========================
   Logout Handler
========================= */
logoutBtn.onclick = () => {
  const confirmLogout = confirm("Are you sure you want to logout?");

  if (confirmLogout) {
    localStorage.removeItem("token");
    window.location.href = "../login/login.html";
  }
  // If "No" → stay on the same page
};

/* =========================
   Search / Filter Handler
========================= */
searchBtn.onclick = fetchReservations;

/* =========================
   Fetch Reservations (GET)
========================= */
async function fetchReservations() {
  // Clear existing rows
  tableBody.innerHTML = "";

  let url = `${API_BASE}/admin/reservations`;

  // Apply date filter if selected
  const selectedDate = dateInput.value.trim();
  if (selectedDate) {
    url += `?date=${selectedDate}`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  // Read response as text (can be JSON or message)
  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text; // backend sent plain message
  }

  // If backend sends message instead of array
  if (typeof data === "string") {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6">${data}</td>
      </tr>
    `;
    return;
  }

  // Render reservations
  data.forEach((r) => {
    const tr = document.createElement("tr");
    tr.id = `row-${r.id}`;

    tr.innerHTML = `
      <td>${r.email}</td>
      <td>${r.date}</td>
      <td>${r.time_slot}</td>
      <td>${r.guests}</td>
      <td>${r.table_number}</td>
      <td class="action-cell">
        ${
          r.status === "CANCELLED"
            ? "Cancelled"
            : `
              <button class="icon-btn update-btn" onclick="enableEdit(${r.id})" title="Update">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="icon-btn delete-btn" onclick="cancelReservation(${r.id})" title="Cancel">
                <i class="fa-solid fa-trash"></i>
              </button>
            `
        }
      </td>
    `;

    tableBody.appendChild(tr);
  });
}

/* =========================
   Enable Inline Edit
========================= */
function enableEdit(id) {
  const row = document.getElementById(`row-${id}`);

  const date = row.children[1].textContent.trim();
  const time = row.children[2].textContent.trim();
  const guests = row.children[3].textContent.trim();

  // Replace cells with inputs
  row.children[1].innerHTML = `<input type="date" value="${date}" />`;
  row.children[2].innerHTML = `<select>${getTimeSlotOptions(time)}</select>`;
  row.children[3].innerHTML = `<input type="number" value="${guests}" />`;
  const guestsInput = row.children[3].querySelector("input");

  // 1–12 only, max 2 digits, strict
  guestsInput.addEventListener("keydown", (e) => {
    const value = guestsInput.value;

    // Allow backspace & delete
    if (e.key === "Backspace" || e.key === "Delete") return;

    // Block more than 2 digits
    if (value.length >= 2) {
      e.preventDefault();
      return;
    }

    // Allow 1–9 when empty
    if (value === "" && /^[1-9]$/.test(e.key)) return;

    // Allow 10, 11, 12 only
    if (value === "1" && (e.key === "0" || e.key === "1" || e.key === "2")) {
      return;
    }

    // Block everything else
    e.preventDefault();
  });

  // Replace action buttons
  row.children[5].innerHTML = `
    <button class="icon-btn update-btn" onclick="saveEdit(${id})">
      <i class="fa-solid fa-check"></i>
    </button>
    <button class="icon-btn delete-btn" onclick="fetchReservations()">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;
}

/* =========================
   Save Updated Reservation (PUT)
========================= */
async function saveEdit(id) {
  const row = document.getElementById(`row-${id}`);

  const date = row.children[1].querySelector("input").value;
  const time_slot = row.children[2].querySelector("select").value;
  const guests = row.children[3].querySelector("input").value;

  const response = await fetch(`${API_BASE}/admin/reservations/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ date, time_slot, guests })
  });

  const text = await response.text();

  // Handle backend validation errors
  if (!response.ok) {
    alert(text); // e.g. "Guests exceed table capacity"
    return;
  }

  fetchReservations(); // refresh table
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

/* =========================
   Cancel Reservation (DELETE)
========================= */
async function cancelReservation(id) {
  const confirmCancel = confirm("Cancel this reservation?");
  if (!confirmCancel) return;

  await fetch(`${API_BASE}/admin/reservations/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  fetchReservations(); // refresh table
}

/* =========================
   Initial Load
========================= */
fetchReservations();
