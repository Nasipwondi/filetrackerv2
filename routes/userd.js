const express = require("express");
const router = express.Router();
const { pool } = require("../dbConfig");
const { checkNotAuthenticated } = require("../middleware/auth"); // optional

// Get all files
router.get("/", checkNotAuthenticated, (req, res) => {
  pool.query("SELECT * FROM send", (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Database error");
    }

    res.render("userd", {
      layout: "layout2", // ✅ forces layout2.ejs
      title: "User Dashboard",
      css: "/css/userd.css",
      user: req.user,
      send: results.rows
    });
  });
});

// Add new file form
router.get("/send", checkNotAuthenticated, (req, res) => {
  res.render("userd/send", {
    layout: "layout2",
    title: "Send a New File",
    css: "/css/userdsend.css",
  });
});

// Add new file action
router.post("/send", checkNotAuthenticated, (req, res) => {
  const { file_id, sender_id, recipient_id, date, status, note } = req.body;

  pool.query(
    "INSERT INTO send (file_id, sender_id, recipient_id, date, status, note) VALUES ($1, $2, $3, $4, $5, $6)",
    [file_id, sender_id, recipient_id, date, status, note],
    (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Unable to send file.");
      }
      res.redirect("/userd");
    }
  );
});

// Edit file form
router.get("/edit/:id", checkNotAuthenticated, (req, res) => {
  const { id } = req.params;
  pool.query("SELECT * FROM send WHERE id = $1", [id], (err, results) => {
    if (err || results.rows.length === 0) {
      console.log(err);
      return res.status(404).send("File not found");
    }

    res.render("send/edit", {
      file: results.rows[0],
      layout: "layout2",
      title: "Update File",
      css: "/css/userdedit.css",
    });
  });
});

// Update file
router.post("/edit/:id", checkNotAuthenticated, (req, res) => {
  const { id } = req.params;
  const { file_id, sender_id, recipient_id, date, status, note } = req.body;

  pool.query(
    "UPDATE send SET file_id = $1, sender_id = $2, recipient_id = $3, date = $4, status = $5, note = $6 WHERE id = $7",
    [file_id, sender_id, recipient_id, date, status, note, id],
    (err) => {
      if (err) {
        console.log(err);
      }
      res.redirect("/userd");
    }
  );
});

// Delete file
router.get("/delete/:id", checkNotAuthenticated, (req, res) => {
  const { id } = req.params;
  pool.query("DELETE FROM send WHERE id = $1", [id], (err) => {
    if (err) {
      console.log(err);
    }
    res.redirect("/userd");
  });
});

module.exports = router;