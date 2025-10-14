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

  pool.query("SELECT * FROM directorates", (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Database error");
    }
    res.render("directorates", { directorates: results.rows });
  });
});

// Add new file form
router.get("/add", checkNotAuthenticated, (req, res) => {
  res.render("directorates/add", {
    layout: "layout",
    title: "Add New Directorate",
    css: "/css/filesadd.css",
  });
});

// Add new file action
router.post("/add", checkNotAuthenticated, (req, res) => {
  const { name } = req.body;

  pool.query(
    "INSERT INTO directorates (name) VALUES ($1)",
    [name],
    (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Failed to add directorate.");
      }
      res.redirect("/directorates");
    }
  );
});

// Edit file form
router.get("/edit/:id", checkNotAuthenticated, (req, res) => {
  const { id } = req.params;
  pool.query("SELECT * FROM directorates WHERE id = $1", [id], (err, results) => {
    if (err || results.rows.length === 0) {
      console.log(err);
      return res.status(404).send("Directorate not found");
    }

    res.render("directorates/edit", {
      directorate: results.rows[0],
      layout: "layout",
      title: "Update Directorate",
      css: "/css/filesedit.css",
    });
  });
});

// Update file
router.post("/edit/:id", checkNotAuthenticated, (req, res) => {
  const { id } = req.params;
  const { name} = req.body;

  pool.query(
    "UPDATE directorates SET name = $1 WHERE id = $2",
    [name, id],
    (err) => {
      if (err) {
        console.log(err);
      }
      res.redirect("/directorates");
    }
  );
});

// Delete file
router.get("/delete/:id", checkNotAuthenticated, (req, res) => {
  const { id } = req.params;
  pool.query("DELETE FROM directorates WHERE id = $1", [id], (err) => {
    if (err) {
      console.log(err);
    }
    res.redirect("/directorates");
  });
});

module.exports = router;