const logoutBtn = document.getElementById("logoutBtn");
const dateInput = document.getElementById("date");
const timeSlotInput = document.getElementById("timeSlot");
const guestsInput = document.getElementById("guests");
const bookBtn = document.getElementById("bookBtn");
const reservationsBody = document.getElementById("reservationsBody");



logoutBtn.onclick = () => {
  const confirmLogout = confirm("Are you sure you want to logout?");

  if (confirmLogout) {
    localStorage.removeItem("token");
    window.location.href = "../login/login.html";
  }
  // if No → stay on same page (do nothing)
};



//POST Fetch call
bookBtn.onclick = async () => {
  const date = dateInput.value.trim();
  const time_slot = timeSlotInput.value.trim();
  const guests = guestsInput.value.trim();

  if (!date || !time_slot || !guests) {
    alert("All fields are required");
    return;
  }

  const token = localStorage.getItem("token");

  const response = await fetch("http://localhost:3000/reservations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ date, time_slot, guests })
  });

  const message = await response.text();
  alert(message);

  if (response.ok) {
    fetchMyReservations(); // 🔁 refresh table
  }
};

//GET Fetch call
async function fetchMyReservations() {
  const token = localStorage.getItem("token");

  const response = await fetch("http://localhost:3000/reservations/", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();
  renderReservations(data);
}


//Render rows
async function fetchMyReservations() {
  reservationsBody.innerHTML = "";

  const res = await fetch("http://localhost:3000/reservations/", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  });

  const data = await res.json();

  data.forEach(r => {
    const tr = document.createElement("tr");

    let actionContent = "";

    if (r.status === "CANCELLED") {
      actionContent = `<span class="cancelled-text">Cancelled</span>`;
    } else {
      actionContent = `
        <button class="text-cancel-btn" onclick="cancelReservation(${r.id})">
          Cancel
        </button>
      `;
    }

    tr.innerHTML = `
      <td>${r.date}</td>
      <td>${r.time_slot}</td>
      <td>${r.guests}</td>
      <td>${r.table_number}</td>
      <td>${actionContent}</td>
    `;

    reservationsBody.appendChild(tr);
  });
}


//Cancel Reservation
async function cancelReservation(id) {
  const confirmCancel = confirm("Are you sure you want to cancel?");
  if (!confirmCancel) return;

  const token = localStorage.getItem("token");

  await fetch(`http://localhost:3000/reservations/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  fetchMyReservations(); // refresh after cancel
}

fetchMyReservations()