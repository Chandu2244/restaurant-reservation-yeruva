const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());
const path = require("path");
require("dotenv").config();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const dbPath = path.join(__dirname, "database.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};


initializeDBAndServer();

//test
app.get("/", (request, response) => {
  response.send("Restaurant Reservation API is running 🚀");
});



//Authentication Token middleware 
const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, process.env.JWT_SECRET, async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.user_id = payload.user_id;
        request.role = payload.role;
        next();
      }
    });
  }
};

//Admin Authentication middleware
const authorizeAdmin = (request, response, next) => {
  if (request.role !== "ADMIN") {
    response.status(403);
    response.send("Admin access required");
  } else {
    next();
  }
};


//Register User/Admin API
app.post("/register", async (request, response) => {
  const { email, password, role } = request.body;

  const checkUserQuery = `
    SELECT * FROM users WHERE email = '${email}'
`;
  const dbUser = await db.get(checkUserQuery);

  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);

    const createUserQuery = `
      INSERT INTO users (email, password, role)
      VALUES ('${email}', '${hashedPassword}', '${role}')
    `;
    await db.run(createUserQuery);

    response.status(200);
    response.send("User created successfully");
  }
});


//Login User/Admin API
app.post("/login", async (request, response) => {
  const { email, password } = request.body;

  const selectUserQuery = `
    SELECT * FROM users WHERE email = '${email}'
  `;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      dbUser.password
    );

    if (isPasswordMatched === true) {
      const payload = {
        user_id: dbUser.id,
        role: dbUser.role
      };

      const jwtToken = jwt.sign(payload,process.env.JWT_SECRET);
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

//Reservations User API
app.post("/reservations", authenticateToken, async (request, response) => {
  const { date, time_slot, guests } = request.body;
  const userId = request.user_id;

  // Step 1: get tables with enough capacity
  const tablesQuery = `
    SELECT * FROM tables WHERE capacity >= ${guests}
  `;
  const tables = await db.all(tablesQuery);

  let assignedTable = null;

  // Step 2: check availability
  for (let table of tables) {
    const conflictQuery = `
      SELECT * FROM reservations
      WHERE table_id = ${table.id}
      AND date = '${date}'
      AND time_slot = '${time_slot}'
      AND status = 'ACTIVE'
    `;
    const conflict = await db.get(conflictQuery);

    if (conflict === undefined) {
      assignedTable = table;
      break;
    }
  }

  if (assignedTable === null) {
    response.status(409);
    response.send("No tables available for selected time");
    return;
  }

  // Step 3: create reservation
  const createReservationQuery = `
    INSERT INTO reservations (user_id, table_id, date, time_slot, guests, status)
    VALUES (${userId}, ${assignedTable.id}, '${date}', '${time_slot}', ${guests}, 'ACTIVE')
  `;
  await db.run(createReservationQuery);

  response.status(201);
  response.send("Reservation created successfully");
});


//GET User Reservations API
app.get("/reservations/", authenticateToken, async (request, response) => {
  const userId = request.user_id;
  const query = `
    SELECT r.*, t.table_number
    FROM reservations r
    JOIN tables t ON r.table_id = t.id
    WHERE r.user_id = ${userId}
  `;
  const reservations = await db.all(query);

  response.send(reservations);
});

//Cancel User Reservation API
app.delete(
  "/reservations/:id",
  authenticateToken,
  async (request, response) => {
    const { id } = request.params;
    const userId = request.user_id;

    // 1. Check reservation belongs to user
    const reservation = await db.get(`
      SELECT * FROM reservations
      WHERE id = ${id} AND user_id = ${userId}
    `);

    if (reservation === undefined) {
      response.status(403);
      response.send("You are not allowed to cancel this reservation");
      return;
    }

    // 2. Cancel reservation (soft delete)
    await db.run(`
      UPDATE reservations
      SET status = 'CANCELLED'
      WHERE id = ${id}
    `);

    response.send("Reservation cancelled successfully");
  }
);


//Admin GET Reservations API
app.get(
  "/admin/reservations",
  authenticateToken,
  authorizeAdmin,
  async (request, response) => {
    const { date } = request.query;

    let query = `
      SELECT r.*, u.email, t.table_number
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN tables t ON r.table_id = t.id
    `;

    if (date !== undefined) {
      query += ` WHERE r.date = '${date}'`;
    }
   
    const reservations = await db.all(query);

     if (date !== undefined && reservations.length === 0) {
      response.status(200);
      response.send("No reservations on selected date");
      return;
    }
    response.send(reservations);
  }
);

//Admin Cancel Reservation API
app.delete(
  "/admin/reservations/:id",
  authenticateToken,
  authorizeAdmin,
  async (request, response) => {
    const { id } = request.params;

    const reservation = await db.get(
      `SELECT * FROM reservations WHERE id = ${id}`
    );

    if (reservation === undefined) {
      response.status(404);
      response.send("Reservation not found");
      return;
    }

    await db.run(`
      UPDATE reservations
      SET status = 'CANCELLED'
      WHERE id = ${id}
    `);

    response.send("Reservation cancelled successfully");
  }
);


//Admin Update Reservation API
app.put(
  "/admin/reservations/:id",
  authenticateToken,
  authorizeAdmin,
  async (request, response) => {
    const { id } = request.params;
    const { date, time_slot, guests } = request.body;

    // 1. Get reservation + table capacity
    const reservation = await db.get(`
      SELECT r.*, t.capacity
      FROM reservations r
      JOIN tables t ON r.table_id = t.id
      WHERE r.id = ${id}
    `);

    if (reservation === undefined) {
      response.status(404);
      response.send("Reservation not found");
      return;
    }

    // 2. Capacity check
    if (guests > reservation.capacity) {
      response.status(400);
      response.send("Guests exceed table capacity");
      return;
    }

    // 3. Conflict check (EXCLUDE current reservation)
    const conflict = await db.get(`
      SELECT id FROM reservations
      WHERE table_id = ${reservation.table_id}
      AND date = '${date}'
      AND time_slot = '${time_slot}'
      AND status = 'ACTIVE'
      AND id != ${id}
    `);

    if (conflict !== undefined) {
      response.status(409);
      response.send("Table already booked for selected date and time");
      return;
    }

    // 4. Update reservation
    await db.run(`
      UPDATE reservations
      SET date = '${date}',
          time_slot = '${time_slot}',
          guests = ${guests}
      WHERE id = ${id}
    `);

    response.send("Reservation updated successfully");
  }
);






