const express = require("express");
const router = express.Router();
const { pool } = require("../dbConfig");
const { checkNotAuthenticated } = require("../middleware/auth"); // optional

// Get all files
router.get("/", checkNotAuthenticated, (req, res) => {

    pool.query("SELECT current_database()", (err, result) => {
    if (err) {
      console.error("DB check failed:", err);
    } else {
      console.log("✅ Connected to database:", result.rows[0].current_database);
    }
  });

  pool.query("SELECT * FROM departments", (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Database error");
    }
    res.render("departments", { departments: results.rows });
  });
});

// Add new file form
router.get("/add", checkNotAuthenticated, (req, res) => {
  res.render("departments/add", {
    layout: "layout",
    title: "Add New Department",
    css: "/css/filesadd.css",
  });
});

// Add new file action
router.post("/add", checkNotAuthenticated, (req, res) => {
  const { name, directorate } = req.body;

  pool.query(
    "INSERT INTO departments (name, directorate) VALUES ($1, $2)",
    [name, directorate],
    (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Failed to add department.");
      }
      res.redirect("/departments");
    }
  );
});

// Edit file form
router.get("/edit/:id", checkNotAuthenticated, (req, res) => {
  const { id } = req.params;
  pool.query("SELECT * FROM departments WHERE id = $1", [id], (err, results) => {
    if (err || results.rows.length === 0) {
      console.log(err);
      return res.status(404).send("Department not found");
    }

    res.render("departments/edit", {
      department: results.rows[0],
      layout: "layout",
      title: "Update Department",
      css: "/css/filesedit.css",
    });
  });
});

// Update file
router.post("/edit/:id", checkNotAuthenticated, (req, res) => {
  const { id } = req.params;
  const { name, directorate } = req.body;

  pool.query(
    "UPDATE departments SET name = $1, directorate = $2 WHERE id = $3",
    [name, directorate, id],
    (err) => {
      if (err) {
        console.log(err);
      }
      res.redirect("/departments");
    }
  );
});

// Delete file
router.get("/delete/:id", checkNotAuthenticated, (req, res) => {
  const { id } = req.params;
  pool.query("DELETE FROM departments WHERE id = $1", [id], (err) => {
    if (err) {
      console.log(err);
    }
    res.redirect("/departments");
  });
});

module.exports = router;