
# 🍽️ Restaurant Reservation Management System

A full-stack web application to manage restaurant table reservations with **role-based access** for **Admin** and **Users**.

🔗 **Live Demo (Render)**: https://tablebook-bfgg.onrender.com/

---

## 📌 Features

### 👤 Authentication & Authorization

* Email + Password based login
* JWT authentication
* Role-based access control (ADMIN / USER)

---

### 👥 User Features

* Create a reservation (date, time slot, guests)
* View own reservations
* Cancel own reservations
* Cannot access admin functionality

---

### 🛠️ Admin Features

* View all reservations
* Search reservations **with or without date**
* Update reservation (date, time slot, guests)
* Capacity validation while updating
* Conflict prevention (no double booking)
* Cancel any reservation

---

## 🧱 Tech Stack

**Frontend**

* HTML
* CSS
* JavaScript (Fetch API)

**Backend**

* Node.js
* Express.js
* SQLite
* JWT (jsonwebtoken)
* bcrypt
* cors

**Deployment**

* Render


## 🧠 Database Design

### Tables

* **users**

  * id, email, password, role
* **tables**

  * id, table_number, capacity
* **reservations**

  * id, user_id, table_id, date, time_slot, guests, status

### Key Logic

* Tables are assigned based on **capacity**
* Double booking is prevented using:

  * date + time_slot + table_id
* Cancellation is handled using **soft delete** (`status = CANCELLED`)

---

## 🔐 Seeded Users (Demo Credentials)

| Role  | Email                                   | Password    |
| ----- | --------------------------------------- | ----------- |
| Admin | [admin@demo.com](mailto:admin@demo.com) | admin123    |
| User  | [user1@demo.com](mailto:user1@demo.com) | password123 |
| User  | [user2@demo.com](mailto:user2@demo.com) | password123 |
| User  | [user3@demo.com](mailto:user3@demo.com) | password123 |

---

## 🔁 Reservation Flow

### Create Reservation (User)

1. User submits date, time slot, guests
2. Backend:

   * Finds a table with sufficient capacity
   * Ensures no conflict for same table, date, time
3. Reservation is created with status `ACTIVE`

---

### Update Reservation (Admin)

* Admin can update:

  * Date
  * Time slot
  * Guests
* Backend validations:

  * Guests ≤ table capacity
  * No conflicting reservation exists

---

### Cancel Reservation

* Users can cancel **only their own** reservations
* Admin can cancel **any** reservation
* Cancelled reservations do not block availability

---

## 🌐 API Overview

### Auth

* `POST /login`

### User APIs

* `POST /reservations`
* `GET /reservations/my`
* `DELETE /reservations/:id`

### Admin APIs

* `GET /admin/reservations`
* `GET /admin/reservations?date=YYYY-MM-DD`
* `PUT /admin/reservations/:id`
* `DELETE /admin/reservations/:id`

---

## 🔮 Future Improvements

* Dynamic table reassignment
* Pagination & sorting
* Better UI animations


---

## 🏁 Conclusion

This project demonstrates:

* Clean REST API design
* JWT-based role authorization
* Robust reservation conflict handling
* Clear separation of Admin & User responsibilities

