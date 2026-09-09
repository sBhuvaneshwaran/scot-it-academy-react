// ============================================================
// SCOT IT ACADEMY - BACKEND SERVER
// Node.js + Express + MySQL
// ============================================================

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

const JWT_SECRET =
  process.env.JWT_SECRET || "development-only-secret";

// ============================================================
// DATABASE
// ============================================================

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "student_management",

  waitForConnections: true,
  connectionLimit: 10,

  // IMPORTANT
  // MySQL DATE will remain YYYY-MM-DD
  dateStrings: true,

  charset: "utf8mb4",
};

const db = mysql.createPool(DB_CONFIG);

// ============================================================
// HELPERS
// ============================================================

function text(value) {
  return String(value ?? "").trim();
}

function amount(value, fallback = 0) {
  return Number.isFinite(Number(value))
    ? Number(value)
    : fallback;
}

function dateOnly(value) {
  if (!value) return null;

  const valueString = String(value).trim();

  if (!valueString) return null;

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(valueString)) {
    return valueString;
  }

  // ISO
  // 2026-09-04T18:30:00.000Z
  if (/^\d{4}-\d{2}-\d{2}T/.test(valueString)) {
    return valueString.substring(0, 10);
  }

  // DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(valueString)) {
    const [day, month, year] =
      valueString.split("-");

    return `${year}-${month}-${day}`;
  }

  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(valueString)) {
    const [day, month, year] =
      valueString.split("/");

    return `${year}-${month}-${day}`;
  }

  return null;
}

async function first(sql, params = []) {
  const [rows] = await db.execute(sql, params);
  return rows[0];
}

// ============================================================
// USER RESPONSE
// ============================================================

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };
}

// ============================================================
// JWT
// ============================================================

function issueToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

// ============================================================
// AUTH MIDDLEWARE
// ============================================================

function auth(req, res, next) {
  const header =
    req.headers.authorization || "";

  const token =
    header.startsWith("Bearer ")
      ? header.slice(7)
      : "";

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  try {
    req.user = jwt.verify(
      token,
      JWT_SECRET
    );

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
}

// ============================================================
// OWNER ONLY
// ============================================================

function ownerOnly(req, res, next) {
  if (req.user?.role !== "Owner") {
    return res.status(403).json({
      message: "Owner access required.",
    });
  }

  next();
}

// ============================================================
// MAP STUDENT
// ============================================================

function mapStudent(row) {
  const paidFee = amount(row.paid_fee);

  const balanceFee =
    amount(row.balance_fee);

  const totalFee =
    amount(
      row.total_fee,
      paidFee + balanceFee
    );

  const nextFollowUpDate =
    dateOnly(row.next_followup_date);

  return {
    id: row.id,

    studentId: row.student_id,

    name: row.name,

    course: row.course,

    mobile: row.mobile,

    email: row.email,

    city: row.city,

    category: row.category,

    paidFee,

    balanceFee,

    totalFee,

    dueDate: dateOnly(row.due_date),

    joinDate: dateOnly(row.join_date),

    nextFollowUpDate,

    next_followup_date:
      nextFollowUpDate,

    status: row.status,
  };
}

// ============================================================
// CORS
// ============================================================

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

// ============================================================
// HEALTH
// ============================================================

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "SCOT IT Academy API",
  });
});

// ============================================================
// AUTH - LOGIN
// ============================================================

app.post(
  "/api/auth/login",
  async (req, res, next) => {
    try {
      const username = text(
        req.body?.username
      );

      const password =
        req.body?.password || "";

      // --------------------------------------------------------
      // VALIDATION
      // --------------------------------------------------------

      if (!username || !password) {
        return res.status(400).json({
          message:
            "Username and password are required.",
        });
      }

      // --------------------------------------------------------
      // FIND USER
      // --------------------------------------------------------

      const user = await first(
        `
        SELECT
          id,
          username,
          password_hash,
          name,
          role
        FROM users
        WHERE LOWER(username)=LOWER(?)
        LIMIT 1
        `,
        [username]
      );

      if (!user) {
        return res.status(401).json({
          message:
            "Invalid username or password.",
        });
      }

      // --------------------------------------------------------
      // CHECK PASSWORD
      // --------------------------------------------------------

      const validPassword =
        await bcrypt.compare(
          password,
          user.password_hash
        );

      if (!validPassword) {
        return res.status(401).json({
          message:
            "Invalid username or password.",
        });
      }

      // --------------------------------------------------------
      // CREATE JWT
      // --------------------------------------------------------

      const access =
        issueToken(user);

      // --------------------------------------------------------
      // RESPONSE
      // --------------------------------------------------------

      res.json({
        access,
        user: publicUser(user),
      });

    } catch (error) {
      next(error);
    }
  }
);


// ============================================================
// AUTH - OLD SIGNUP
// ============================================================
// Keep this route for compatibility with your existing
// frontend/admin setup.
// ============================================================

