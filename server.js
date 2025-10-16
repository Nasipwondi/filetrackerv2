const express = require("express");
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
require("dotenv").config();
const app = express();
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const { checkAuthenticated, checkNotAuthenticated } = require("./middleware/auth");

const PORT = process.env.PORT || 4000;
const initializePassport = require("./passportConfig");
initializePassport(passport);

// Routes
const fileRoutes = require("./routes/files");
const directorateRoutes = require("./routes/directorates");
const departmentRoutes = require("./routes/departments");
const staffRoutes = require("./routes/staff");

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layout");
app.use(expressLayouts);

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Routes
app.get("/", (req, res) => res.render("index"));


app.use("/files", fileRoutes);
app.use("/directorates", directorateRoutes);
app.use("/departments", departmentRoutes);
app.use("/staff", staffRoutes);

// Authentication Routes
app.get("/users/register", checkAuthenticated, (req, res) => {
  res.render("register");
});

app.get("/users/login", checkAuthenticated, (req, res) => {
  const errorMessages = req.flash("error");
  const successMessages = req.flash("success_msg");

  res.render("login", {
    errorMessages,
    successMessages,
  });
});

app.get("/users/dashboard", checkNotAuthenticated, (req, res) => {
  res.render("dashboard", { user: req.user.name });
});

app.get("/users/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.render("login", { message: "You have logged out successfully" });
  });
});

app.post("/users/register", async (req, res) => {
  let { name, email, password, password2 } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ message: "Please enter all fields" });
  }
  if (password.length < 6) {
    errors.push({ message: "Password must be at least 6 characters" });
  }
  if (password !== password2) {
    errors.push({ message: "Passwords do not match" });
  }

  if (errors.length > 0) {
    return res.render("register", { errors, name, email, password, password2 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  pool.query("SELECT * FROM users WHERE email = $1", [email], (err, results) => {
    if (err) throw err;

    if (results.rows.length > 0) {
      return res.render("register", {
        message: "Email already registered",
      });
    } else {
      pool.query(
        "INSERT INTO users (name, email, password) VALUES ($1, $2, $3)",
        [name, email, hashedPassword],
        (err) => {
          if (err) throw err;
          req.flash("success_msg", "You are now registered. Please log in");
          res.redirect("/users/login");
        }
      );
    }
  });
});

app.post(
  "/users/login",
  passport.authenticate("local", {
    successRedirect: "/users/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true,
  })
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

