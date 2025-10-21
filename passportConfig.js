const LocalStrategy = require("passport-local").Strategy;
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");

function initialize(passport) {
  console.log("Passport Config Initialized");

  const authenticateUser = (email, password, done) => {
    console.log("Authenticating user:", email);

    pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email],
      (err, results) => {
        const user = results.rows[0];
    // user.role will now be available
        if (err) {
          return done(err);
        }
        console.log("Query results:", results.rows);

        if (results.rows.length > 0) {
          const user = results.rows[0];
          bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
              console.error("Error comparing passwords:", err);
              return done(err);
            }
            if (isMatch) {
              console.log("Password match for user:", user.email);
              return done(null, user);
            } else {
              console.log("Password does not match for user:", user.email);
              return done(null, false, { message: "Password is not correct" });
            }
          });
        } else {
          console.log("User not found:", email);
          return done(null, false, { message: "Email is not registered" });
        }
      }
    );
  };

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      authenticateUser
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser((id, done) => {
    pool.query(`SELECT * FROM users WHERE id = $1`, [id], (err, results) => {
      if (err) {
        return done(err);
      }
      console.log(`ID is ${results.rows[0].id}`);
      return done(null, results.rows[0]);
    });
  });
}

module.exports = initialize;