app.post(
  "/api/auth/signup",
  async (req, res, next) => {
    try {

      const name = text(
        req.body?.name
      );

      const username = text(
        req.body?.username
      );

      const password =
        req.body?.password || "";

      // --------------------------------------------------------
      // VALIDATION
      // --------------------------------------------------------

      if (!name) {
        return res.status(400).json({
          message:
            "Owner name is required.",
        });
      }

      if (!username) {
        return res.status(400).json({
          message:
            "Owner username is required.",
        });
      }

      if (!password) {
        return res.status(400).json({
          message:
            "Owner password is required.",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          message:
            "Password must contain at least 6 characters.",
        });
      }

      // --------------------------------------------------------
      // CHECK USERNAME
      // --------------------------------------------------------

      const usernameOwner =
        await first(
          `
          SELECT
            id,
            role
          FROM users
          WHERE LOWER(username)=LOWER(?)
          LIMIT 1
          `,
          [username]
        );

      /*
       * If username belongs to another user,
       * do not allow Owner to use it.
       */

      if (
        usernameOwner &&
        usernameOwner.role !== "Owner"
      ) {
        return res.status(409).json({
          message:
            "This username is already used by an administrator.",
        });
      }

      // --------------------------------------------------------
      // FIND OWNER
      // --------------------------------------------------------

      const owner =
        await first(
          `
          SELECT *
          FROM users
          WHERE role='Owner'
          ORDER BY id ASC
          LIMIT 1
          `
        );

      // --------------------------------------------------------
      // HASH PASSWORD
      // --------------------------------------------------------

      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      let ownerId;

      // --------------------------------------------------------
      // UPDATE EXISTING OWNER
      // --------------------------------------------------------

      if (owner) {

        ownerId =
          owner.id;

        await db.execute(
          `
          UPDATE users
          SET
            username=?,
            password_hash=?,
            name=?
          WHERE id=?
            AND role='Owner'
          `,
          [
            username,
            passwordHash,
            name,
            owner.id,
          ]
        );

      }

      // --------------------------------------------------------
      // CREATE OWNER
      // --------------------------------------------------------

      else {

        const [result] =
          await db.execute(
            `
            INSERT INTO users
            (
              username,
              password_hash,
              name,
              role
            )
            VALUES (?, ?, ?, 'Owner')
            `,
            [
              username,
              passwordHash,
              name,
            ]
          );

        ownerId =
          result.insertId;
      }

      // --------------------------------------------------------
      // GET UPDATED OWNER
      // --------------------------------------------------------

      const updatedOwner =
        await first(
          `
          SELECT
            id,
            username,
            name,
            role
          FROM users
          WHERE id=?
            AND role='Owner'
          LIMIT 1
          `,
          [ownerId]
        );

      if (!updatedOwner) {
        return res.status(500).json({
          message:
            "Owner account was not saved.",
        });
      }

      // --------------------------------------------------------
      // NEW TOKEN
      // --------------------------------------------------------

      const access =
        issueToken(
          updatedOwner
        );

      res.json({
        message:
          "Owner account updated successfully.",

        access,

        user:
          publicUser(
            updatedOwner
          ),
      });

    } catch (error) {

      // Duplicate username
      if (
        error?.code ===
        "ER_DUP_ENTRY"
      ) {
        return res.status(409).json({
          message:
            "This username is already in use.",
        });
      }

      next(error);
    }
  }
);


// ============================================================
// AUTH - UPDATE OWNER USERNAME
// ============================================================
// Current password MUST be correct.
// Owner Name is NOT changed.
// ============================================================

app.put(
  "/api/auth/update-owner",
  auth,
  ownerOnly,
  async (req, res, next) => {

    try {

      // --------------------------------------------------------
      // GET DATA
      // --------------------------------------------------------

      const username =
        text(
          req.body?.username
        );

      const currentPassword =
        req.body?.current_password ||
        "";

      // --------------------------------------------------------
      // VALIDATION
      // --------------------------------------------------------

      if (!username) {
        return res.status(400).json({
          message:
            "Please enter owner username.",
        });
      }

      if (!currentPassword) {
        return res.status(400).json({
          message:
            "Please enter your current password.",
        });
      }

      // --------------------------------------------------------
      // FIND CURRENT OWNER
      // --------------------------------------------------------

      const owner =
        await first(
          `
          SELECT
            id,
            username,
            password_hash,
            name,
            role
          FROM users
          WHERE id=?
            AND role='Owner'
          LIMIT 1
          `,
          [req.user.id]
        );

      if (!owner) {
        return res.status(404).json({
          message:
            "Owner account not found.",
        });
      }

      // --------------------------------------------------------
      // CHECK CURRENT PASSWORD
      // --------------------------------------------------------

      const validPassword =
        await bcrypt.compare(
          currentPassword,
          owner.password_hash
        );

      if (!validPassword) {

        /*
         * IMPORTANT:
         * DO NOT UPDATE USERNAME.
         */

        return res.status(401).json({
          message:
            "Current password is incorrect. Owner username was not changed.",
        });
      }

      // --------------------------------------------------------
      // CHECK USERNAME
      // --------------------------------------------------------

      const existingUser =
        await first(
          `
          SELECT
            id,
            username,
            role
          FROM users
          WHERE LOWER(username)=LOWER(?)
          LIMIT 1
          `,
          [username]
        );

      /*
       * If another user already owns this username,
       * don't update.
       */

      if (
        existingUser &&
        Number(existingUser.id) !==
          Number(owner.id)
      ) {

        return res.status(409).json({
          message:
            "This username is already in use.",
        });
      }

      // --------------------------------------------------------
      // UPDATE USERNAME
      // --------------------------------------------------------

      await db.execute(
        `
        UPDATE users
        SET
          username=?
        WHERE id=?
          AND role='Owner'
        `,
        [
          username,
          owner.id,
        ]
      );

      // --------------------------------------------------------
      // GET UPDATED OWNER
      // --------------------------------------------------------

      const updatedOwner =
        await first(
          `
          SELECT
            id,
            username,
            name,
            role
          FROM users
          WHERE id=?
            AND role='Owner'
          LIMIT 1
          `,
          [owner.id]
        );

      if (!updatedOwner) {
        return res.status(500).json({
          message:
            "Owner username was not saved.",
        });
      }

      // --------------------------------------------------------
      // CREATE NEW TOKEN
      // --------------------------------------------------------

      const access =
        issueToken(
          updatedOwner
        );

      // --------------------------------------------------------
      // RESPONSE
      // --------------------------------------------------------

      return res.json({
        message:
          "Owner username updated successfully.",

        access,

        user:
          publicUser(
            updatedOwner
          ),
      });

    } catch (error) {

      // Duplicate username
      if (
        error?.code ===
        "ER_DUP_ENTRY"
      ) {

        return res.status(409).json({
          message:
            "This username is already in use.",
        });
      }

      next(error);
    }
  }
);


// ============================================================
// AUTH - UPDATE OWNER PASSWORD
// ============================================================
// Current password MUST be correct.
// ============================================================

