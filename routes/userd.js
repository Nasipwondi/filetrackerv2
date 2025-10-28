const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const { pool } = require("../dbConfig");
const { checkNotAuthenticated } = require("../middleware/auth"); // optional
const fs = require("fs");

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

router.get("/inbox", checkNotAuthenticated, async (req, res) => {
  const userId = req.user.id;
  try {
    const userId = req.user.id; // using req.user from your session/passport
    const results = await pool.query(
      `SELECT 
          f.name AS file_name,
          u1.name AS sender_name,
          s.sent_at,
          s.attachment,
          s.status,
          s.note,
          s.file_id
       FROM send s
       JOIN users u1 ON s.sender_id = u1.id
       JOIN files f ON s.file_id = f.id
       WHERE s.recipient_id = $1
       ORDER BY s.sent_at DESC`,
      [userId]
    );

    res.render("userd/inbox", {
      layout: "layout2",
      title: "Inbox",
      css: "/css/inbox.css", // optional
      receivedFiles: results.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Unable to load inbox");
  }
});

router.get("/downloads/:fileId", checkNotAuthenticated, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT attachment FROM send WHERE file_id = $1 AND recipient_id = $2 LIMIT 1`,
      [fileId, userId]
    );

    if (result.rows.length === 0 || !result.rows[0].attachment) {
      return res.status(404).send("File not found or has no attachment");
    }

    const filename = result.rows[0].attachment;
    const filePath = path.join(__dirname, "..", "uploads", filename);

    console.log("Serving file:", filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found on server");
    }

    res.download(filePath, filename);
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).send("Server error during download");
  }
});

router.get("/delete/:fileId", checkNotAuthenticated, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    // Delete the record only if it belongs to the logged-in user
    await pool.query(
      "DELETE FROM send WHERE file_id = $1 AND recipient_id = $2",
      [fileId, userId]
    );

    req.flash("success_msg", "File deleted successfully");
    res.redirect("/userd/inbox");
  } catch (err) {
    console.error("Error deleting file:", err);
    res.status(500).send("Failed to delete file");
  }
});

// GET: View file details
router.get("/view/:fileId", checkNotAuthenticated, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    // Get file details including sender info and file info
    const result = await pool.query(
      `SELECT 
        f.name AS file_name,
        f.description,
        f.created_at,
        u1.name AS sender_name,
        s.sent_at,
        s.status,
        s.note,
        s.attachment
      FROM send s
      JOIN files f ON s.file_id = f.id
      JOIN users u1 ON s.sender_id = u1.id
      WHERE s.file_id = $1 AND s.recipient_id = $2
      LIMIT 1`,
      [fileId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("File not found");
    }

    const fileDetails = result.rows[0];
    
    // Create a new view template for displaying file details
    res.render("userd/view", {
      layout: "layout2",
      title: "View Document",
      css: "/css/inbox.css",
      file: fileDetails
    });
  } catch (err) {
    console.error("Error viewing file:", err);
    res.status(500).send("Failed to view file details");
  }
});

module.exports = router