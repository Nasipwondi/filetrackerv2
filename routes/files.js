const express = require("express");
const router = express.Router();
const { pool } = require("../dbConfig");
const { checkNotAuthenticated } = require("../middleware/auth"); // optional

// Get all files
router.get("/", checkNotAuthenticated, (req, res) => {
  pool.query("SELECT * FROM files", (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Database error");
    }
    res.render("files", { files: results.rows });
  });
});

// Add new file form
router.get("/add", checkNotAuthenticated, (req, res) => {
  res.render("files/add", {
    layout: "layout2",
    title: "Add New File",
    css: "/css/filesadd.css",
  });
});

// Add new file action
router.post("/add", checkNotAuthenticated, (req, res) => {
  const { name, department, directorate, fileno } = req.body;

  pool.query(
    "INSERT INTO files (name, department, directorate, fileno) VALUES ($1, $2, $3, $4)",
    [name, department, directorate, fileno],
    (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Failed to add file.");
      }
      res.redirect("/files");
    }
  );
});

// Edit file form
router.get("/edit/:id", checkNotAuthenticated, (req, res) => {
  const { id } = req.params;
  pool.query("SELECT * FROM files WHERE id = $1", [id], (err, results) => {
    if (err || results.rows.length === 0) {
      console.log(err);
      return res.status(404).send("File not found");
    }

    res.render("files/edit", {
      file: results.rows[0],
      layout: "layout",
      title: "Update File",
      css: "/css/filesedit.css",
    });
  });
});

// Update file
router.post("/edit/:id", checkNotAuthenticated, (req, res) => {
  const { id } = req.params;
  const { name, department, directorate, fileno } = req.body;

  pool.query(
    "UPDATE files SET name = $1, department = $2, directorate = $3, fileno = $4 WHERE id = $5",
    [name, department, directorate, fileno, id],
    (err) => {
      if (err) {
        console.log(err);
      }
      res.redirect("/files");
    }
  );
});

// Delete file
router.get("/delete/:id", checkNotAuthenticated, (req, res) => {
  const { id } = req.params;
  pool.query("DELETE FROM files WHERE id = $1", [id], (err) => {
    if (err) {
      console.log(err);
    }
    res.redirect("/files");
  });
});

module.exports = router;