app.put(
  "/api/auth/update-password",
  auth,
  ownerOnly,
  async (req, res, next) => {

    try {

      // --------------------------------------------------------
      // GET DATA
      // --------------------------------------------------------

      const currentPassword =
        req.body?.current_password ||
        "";

      const newPassword =
        req.body?.new_password ||
        "";

      // --------------------------------------------------------
      // VALIDATION
      // --------------------------------------------------------

      if (!currentPassword) {
        return res.status(400).json({
          message:
            "Please enter your current password.",
        });
      }

      if (!newPassword) {
        return res.status(400).json({
          message:
            "Please enter your new password.",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          message:
            "New password must contain at least 6 characters.",
        });
      }

      if (
        currentPassword ===
        newPassword
      ) {
        return res.status(400).json({
          message:
            "New password must be different from your current password.",
        });
      }

      // --------------------------------------------------------
      // FIND OWNER
      // --------------------------------------------------------

      const owner =
        await first(
          `
          SELECT
            id,
            username,
            password_hash,
            name,
            role
          FROM users
          WHERE id=?
            AND role='Owner'
          LIMIT 1
          `,
          [req.user.id]
        );

      if (!owner) {
        return res.status(404).json({
          message:
            "Owner account not found.",
        });
      }

      // --------------------------------------------------------
      // CHECK CURRENT PASSWORD
      // --------------------------------------------------------

      const validPassword =
        await bcrypt.compare(
          currentPassword,
          owner.password_hash
        );

      if (!validPassword) {

        /*
         * IMPORTANT:
         * DO NOT UPDATE PASSWORD.
         */

        return res.status(401).json({
          message:
            "Current password is incorrect. Password was not changed.",
        });
      }

      // --------------------------------------------------------
      // HASH NEW PASSWORD
      // --------------------------------------------------------

      const newPasswordHash =
        await bcrypt.hash(
          newPassword,
          12
        );

      // --------------------------------------------------------
      // UPDATE PASSWORD
      // --------------------------------------------------------

      await db.execute(
        `
        UPDATE users
        SET
          password_hash=?
        WHERE id=?
          AND role='Owner'
        `,
        [
          newPasswordHash,
          owner.id,
        ]
      );

      // --------------------------------------------------------
      // GET UPDATED OWNER
      // --------------------------------------------------------

      const updatedOwner =
        await first(
          `
          SELECT
            id,
            username,
            name,
            role
          FROM users
          WHERE id=?
            AND role='Owner'
          LIMIT 1
          `,
          [owner.id]
        );

      if (!updatedOwner) {
        return res.status(500).json({
          message:
            "Password was not saved.",
        });
      }

      // --------------------------------------------------------
      // NEW JWT
      // --------------------------------------------------------

      const access =
        issueToken(
          updatedOwner
        );

      // --------------------------------------------------------
      // RESPONSE
      // --------------------------------------------------------

      return res.json({

        message:
          "Password updated successfully.",

        access,

        user:
          publicUser(
            updatedOwner
          ),
      });

    } catch (error) {
      next(error);
    }
  }
);


// ============================================================
// AUTH - ME
// ============================================================

