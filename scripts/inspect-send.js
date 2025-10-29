const { pool } = require('../dbConfig');

(async () => {
  try {
    const res = await pool.query('SELECT id, file_id, sender_id, recipient_id, attachment, sent_at FROM send ORDER BY sent_at DESC LIMIT 20');
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
})();