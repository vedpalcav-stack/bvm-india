require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

// ======================
// DATABASE CONNECTION
// ======================
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// ======================
// HOME ROUTE
// ======================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "BVM ERP API Running",
  });
});

// ======================
// GET ALL COMPANIES
// ======================
app.get("/api/companies", async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT *
      FROM companies
      ORDER BY id
      `
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ======================
// GET SINGLE COMPANY
// ======================
app.get("/api/companies/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `
      SELECT *
      FROM companies
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ======================
// CREATE COMPANY
// ======================
app.post("/api/companies", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Company name is required",
      });
    }

    const result = await db.query(
      `
      INSERT INTO companies (name)
      VALUES ($1)
      RETURNING *
      `,
      [name]
    );

    res.status(201).json({
      success: true,
      message: "Company created successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ======================
// UPDATE COMPANY
// ======================
app.put("/api/companies/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const result = await db.query(
      `
      UPDATE companies
      SET name = $1
      WHERE id = $2
      RETURNING *
      `,
      [name, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.json({
      success: true,
      message: "Company updated successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ======================
// DELETE COMPANY
// ======================
app.delete("/api/companies/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `
      DELETE FROM companies
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.json({
      success: true,
      message: "Company deleted successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
