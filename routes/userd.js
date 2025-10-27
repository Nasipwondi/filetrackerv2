const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const { pool } = require("../dbConfig");
const { checkNotAuthenticated } = require("../middleware/auth"); // optional

// ✅ Set up Multer *before* the POST route
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Folder where files will be saved
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

// ================= ROUTES =================

// GET: All files
router.get("/", checkNotAuthenticated, async (req, res) => {
  try {
    const results = await pool.query(`
      SELECT 
        s.id,
        f.name,
        u1.name AS sender_name,
        u2.name AS recipient_name,
        s.sent_at,
        s.status,
        s.note,
        s.attachment
      FROM send s
      JOIN files f ON s.file_id = f.id
      JOIN users u1 ON s.sender_id = u1.id
      JOIN users u2 ON s.recipient_id = u2.id
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
    const users = await pool.query("SELECT * FROM users");

    res.render("userd/send", {
      layout: "layout2",
      title: "Send File",
      css: "/css/userdsend.css",
      files: files.rows,
      users: users.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Form error");
  }
});

// ✅ POST: Handle send file form (with attachment)
router.post("/send", checkNotAuthenticated, upload.single("attachment"), async (req, res) => {
  const { file_id, recipient_id, note } = req.body; // Ensure req.user is defined
  const sender_id = req.user.id;
  const status = 'sent';

  const attachment_path = req.file ? req.file.filename : null;

  try {
    await pool.query(
      `INSERT INTO send (file_id, sender_id, recipient_id, sent_at, status, note, attachment)
       VALUES ($1, $2, $3, NOW(), $4, $5, $6)`,
      [file_id, sender_id, recipient_id, status, note, attachment_path]
    );

    res.redirect("/userd");
  } catch (err) {
    console.error(err);
    res.status(500).send("Unable to send file");
  }
});

module.exports = router