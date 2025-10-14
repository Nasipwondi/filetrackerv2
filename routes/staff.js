const express = require("express");
const router = express.Router();
const { pool } = require("../dbConfig");
const { checkNotAuthenticated } = require("../middleware/auth"); // optional

// Get all files
router.get("/", checkNotAuthenticated, (req, res) => {
  pool.query("SELECT * FROM staff", (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Database error");
    }
    res.render("staff", { files: results.rows });
  });
});

// Add new file form
router.get("/add", checkNotAuthenticated, (req, res) => {
  res.render("staff/add", {
    layout: "layout",
    title: "Add New Staff",
    css: "/css/filesadd.css",
  });
});

// Add new file action
router.post("/add", checkNotAuthenticated, (req, res) => {
  const { name, departments_id, directorates_id, designation, role } = req.body;

  pool.query(
    "INSERT INTO files (name, department, directorate, fileno) VALUES ($1, $2, $3, $4)",
    [name, departments_id, directorates_id, designation, role],
    (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Failed to add file.");
      }
      res.redirect("/staff");
    }
  );
});

// Edit file form
router.get("/edit/:id", checkNotAuthenticated, (req, res) => {
  const { id } = req.params;
  pool.query("SELECT * FROM staff WHERE id = $1", [id], (err, results) => {
    if (err || results.rows.length === 0) {
      console.log(err);
      return res.status(404).send("Staff not found");
    }

    res.render("staff/edit", {
      file: results.rows[0],
      layout: "layout",
      title: "Update Staff",
      css: "/css/filesedit.css",
    });
  });
});

// Update file
router.post("/edit/:id", checkNotAuthenticated, (req, res) => {
  const { id } = req.params;
  const { name, departments_id, directorates_id, designation, role } = req.body;

  pool.query(
    "UPDATE files SET name = $1, departments_id = $2, directorates_id = $3, designation = $4 role = &5 WHERE id = $6",
    [name, departments_id, directorates_id, designation, role, id],
    (err) => {
      if (err) {
        console.log(err);
      }
      res.redirect("/staff");
    }
  );
});

// Delete file
router.get("/delete/:id", checkNotAuthenticated, (req, res) => {
  const { id } = req.params;
  pool.query("DELETE FROM staff WHERE id = $1", [id], (err) => {
    if (err) {
      console.log(err);
    }
    res.redirect("/staff");
  });
});

module.exports = router;