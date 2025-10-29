const fs = require('fs');
const path = require('path');
const { pool } = require('../dbConfig');

(async () => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const repoDir = path.join(uploadsDir, 'repository');

  if (!fs.existsSync(uploadsDir)) {
    console.error('uploads directory does not exist:', uploadsDir);
    process.exit(1);
  }

  if (!fs.existsSync(repoDir)) {
    fs.mkdirSync(repoDir, { recursive: true });
    console.log('Created repository folder:', repoDir);
  }

  try {
    const items = fs.readdirSync(uploadsDir);
    for (const name of items) {
      const fullPath = path.join(uploadsDir, name);
      // skip the repository directory itself
      if (name === 'repository') continue;

      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        let targetName = name;
        const targetPath = path.join(repoDir, targetName);

        // if file with same name exists in repo, rename with timestamp
        if (fs.existsSync(targetPath)) {
          const ts = Date.now();
          const ext = path.extname(name);
          const base = path.basename(name, ext);
          targetName = `${base}-${ts}${ext}`;
        }

        const newPath = path.join(repoDir, targetName);
        fs.renameSync(fullPath, newPath);
        console.log(`Moved: ${fullPath} -> ${newPath}`);

        // If name changed (due to collision), update DB rows referring to old name
        if (targetName !== name) {
          try {
            const res = await pool.query(
              `UPDATE send SET attachment = $1 WHERE attachment = $2 RETURNING id`,
              [targetName, name]
            );
            console.log(`Updated ${res.rowCount} send rows from ${name} -> ${targetName}`);

            // Also update repository_files table if any rows pointed to this exact filename (unlikely for top-level files)
            const res2 = await pool.query(
              `UPDATE repository_files SET file_path = $1 WHERE file_path = $2 RETURNING id`,
              [targetName, name]
            );
            if (res2.rowCount > 0) console.log(`Updated ${res2.rowCount} repository_files rows from ${name} -> ${targetName}`);
          } catch (dbErr) {
            console.error('DB update error for', name, dbErr);
          }
        } else {
          // if name unchanged, still ensure send rows pointing to name remain valid; nothing to update
        }
      }
    }

    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
})();