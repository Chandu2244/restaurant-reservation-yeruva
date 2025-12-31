const API_BASE = "http://localhost:3000";
const token = localStorage.getItem("token");

const searchBtn = document.getElementById("searchBtn");
const dateInput = document.getElementById("dateFilter");
const tableBody = document.getElementById("reservationsBody");
logoutBtn = document.getElementById("logoutBtn");   

logoutBtn.onclick = () => {
  const confirmLogout = confirm("Are you sure you want to logout?");

  if (confirmLogout) {
    localStorage.removeItem("token");
    window.location.href = "../login/login.html";
  }
  // if No → stay on same page (do nothing)
};



searchBtn.onclick = fetchReservations;

async function fetchReservations() {
  tableBody.innerHTML = "";

  let url = `${API_BASE}/admin/reservations`;

  const selectedDate = dateInput.value.trim();
  if (selectedDate) {
    url += `?date=${selectedDate}`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }


  if (typeof data === "string") {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6">${data}</td>
      </tr>
    `;
    return;
  }

  data.forEach(r => {
    const tr = document.createElement("tr");
    tr.setAttribute("data-id", r.id);
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

function enableEdit(id) {
  const row = document.getElementById(`row-${id}`);
  const date = row.children[1].innerText;
  const time = row.children[2].innerText;
  const guests = row.children[3].innerText;

  row.children[1].innerHTML = `<input type="date" value="${date}" />`;
  row.children[2].innerHTML = `<input type="text" value="${time}" />`;
  row.children[3].innerHTML = `<input type="number" value="${guests}" />`;

  row.children[5].innerHTML = `
    <button class="icon-btn update-btn" onclick="saveEdit(${id})">
      <i class="fa-solid fa-check"></i>
    </button>
    <button class="icon-btn delete-btn" onclick="fetchReservations()">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;
}

async function saveEdit(id) {
  const row = document.getElementById(`row-${id}`);

  const date = row.children[1].querySelector("input").value;
  const time_slot = row.children[2].querySelector("input").value;
  const guests = row.children[3].querySelector("input").value;

  await fetch(`${API_BASE}/admin/reservations/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ date, time_slot, guests })
  });

  fetchReservations(); // refresh table
}

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

// Load on page load
fetchReservations();