app.get(
  "/api/auth/me",
  auth,
  async (req, res, next) => {

    try {

      const user =
        await first(
          `
          SELECT
            id,
            username,
            name,
            role
          FROM users
          WHERE id=?
          LIMIT 1
          `,
          [req.user.id]
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found.",
        });
      }

      res.json(
        publicUser(user)
      );

    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// STUDENTS - GET ALL
// ============================================================

app.get(
  "/api/students",
  auth,
  async (req, res, next) => {
    try {
      const [rows] =
        await db.query(
          `
          SELECT *
          FROM students
          ORDER BY id DESC
          `
        );

      res.json(
        rows.map(mapStudent)
      );
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// STUDENT - GET ONE
// ============================================================

app.get(
  "/api/students/:id",
  auth,
  async (req, res, next) => {
    try {
      const row =
        await first(
          `
          SELECT *
          FROM students
          WHERE id=?
             OR student_id=?
          LIMIT 1
          `,
          [
            req.params.id,
            req.params.id,
          ]
        );

      if (!row) {
        return res.status(404).json({
          message: "Student not found.",
        });
      }

      res.json(mapStudent(row));
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// STUDENT - CREATE
// ============================================================

app.post(
  "/api/students",
  auth,
  async (req, res, next) => {
    try {
      const b = req.body || {};

      const paid =
        amount(
          b.paidFee ??
          b.paid_fee
        );

      const balance =
        amount(
          b.balanceFee ??
          b.balance_fee
        );

      const total =
        amount(
          b.totalFee ??
          b.total_fee,
          paid + balance
        );

      const studentId =
        b.studentId ||
        b.student_id ||
        `ST-${Date.now()}`;

      const dueDate =
        dateOnly(
          b.dueDate ??
          b.due_date
        );

      const joinDate =
        dateOnly(
          b.joinDate ??
          b.join_date
        ) ||
        new Date()
          .toISOString()
          .slice(0, 10);

      const nextFollowUpDate =
        dateOnly(
          b.nextFollowUpDate ??
          b.next_followup_date ??
          b.next_follow_up_date
        );

      const status =
        b.status || "Joined";

      const [result] =
        await db.execute(
          `
          INSERT INTO students
          (
            student_id,
            name,
            course,
            mobile,
            email,
            city,
            category,
            paid_fee,
            balance_fee,
            total_fee,
            due_date,
            join_date,
            next_followup_date,
            status
          )
          VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            studentId,
            b.name ||
              b.candidate_name ||
              "",
            b.course || "",
            b.mobile ||
              b.mobile_no ||
              "",
            b.email || "",
            b.city || "",
            b.category || "",
            paid,
            balance,
            total,
            dueDate,
            joinDate,
            nextFollowUpDate,
            status,
          ]
        );

      const saved =
        await first(
          `
          SELECT *
          FROM students
          WHERE id=?
          `,
          [result.insertId]
        );

      res.status(201).json(
        mapStudent(saved)
      );
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// STUDENT - UPDATE
// ============================================================

app.patch(
  "/api/students/:id",
  auth,
  async (req, res, next) => {
    try {
      const current =
        await first(
          `
          SELECT *
          FROM students
          WHERE id=?
             OR student_id=?
          LIMIT 1
          `,
          [
            req.params.id,
            req.params.id,
          ]
        );

      if (!current) {
        return res.status(404).json({
          message: "Student not found.",
        });
      }

      const b = req.body || {};

      const paid =
        amount(
          b.paidFee ??
          b.paid_fee ??
          current.paid_fee
        );

      const balance =
        amount(
          b.balanceFee ??
          b.balance_fee ??
          current.balance_fee
        );

      const total =
        amount(
          b.totalFee ??
          b.total_fee,
          paid + balance
        );

      const studentId =
        b.studentId ??
        b.student_id ??
        current.student_id;

      const name =
        b.name ??
        b.candidate_name ??
        current.name;

      const course =
        b.course ??
        current.course;

      const mobile =
        b.mobile ??
        b.mobile_no ??
        current.mobile;

      const email =
        b.email ??
        current.email;

      const city =
        b.city ??
        current.city;

      const category =
        b.category ??
        current.category;

      const dueDate =
        dateOnly(
          b.dueDate ??
          b.due_date ??
          current.due_date
        );

      const joinDate =
        dateOnly(
          b.joinDate ??
          b.join_date ??
          current.join_date
        );

      const nextFollowUpDate =
        dateOnly(
          b.nextFollowUpDate ??
          b.next_followup_date ??
          b.next_follow_up_date ??
          current.next_followup_date
        );

      const status =
        b.status ??
        current.status ??
        "Joined";

      await db.execute(
        `
        UPDATE students
        SET
          student_id=?,
          name=?,
          course=?,
          mobile=?,
          email=?,
          city=?,
          category=?,
          paid_fee=?,
          balance_fee=?,
          total_fee=?,
          due_date=?,
          join_date=?,
          next_followup_date=?,
          status=?
        WHERE id=?
        `,
        [
          studentId,
          name,
          course,
          mobile,
          email,
          city,
          category,
          paid,
          balance,
          total,
          dueDate,
          joinDate,
          nextFollowUpDate,
          status,
          current.id,
        ]
      );

      const updated =
        await first(
          `
          SELECT *
          FROM students
          WHERE id=?
          `,
          [current.id]
        );

      res.json(
        mapStudent(updated)
      );
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// STUDENT - DELETE
// ============================================================

app.delete(
  "/api/students/:id",
  auth,
  async (req, res, next) => {
    try {
      await db.execute(
        `
        DELETE FROM students
        WHERE id=?
           OR student_id=?
        `,
        [
          req.params.id,
          req.params.id,
        ]
      );

      res.json({
        deleted: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// ENQUIRIES - GET ALL
// ============================================================
// IMPORTANT:
// Use db.query(), NOT pool.query().
// ============================================================

app.get(
  "/api/enquiries",
  auth,
  async (req, res, next) => {
    try {
      const [rows] =
        await db.query(
          `
          SELECT
            id,
            branch,
            admin,
            enquiry_date,
            candidate_name,
            mobile,
            city,
            degree,
            passed_year,
            category,
            course,
            comments,
            next_followup_date,
            status,
            referred_by,
            referral_contact,
            created_at,
            updated_at
          FROM enquiries
          ORDER BY id DESC
          `
        );

      res.json(
        rows.map((row) => ({
          ...row,

          enquiry_date:
            dateOnly(row.enquiry_date),

          next_followup_date:
            dateOnly(
              row.next_followup_date
            ),
        }))
      );
    } catch (error) {
      console.error(
        "GET /api/enquiries error:",
        error
      );

      next(error);
    }
  }
);

// ============================================================
// ENQUIRY - GET ONE
// ============================================================

app.get(
  "/api/enquiries/:id",
  auth,
  async (req, res, next) => {
    try {
      const row =
        await first(
          `
          SELECT *
          FROM enquiries
          WHERE id=?
          LIMIT 1
          `,
          [req.params.id]
        );

      if (!row) {
        return res.status(404).json({
          message: "Enquiry not found",
        });
      }

      row.enquiry_date =
        dateOnly(row.enquiry_date);

      row.next_followup_date =
        dateOnly(
          row.next_followup_date
        );

      res.json(row);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// ENQUIRY - CREATE
// ============================================================

app.post(
  "/api/enquiries",
  auth,
  async (req, res, next) => {
    try {
      const b = req.body || {};

      const branch =
        b.branch || "";

      const admin =
        b.admin || "";

      const enquiryDate =
        dateOnly(
          b.enquiry_date ??
          b.enquiryDate
        ) ||
        new Date()
          .toISOString()
          .slice(0, 10);

      const candidateName =
        text(
          b.candidate_name ??
          b.candidateName
        );

      const mobile =
        text(b.mobile);

      const city =
        b.city || "";

      const degree =
        b.degree || "";

      const passedYear =
        b.passed_year ??
        b.passedYear ??
        "";

      const category =
        b.category || "";

      const course =
        b.course || "";

      const comments =
        b.comments || "";

      const followUpDate =
        dateOnly(
          b.next_followup_date ??
          b.nextFollowupDate
        );

      const status =
        b.status || "Pending";

      const referredBy =
        b.referred_by ??
        b.referredBy ??
        "";

      const referralContact =
        b.referral_contact ??
        b.referralContact ??
        "";

      if (!candidateName) {
        return res.status(400).json({
          message:
            "Candidate name is required",
        });
      }

      if (!mobile) {
        return res.status(400).json({
          message:
            "Mobile number is required",
        });
      }

      const [result] =
        await db.execute(
          `
          INSERT INTO enquiries
          (
            branch,
            admin,
            enquiry_date,
            candidate_name,
            mobile,
            city,
            degree,
            passed_year,
            category,
            course,
            comments,
            next_followup_date,
            status,
            referred_by,
            referral_contact
          )
          VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            branch,
            admin,
            enquiryDate,
            candidateName,
            mobile,
            city,
            degree,
            passedYear,
            category,
            course,
            comments,
            followUpDate,
            status,
            referredBy,
            referralContact,
          ]
        );

      const row =
        await first(
          `
          SELECT *
          FROM enquiries
          WHERE id=?
          LIMIT 1
          `,
          [result.insertId]
        );

      row.enquiry_date =
        dateOnly(row.enquiry_date);

      row.next_followup_date =
        dateOnly(
          row.next_followup_date
        );

      res.status(201).json(row);
    } catch (error) {
      console.error(
        "POST /api/enquiries error:",
        error
      );

      next(error);
    }
  }
);

// ============================================================
// ENQUIRY - UPDATE
// ============================================================

app.patch(
  "/api/enquiries/:id",
  auth,
  async (req, res, next) => {
    try {
      const id = req.params.id;

      const old =
        await first(
          `
          SELECT *
          FROM enquiries
          WHERE id=?
          LIMIT 1
          `,
          [id]
        );

      if (!old) {
        return res.status(404).json({
          message:
            "Enquiry not found",
        });
      }

      const b = req.body || {};

      const branch =
        b.branch ??
        old.branch;

      const admin =
        b.admin ??
        old.admin;

      const enquiryDate =
        b.enquiry_date !== undefined
          ? dateOnly(b.enquiry_date)
          : b.enquiryDate !== undefined
          ? dateOnly(b.enquiryDate)
          : dateOnly(old.enquiry_date);

      const candidateName =
        b.candidate_name ??
        b.candidateName ??
        old.candidate_name;

      const mobile =
        b.mobile ??
        old.mobile;

      const city =
        b.city ??
        old.city;

      const degree =
        b.degree ??
        old.degree;

      const passedYear =
        b.passed_year ??
        b.passedYear ??
        old.passed_year;

      const category =
        b.category ??
        old.category;

      const course =
        b.course ??
        old.course;

      const comments =
        b.comments ??
        old.comments;

      const followUpDate =
        b.next_followup_date !== undefined
          ? dateOnly(
              b.next_followup_date
            )
          : b.nextFollowupDate !== undefined
          ? dateOnly(
              b.nextFollowupDate
            )
          : dateOnly(
              old.next_followup_date
            );

      const status =
        b.status ??
        old.status;

      const referredBy =
        b.referred_by ??
        b.referredBy ??
        old.referred_by;

      const referralContact =
        b.referral_contact ??
        b.referralContact ??
        old.referral_contact;

      await db.execute(
        `
        UPDATE enquiries
        SET
          branch=?,
          admin=?,
          enquiry_date=?,
          candidate_name=?,
          mobile=?,
          city=?,
          degree=?,
          passed_year=?,
          category=?,
          course=?,
          comments=?,
          next_followup_date=?,
          status=?,
          referred_by=?,
          referral_contact=?,
          updated_at=CURRENT_TIMESTAMP
        WHERE id=?
        `,
        [
          branch,
          admin,
          enquiryDate,
          candidateName,
          mobile,
          city,
          degree,
          passedYear,
          category,
          course,
          comments,
          followUpDate,
          status,
          referredBy,
          referralContact,
          id,
        ]
      );

      const updated =
        await first(
          `
          SELECT *
          FROM enquiries
          WHERE id=?
          LIMIT 1
          `,
          [id]
        );

      updated.enquiry_date =
        dateOnly(
          updated.enquiry_date
        );

      updated.next_followup_date =
        dateOnly(
          updated.next_followup_date
        );

      res.json(updated);
    } catch (error) {
      console.error(
        "PATCH /api/enquiries/:id error:",
        error
      );

      next(error);
    }
  }
);

// ============================================================
// ENQUIRY - DELETE
// ============================================================

app.delete(
  "/api/enquiries/:id",
  auth,
  async (req, res, next) => {
    try {
      const [result] =
        await db.execute(
          `
          DELETE FROM enquiries
          WHERE id=?
          `,
          [req.params.id]
        );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message:
            "Enquiry not found",
        });
      }

      res.json({
        deleted: true,
        id: Number(req.params.id),
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// FOLLOW UPS
// ============================================================

app.get(
  "/api/follow-ups",
  auth,
  async (req, res, next) => {
    try {
      const [rows] =
        await db.query(
          `
          SELECT *
          FROM enquiries
          WHERE LOWER(status)<>'joined'
          ORDER BY
            next_followup_date IS NULL,
            next_followup_date,
            id DESC
          `
        );

      res.json(
        rows.map((row) => ({
          ...row,

          enquiry_date:
            dateOnly(row.enquiry_date),

          next_followup_date:
            dateOnly(
              row.next_followup_date
            ),
        }))
      );
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// CATEGORIES
// ============================================================

app.get(
  "/api/categories",
  auth,
  async (req, res, next) => {
    try {
      const [rows] =
        await db.query(
          `
          SELECT id, name
          FROM categories
          ORDER BY name
          `
        );

      res.json(rows);
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/categories",
  auth,
  async (req, res, next) => {
    try {
      const name =
        text(
          req.body?.name ||
          req.body?.category
        );

      if (!name) {
        return res.status(400).json({
          message:
            "Category name is required.",
        });
      }

      await db.execute(
        `
        INSERT IGNORE INTO categories(name)
        VALUES(?)
        `,
        [name]
      );

      const row =
        await first(
          `
          SELECT id, name
          FROM categories
          WHERE name=?
          `,
          [name]
        );

      res.json(row);
    } catch (error) {
      next(error);
    }
  }
);

app.patch(
  "/api/categories/:id",
  auth,
  async (req, res, next) => {
    try {
      const name =
        text(
          req.body?.name ||
          req.body?.category
        );

      if (!name) {
        return res.status(400).json({
          message:
            "Category name is required.",
        });
      }

      await db.execute(
        `
        UPDATE categories
        SET name=?
        WHERE id=?
           OR name=?
        `,
        [
          name,
          req.params.id,
          req.params.id,
        ]
      );

      res.json({
        id: req.params.id,
        name,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.delete(
  "/api/categories/:id",
  auth,
  async (req, res, next) => {
    try {
      await db.execute(
        `
        DELETE FROM categories
        WHERE id=?
           OR name=?
        `,
        [
          req.params.id,
          req.params.id,
        ]
      );

      res.json({
        deleted: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// REFERRALS
// ============================================================

app.get(
  "/api/referrals",
  auth,
  async (req, res, next) => {
    try {
      const [rows] =
        await db.query(
          `
          SELECT id, name
          FROM referrals
          ORDER BY id DESC
          `
        );

      res.json(rows);
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/referrals",
  auth,
  async (req, res, next) => {
    try {
      const name =
        text(req.body?.name);

      if (!name) {
        return res.status(400).json({
          message:
            "Referral name is required.",
        });
      }

      const [result] =
        await db.execute(
          `
          INSERT INTO referrals(name)
          VALUES(?)
          `,
          [name]
        );

      res.json({
        id: result.insertId,
        name,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.patch(
  "/api/referrals/:id",
  auth,
  async (req, res, next) => {
    try {
      const name =
        text(req.body?.name);

      await db.execute(
        `
        UPDATE referrals
        SET name=?
        WHERE id=?
        `,
        [
          name,
          req.params.id,
        ]
      );

      const row =
        await first(
          `
          SELECT id,name
          FROM referrals
          WHERE id=?
          `,
          [req.params.id]
        );

      if (!row) {
        return res.status(404).json({
          message:
            "Referral not found.",
        });
      }

      res.json(row);
    } catch (error) {
      next(error);
    }
  }
);

app.delete(
  "/api/referrals/:id",
  auth,
  async (req, res, next) => {
    try {
      await db.execute(
        `
        DELETE FROM referrals
        WHERE id=?
        `,
        [req.params.id]
      );

      res.json({
        deleted: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// ADMINS
// ============================================================

app.get(
  "/api/admins",
  auth,
  ownerOnly,
  async (req, res, next) => {
    try {
      const [rows] =
        await db.query(
          `
          SELECT
            id,
            name,
            username,
            role
          FROM users
          WHERE role='Admin'
          ORDER BY id DESC
          `
        );

      res.json(
        rows.map((row) => ({
          ...row,
          role: "Administrator",
          status: "Active",
        }))
      );
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/admins",
  auth,
  ownerOnly,
  async (req, res, next) => {
    try {
      const name =
        text(req.body?.name);

      const username =
        text(req.body?.username);

      const password =
        text(req.body?.password);

      if (
        !name ||
        !username ||
        !password
      ) {
        return res.status(400).json({
          message:
            "Admin name, username and password are required.",
        });
      }

      const exists =
        await first(
          `
          SELECT id
          FROM users
          WHERE LOWER(username)=LOWER(?)
          `,
          [username]
        );

      if (exists) {
        return res.status(409).json({
          message:
            "This admin username already exists.",
        });
      }

      const hash =
        await bcrypt.hash(
          password,
          12
        );

      const [result] =
        await db.execute(
          `
          INSERT INTO users
          (
            name,
            username,
            password_hash,
            role
          )
          VALUES (?, ?, ?, 'Admin')
          `,
          [
            name,
            username,
            hash,
          ]
        );

      res.json({
        id: result.insertId,
        name,
        username,
        role: "Administrator",
        status: "Active",
      });
    } catch (error) {
      next(error);
    }
  }
);

app.patch(
  "/api/admins/:id",
  auth,
  ownerOnly,
  async (req, res, next) => {
    try {
      const old =
        await first(
          `
          SELECT *
          FROM users
          WHERE id=?
            AND role='Admin'
          `,
          [req.params.id]
        );

      if (!old) {
        return res.status(404).json({
          message:
            "Admin record not found.",
        });
      }

      const name =
        text(req.body?.name) ||
        old.name;

      const username =
        text(req.body?.username) ||
        old.username;

      const password =
        text(req.body?.password);

      if (password) {
        await db.execute(
          `
          UPDATE users
          SET
            name=?,
            username=?,
            password_hash=?
          WHERE id=?
          `,
          [
            name,
            username,
            await bcrypt.hash(
              password,
              12
            ),
            old.id,
          ]
        );
      } else {
        await db.execute(
          `
          UPDATE users
          SET
            name=?,
            username=?
          WHERE id=?
          `,
          [
            name,
            username,
            old.id,
          ]
        );
      }

      res.json({
        id: old.id,
        name,
        username,
        role: "Administrator",
        status: "Active",
      });
    } catch (error) {
      next(error);
    }
  }
);

app.delete(
  "/api/admins/:id",
  auth,
  ownerOnly,
  async (req, res, next) => {
    try {
      const [result] =
        await db.execute(
          `
          DELETE FROM users
          WHERE id=?
            AND role='Admin'
          `,
          [req.params.id]
        );

      res.json({
        deleted:
          result.affectedRows > 0,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// DASHBOARD
// ============================================================

app.get(
  "/api/dashboard",
  auth,
  async (req, res, next) => {
    try {
      const totals =
        await first(
          `
          SELECT
            COUNT(*) AS totalStudents,

            COALESCE(
              SUM(
                LOWER(status)='joined'
              ),
              0
            ) AS joinedStudents,

            COALESCE(
              SUM(total_fee),
              0
            ) AS totalFee

          FROM students
          `
        );

      const [recentRows] =
        await db.query(
          `
          SELECT
            admin,
            candidate_name,
            mobile,
            city,
            category,
            course,
            next_followup_date,
            status
          FROM enquiries
          ORDER BY id DESC
          LIMIT 8
          `
        );

      const [follow] =
        await db.query(
          `
          SELECT
            *,
            candidate_name AS name
          FROM enquiries
          ORDER BY id DESC
          LIMIT 8
          `
        );

      const [categories] =
        await db.query(
          `
          SELECT
            c.name,
            COUNT(s.id) AS students
          FROM categories c
          LEFT JOIN students s
            ON s.category=c.name
          GROUP BY
            c.id,
            c.name
          ORDER BY c.name
          `
        );

      const recent =
        recentRows.map(
          (row) => [
            row.admin || "Owner",
            row.candidate_name || "",
            row.mobile || "",
            row.city || "",
            row.category || "",
            row.course || "",
            dateOnly(
              row.next_followup_date
            ) || "",
            row.status || "Pending",
          ]
        );

      const cleanFollow =
        follow.map((row) => ({
          ...row,

          enquiry_date:
            dateOnly(row.enquiry_date),

          next_followup_date:
            dateOnly(
              row.next_followup_date
            ),
        }));

      const data = {
        totalStudents:
          Number(
            totals.totalStudents
          ),

        joinedStudents:
          Number(
            totals.joinedStudents
          ),

        totalFee:
          amount(totals.totalFee),

        recent,

        follow: cleanFollow,

        categories:
          categories.map(
            (row) => [
              row.name,
              Number(row.students),
              0,
            ]
          ),
      };

      res.json({
        ...data,
        summary: data,
      });
    } catch (error) {
      console.error(
        "GET /api/dashboard error:",
        error
      );

      next(error);
    }
  }
);

// ============================================================
// REPORTS
// ============================================================

app.get(
  "/api/reports",
  auth,
  async (req, res, next) => {
    try {
      const totals =
        await first(
          `
          SELECT
            COUNT(*) AS totalStudents,

            COALESCE(
              SUM(total_fee),
              0
            ) AS totalRevenue,

            COALESCE(
              SUM(balance_fee),
              0
            ) AS totalDue

          FROM students
          `
        );

      const enquiries =
        await first(
          `
          SELECT
            COUNT(*) AS totalEnquiries
          FROM enquiries
          `
        );

      const [categories] =
        await db.query(
          `
          SELECT
            c.name,
            COUNT(s.id) AS students
          FROM categories c
          LEFT JOIN students s
            ON s.category=c.name
          GROUP BY
            c.id,
            c.name
          ORDER BY c.name
          `
        );

      res.json({
        totalStudents:
          Number(
            totals.totalStudents
          ),

        totalEnquiries:
          Number(
            enquiries.totalEnquiries
          ),

        totalRevenue:
          amount(
            totals.totalRevenue
          ),

        totalDue:
          amount(
            totals.totalDue
          ),

        categories:
          categories.map(
            (row) => ({
              name: row.name,
              students:
                Number(
                  row.students
                ),
            })
          ),
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// NOTIFICATIONS
// ============================================================

app.get(
  "/api/notifications",
  auth,
  async (req, res, next) => {
    try {
      const [rows] =
        await db.query(
          `
          SELECT
            id,
            student_id,
            student_id AS studentId,
            name,
            mobile,
            paid_fee AS paidFee,
            balance_fee AS balanceFee,
            total_fee AS totalFee,
            due_date AS dueDate,
            balance_fee AS pending_fee,
            'Due' AS status
          FROM students
          WHERE due_date<CURDATE()
            AND balance_fee>0
          ORDER BY due_date
          `
        );

      res.json(
        rows.map((row) => ({
          ...row,

          dueDate:
            dateOnly(row.dueDate),

          student_name:
            row.name,
        }))
      );
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// SETTINGS
// ============================================================

app.get(
  "/api/settings",
  auth,
  async (req, res, next) => {
    try {
      const [rows] =
        await db.query(
          `
          SELECT
            setting_key,
            setting_value
          FROM settings
          `
        );

      const result = {};

      rows.forEach((row) => {
        result[row.setting_key] =
          typeof row.setting_value ===
          "string"
            ? JSON.parse(
                row.setting_value
              )
            : row.setting_value;
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

app.patch(
  "/api/settings",
  auth,
  async (req, res, next) => {
    try {
      for (
        const [key, value]
        of Object.entries(
          req.body || {}
        )
      ) {
        await db.execute(
          `
          INSERT INTO settings
          (
            setting_key,
            setting_value
          )
          VALUES (?, ?)

          ON DUPLICATE KEY UPDATE
            setting_value=VALUES(
              setting_value
            )
          `,
          [
            key,
            JSON.stringify(value),
          ]
        );
      }

      res.json(
        req.body || {}
      );
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// DATABASE INITIALIZATION
// ============================================================

async function initializeSchema() {

  // ----------------------------------------------------------
  // USERS
  // ----------------------------------------------------------

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,

      username VARCHAR(100)
        NOT NULL,

      password_hash VARCHAR(255)
        NOT NULL,

      name VARCHAR(150)
        NOT NULL,

      role ENUM('Owner','Admin')
        NOT NULL DEFAULT 'Admin',

      created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

      PRIMARY KEY(id),

      UNIQUE KEY
        uq_users_username(username)

    )
    ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
  `);

  // ----------------------------------------------------------
  // STUDENTS
  // ----------------------------------------------------------

  await db.query(`
    CREATE TABLE IF NOT EXISTS students (

      id INT UNSIGNED
        NOT NULL AUTO_INCREMENT,

      student_id VARCHAR(50)
        NOT NULL,

      name VARCHAR(150)
        NOT NULL,

      course VARCHAR(150)
        NOT NULL DEFAULT '',

      mobile VARCHAR(30)
        NOT NULL DEFAULT '',

      email VARCHAR(150)
        NOT NULL DEFAULT '',

      city VARCHAR(100)
        NOT NULL DEFAULT '',

      category VARCHAR(150)
        NOT NULL DEFAULT '',

      paid_fee DECIMAL(12,2)
        NOT NULL DEFAULT 0,

      balance_fee DECIMAL(12,2)
        NOT NULL DEFAULT 0,

      total_fee DECIMAL(12,2)
        NOT NULL DEFAULT 0,

      due_date DATE NULL,

      join_date DATE NULL,

      next_followup_date DATE NULL,

      status VARCHAR(30)
        NOT NULL DEFAULT 'Joined',

      created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

      updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

      PRIMARY KEY(id),

      UNIQUE KEY
        uq_student_id(student_id)

    )
    ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
  `);

  // ----------------------------------------------------------
  // MIGRATION FOR OLD STUDENTS TABLE
  // ----------------------------------------------------------

  const [studentColumns] =
    await db.query(
      `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA=?
        AND TABLE_NAME='students'
        AND COLUMN_NAME='next_followup_date'
      `,
      [DB_CONFIG.database]
    );

  if (
    studentColumns.length === 0
  ) {
    console.log(
      "Adding next_followup_date..."
    );

    await db.query(`
      ALTER TABLE students
      ADD COLUMN next_followup_date
      DATE NULL
      AFTER join_date
    `);

    console.log(
      "next_followup_date added."
    );
  }

  // ----------------------------------------------------------
  // ENQUIRIES
  // ----------------------------------------------------------

  await db.query(`
    CREATE TABLE IF NOT EXISTS enquiries (

      id INT UNSIGNED
        NOT NULL AUTO_INCREMENT,

      branch VARCHAR(100)
        NOT NULL DEFAULT '',

      admin VARCHAR(150)
        NOT NULL DEFAULT '',

      enquiry_date DATE NULL,

      candidate_name VARCHAR(150)
        NOT NULL DEFAULT '',

      mobile VARCHAR(30)
        NOT NULL DEFAULT '',

      city VARCHAR(100)
        NOT NULL DEFAULT '',

      degree VARCHAR(150)
        NOT NULL DEFAULT '',

      passed_year VARCHAR(20)
        NOT NULL DEFAULT '',

      category VARCHAR(150)
        NOT NULL DEFAULT '',

      course VARCHAR(150)
        NOT NULL DEFAULT '',

      comments TEXT,

      next_followup_date DATE NULL,

      status VARCHAR(30)
        NOT NULL DEFAULT 'Pending',

      referred_by VARCHAR(150)
        NOT NULL DEFAULT '',

      referral_contact VARCHAR(100)
        NOT NULL DEFAULT '',

      created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

      updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

      PRIMARY KEY(id)

    )
    ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
  `);

  // ----------------------------------------------------------
  // CATEGORIES
  // ----------------------------------------------------------

  await db.query(`
    CREATE TABLE IF NOT EXISTS categories (

      id INT UNSIGNED
        NOT NULL AUTO_INCREMENT,

      name VARCHAR(150)
        NOT NULL,

      PRIMARY KEY(id),

      UNIQUE KEY
        uq_category_name(name)

    )
    ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
  `);

  // ----------------------------------------------------------
  // REFERRALS
  // ----------------------------------------------------------

  await db.query(`
    CREATE TABLE IF NOT EXISTS referrals (

      id INT UNSIGNED
        NOT NULL AUTO_INCREMENT,

      name VARCHAR(150)
        NOT NULL,

      created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

      PRIMARY KEY(id)

    )
    ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
  `);

  // ----------------------------------------------------------
  // SETTINGS
  // ----------------------------------------------------------

  await db.query(`
    CREATE TABLE IF NOT EXISTS settings (

      setting_key VARCHAR(100)
        NOT NULL,

      setting_value JSON
        NOT NULL,

      updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

      PRIMARY KEY(setting_key)

    )
    ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
  `);

  // ----------------------------------------------------------
  // NOTIFICATIONS
  // ----------------------------------------------------------

  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (

      id INT UNSIGNED
        NOT NULL AUTO_INCREMENT,

      student_id INT UNSIGNED NULL,

      type VARCHAR(50)
        NOT NULL,

      message TEXT
        NOT NULL,

      is_read BOOLEAN
        NOT NULL DEFAULT FALSE,

      created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

      PRIMARY KEY(id),

      FOREIGN KEY(student_id)
        REFERENCES students(id)
        ON DELETE CASCADE

    )
    ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
  `);

  // ----------------------------------------------------------
  // DEFAULT OWNER
  // ----------------------------------------------------------

  if (
    process.env.OWNER_USERNAME &&
    process.env.OWNER_PASSWORD
  ) {
    const owner =
      await first(
        `
        SELECT id
        FROM users
        WHERE role='Owner'
        LIMIT 1
        `
      );

    if (!owner) {
      await db.execute(
        `
        INSERT INTO users
        (
          username,
          password_hash,
          name,
          role
        )
        VALUES (?, ?, ?, 'Owner')
        `,
        [
          process.env.OWNER_USERNAME,

          await bcrypt.hash(
            process.env.OWNER_PASSWORD,
            12
          ),

          process.env.OWNER_NAME ||
            "SCOT IT Academy Owner",
        ]
      );

      console.log(
        "Owner account created."
      );
    }
  }
}

// ============================================================
// 404
// ============================================================

app.use(
  (req, res) => {
    res.status(404).json({
      message: "Not found",
      path: req.originalUrl,
    });
  }
);

// ============================================================
// ERROR HANDLER
// ============================================================

app.use(
  (error, req, res, next) => {
    console.error(
      "SERVER ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Internal server error",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
);

// ============================================================
// START SERVER
// ============================================================

initializeSchema()
  .then(() => {

    app.listen(
      PORT,
      () => {

        console.log(
          "======================================"
        );

        console.log(
          "SCOT IT Academy API"
        );

        console.log(
          `Server: http://localhost:${PORT}`
        );

        console.log(
          `Health: http://localhost:${PORT}/health`
        );

        console.log(
          `Enquiries: http://localhost:${PORT}/api/enquiries`
        );

        console.log(
          "======================================"
        );

      }
    );

  })
  .catch((error) => {

    console.error(
      `Unable to connect to MySQL database '${DB_CONFIG.database}':`,
      error.message
    );

    process.exit(1);
  });