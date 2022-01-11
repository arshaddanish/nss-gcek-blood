const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const { Parser } = require("json2csv");
const initializePassport = require("./config/passport-config");
const { Users } = require("./config/mongoose-config");
require("dotenv").config();

initializePassport(
  passport,
  async (email) => {
    const check = await Users.findOne({ email: email });
    return check ? check.toObject() : check;
  },
  async (id) => {
    const check = await Users.findOne({ id: id });
    return check ? check.toObject() : check;
  }
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

app.get("/", (req, res) => {
  res.render(
    "pages/index",
    !!req.user ? { isLogged: 1, user: req.user } : { isLogged: 0, user: {} }
  );
});

app.get("/register", (req, res) => {
  if (req.user) {
    res.redirect("/logout");
  }

  res.render("pages/register", { isLogged: 0, user: {} });
});

app.get("/login", (req, res) => {
  if (req.user) {
    res.redirect("/logout");
  }

  res.render("pages/login", { isLogged: 0, user: {} });
});

app.get("/logout", forwardAuthenticated, (req, res) => {
  req.logOut();
  res.redirect("/login");
});

app.post("/register", async (req, res) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    const check = await Users.findOne({ email: req.body.email });
    if (check) {
      res.redirect("/register", {
        message: "This email already have an account",
      });
    } else {
      const user = new Users({
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
        admin: false,
      });
      await user.save();
      res.redirect("/login");
    }
  } catch (e) {
    console.log(e);
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

app.get("/user", forwardAuthenticated, (req, res) => {
  res.render("pages/user", { user: req.user, isLogged: 1 });
});

app.post("/user", forwardAuthenticated, async (req, res) => {
  try {
    let hash;

    if (!!req.body.password) {
      hash = await bcrypt.hash(req.body.password, 10);
    }

    await Users.updateOne(
      { email: req.user.email },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
          password: hash ? hash : req.user.password,
          address: req.body.address,
          age: req.body.age,
          height: req.body.height,
          weight: req.body.weight,
          blood: !!req.body.blood ? req.body.blood : req.user.blood,
        },
      }
    );

    res.redirect("/user");
  } catch (e) {
    console.log(e);
    res.redirect("/user");
  }
});

app.get("/data", forwardAuthenticated, async (req, res) => {
  if (req.user.admin) {
    let users = await Users.find();

    users = users.map((doc) => {
      return {
        name: doc.name,
        email: doc.email,
        phone: doc.phone,
        address: doc.address,
        age: doc.age,
        height: doc.height,
        weight: doc.weight,
        blood: doc.blood,
      };
    });

    try {
      const parser = new Parser({
        fields: [
          "name",
          "email",
          "phone",
          "address",
          "age",
          "height",
          "weight",
          "blood",
        ],
      });
      const csv = parser.parse(users);
      res.set({ "Content-disposition": "attachment; filename=export.csv" });
      res.send(csv);
    } catch (e) {
      console.log(e);
    }
  } else {
    res.redirect("/login");
  }
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
