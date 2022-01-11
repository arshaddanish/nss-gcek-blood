const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const initializePassport = require("./config/passport-config");
require("dotenv").config();

const users = [];

initializePassport(
  passport,
  (email) => users.find((user) => user.email === email),
  (id) => users.find((user) => user.id === id)
);

function forwardAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/login");
}

const app = express();

app.use(flash());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());

app.use(passport.session());

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false }));

app.use(express.static("public"));

app.get("/", function (req, res) {
  res.render("pages/index", { isLogged: !!req.user ? 1 : 0 });
});

app.get("/register", function (req, res) {
  if (req.user) {
    res.redirect("/logout");
  }

  res.render("pages/register", { isLogged: 0 });
});

app.get("/login", function (req, res) {
  if (req.user) {
    res.redirect("/logout");
  }

  res.render("pages/login", { isLogged: 0 });
});

app.get("/logout", forwardAuthenticated, (req, res) => {
  req.logOut();
  res.redirect("/login");
});

app.post("/register", async (req, res) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: hash,
      address: req.body.address,
      age: req.body.age,
      height: req.body.height,
      weight: req.body.weight,
      blood: req.body.blood,
    });
    res.redirect("/login");
  } catch (e) {
    res.redirect("/register");
  }
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.get("/user", forwardAuthenticated, function (req, res) {
  res.render("pages/user", { user: req.user, isLogged: 1 });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
