const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const { pool } = require("../dbConfig");
const { checkNotAuthenticated } = require("../middleware/auth"); // optional


// ✅ Set up Multer *before* the POST route
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/repository/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
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
        s.sender_id,
        s.recipient_id,
        s.sent_at,
        s.status,
        s.note
      FROM send s
      JOIN files f ON s.file_id = f.id
      JOIN users u1 ON s.sender_id = u1.id
      JOIN users u2 ON s.recipient_id = u2.id
      ORDER BY s.sent_at DESC
    `);

    // No attachment column in this listing anymore
    const rows = results.rows;

    res.render("filest", {
      layout: "layout2",
      title: "File Status",
      css: "/css/userd.css",
      user: req.user,
      send: rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// GET: Form to send file
// routes/filest.js


// GET Send File Form
router.get("/send", checkNotAuthenticated, async (req, res) => {
  try {
    const sender_id = req.user.id;

    // Fetch files (no owner relationship available in schema)
    const fileResult = await pool.query(`
      SELECT id AS file_id, name
      FROM files
      ORDER BY name
    `);

    // Fetch all users except the sender
    const userResult = await pool.query(`
      SELECT id AS user_id, name 
      FROM users 
      WHERE id <> $1
    `, [sender_id]);

    // Fetch repository files
    const repoResult = await pool.query(`
      SELECT id, file_name, file_path 
      FROM repository_files 
      WHERE user_id = $1
    `, [sender_id]);

    res.render("filest/send", {
      layout: "layout2",
      title: "Send File",
      css: "/css/userdsend.css",
      user: req.user,
      files: fileResult.rows,
      users: userResult.rows,
      repositoryFiles: repoResult.rows,
    });
  } catch (err) {
    console.error("Error loading send file page:", err);
    res.status(500).send("Failed to load send file page");
  }
});

// ✅ POST: Handle send file form (with attachment)
router.post("/send", checkNotAuthenticated, upload.single("attachment"), async (req, res) => {
  // Accept either an uploaded file (attachment) or a repository file selection
  let { file_id, recipient_id, note, repository_file } = req.body; // repository_file holds repository_files.file_path
  const sender_id = req.user.id;
  const status = 'sent';

  // Normalize file_id to null if empty
  if (!file_id) file_id = null;

  // Determine attachment path: prefer a newly uploaded file, otherwise repository selection
  let attachment_path = null;
  if (req.file && req.file.filename) {
    attachment_path = req.file.filename;
  } else if (repository_file && repository_file.trim() !== '') {
    // repository_file contains the stored filename (file_path)
    attachment_path = repository_file;
  }

  try {
    await pool.query(
      `INSERT INTO send (file_id, sender_id, recipient_id, sent_at, status, note, attachment)
       VALUES ($1, $2, $3, NOW(), $4, $5, $6)`,
      [file_id, sender_id, recipient_id, status, note, attachment_path]
    );

    res.redirect("/filest");
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

    // Attachments now live in uploads/repository/ — build URL directly
    const rows = results.rows.map(r => {
      r.attachment_url = r.attachment ? `/uploads/repository/${r.attachment}` : null;
      return r;
    });

    res.render("filest/inbox", {
      layout: "layout2",
      title: "Inbox",
      css: "/css/inbox.css", // optional
      receivedFiles: rows
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

// Note: delete action/route removed — the UI no longer exposes a delete button for send records.

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
    res.render("filest/view", {
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


// Repository view and upload routes
router.get("/repository", checkNotAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const results = await pool.query(
      `SELECT 
        id,
        file_name,
        file_path,
        uploaded_at,
        CASE 
          WHEN file_path LIKE '%.pdf' THEN 'PDF'
          WHEN file_path LIKE '%.doc%' THEN 'Word'
          WHEN file_path LIKE '%.txt' THEN 'Text'
          WHEN file_path LIKE '%.jpg' OR file_path LIKE '%.jpeg' OR file_path LIKE '%.png' THEN 'Image'
          ELSE 'Other'
        END as file_type
      FROM repository_files 
      WHERE user_id = $1 
      ORDER BY uploaded_at DESC`,
      [userId]
    );

    res.render("filest/repository", {
      layout: "layout2",
      title: "My Repository",
      css: "/css/repository.css",
      files: results.rows,
      user: req.user
    });
  } catch (err) {
    console.error("Error loading repository:", err);
    res.status(500).send("Error loading repository");
  }
});

router.post("/repository/upload", checkNotAuthenticated, upload.single("file"), async (req, res) => {
  try {
    const userId = req.user.id;
    const fileName = req.file.originalname;
    const filePath = req.file.filename;

    await pool.query(
      `INSERT INTO repository_files (user_id, file_name, file_path) VALUES ($1, $2, $3)`,
      [userId, fileName, filePath]
    );

    res.redirect("/filest/repository");
  } catch (err) {
    console.error("Repository upload error:", err);
    res.status(500).send("Error uploading file");
  }
});

// Delete repository file
router.post("/repository/delete/:fileId", checkNotAuthenticated, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    // First, get the file info to delete the physical file
    const fileResult = await pool.query(
      `SELECT file_path FROM repository_files WHERE id = $1 AND user_id = $2`,
      [fileId, userId]
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).send("File not found");
    }

    const filePath = path.join(__dirname, "..", "uploads", "repository", fileResult.rows[0].file_path);

    // Delete from database first
    await pool.query(
      `DELETE FROM repository_files WHERE id = $1 AND user_id = $2`,
      [fileId, userId]
    );

    // Then delete the physical file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.redirect("/filest/repository");
  } catch (err) {
    console.error("Error deleting repository file:", err);
    res.status(500).send("Error deleting file");
  }
});

module.exports = router