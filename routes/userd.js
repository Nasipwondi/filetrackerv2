const express = require("express");
const router = express.Router();
const { pool } = require("../dbConfig");
const { checkNotAuthenticated } = require("../middleware/auth"); // optional


// Get all files
router.get("/", checkNotAuthenticated, async (req, res) => {
  try {
    const results = await pool.query(`
      SELECT 
        s.id,
        f.name,
        st1.name AS sender_name,
        st2.name AS recipient_name,
        s.sent_at,
        s.received_at,
        s.status,
        s.note
      FROM send s
      JOIN files f ON s.file_id = f.id
      JOIN staff st1 ON s.sender_id = st1.id
      JOIN staff st2 ON s.recipient_id = st2.id
      ORDER BY s.sent_at DESC
    `);

    res.render("userd", {
      layout: "layout2",
      title: "User Dashboard",
      css: "/css/userd.css",
      user: req.user,
      send: results.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// GET: Form to send file
router.get("/send", checkNotAuthenticated, async (req, res) => {
  try {
    const files = await pool.query("SELECT * FROM files");
    const staff = await pool.query("SELECT * FROM staff");

    res.render("userd/send", {
      layout: "layout2",
      title: "Send File",
      css: "/css/userdsend.css",
      files: files.rows,
      staff: staff.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Form error");
  }
});

// POST: Handle send file form
router.post("/send", checkNotAuthenticated, async (req, res) => {
  const { file_id, sender_id, recipient_id, sent_at, received_at, note } = req.body;
  const status = 'Sent';
  try {
    await pool.query(
      `INSERT INTO send (file_id, sender_id, recipient_id, sent_at, received_at, status, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [file_id, sender_id, recipient_id, sent_at || new Date(), received_at || null, status, note]
    );

    res.redirect("/userd");
  } catch (err) {
    console.error(err);
    res.status(500).send("Unable to send file");
  }
});

module.exports = router;