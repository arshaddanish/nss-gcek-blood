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
  } else {
    res.redirect("/login");
  }
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
  } else {
    let temp = req.session.register_message;
    req.session.register_message = "";
    res.render("pages/register", {
      isLogged: 0,
      user: {},
      messages: { error: temp },
    });
  }
});

app.get("/login", (req, res) => {
  if (req.user) {
    res.redirect("/logout");
  } else {
    res.render("pages/login", { isLogged: 0, user: {} });
  }
});

app.get("/logout", forwardAuthenticated, (req, res) => {
  req.logOut();
  res.redirect("/login");
});

app.post("/register", async (req, res) => {
  try {
    const check = await Users.findOne({ email: req.body.email });
    if (check) {
      req.session.register_message = "This email already have an account";
      res.redirect("/register");
    } else {
      if (
        !req.body.name &&
        !req.body.email &&
        !req.body.phone &&
        !req.body.password &&
        !req.body.address &&
        !req.body.age &&
        !req.body.height &&
        !req.body.weight &&
        !req.body.batch &&
        !req.body.branch &&
        !req.body.blood
      ) {
        req.session.register_message = "All fields are required";
        res.redirect("/register");
      } else if (req.body.age < 18) {
        req.session.register_message = "You must be at least 18 years old";
        res.redirect("/register");
      } else if (req.body.weight < 45) {
        req.session.register_message = "You must be at least 45 kilo gram";
        res.redirect("/register");
      } else {
        const hash = await bcrypt.hash(req.body.password, 10);
        const user = new Users({
          id: Date.now().toString(),
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
          password: hash,
          address: req.body.address.replace(/\n/g, ","),
          age: req.body.age,
          height: req.body.height,
          weight: req.body.weight,
          batch: req.body.batch,
          branch: req.body.branch,
          blood: req.body.blood,
          note: req.body.note.replace(/\n/g, ","),
          date: req.body.date,
          admin: false,
        });
        await user.save();
        res.redirect("/login");
      }
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
  let temp = req.session.user_message;
  req.session.user_message = "";
  res.render("pages/user", {
    isLogged: 1,
    user: req.user,
    messages: { error: temp },
  });
});

app.post("/user", forwardAuthenticated, async (req, res) => {
  try {
    const check = await Users.findOne({ email: req.body.email });
    if (req.user.email != req.body.email && check) {
      req.session.user_message = "This email already have an account";
      res.redirect("/user");
    } else {
      if (
        !req.body.name &&
        !req.body.email &&
        !req.body.phone &&
        !req.body.address &&
        !req.body.age &&
        !req.body.height &&
        !req.body.weight
      ) {
        req.session.user_message = "All fields are required";
        res.redirect("/user");
      } else if (req.body.age < 18) {
        req.session.user_message = "You must be at least 18 years old";
        res.redirect("/user");
      } else if (req.body.weight < 45) {
        req.session.user_message = "You must be at least 45 kilo gram";
        res.redirect("/user");
      } else {
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
              address: req.body.address.replace(/\n/g, ","),
              age: req.body.age,
              height: req.body.height,
              weight: req.body.weight,
              batch: !!req.body.batch ? req.body.batch : req.user.batch,
              branch: !!req.body.branch ? req.body.branch : req.user.branch,
              blood: !!req.body.blood ? req.body.blood : req.user.blood,
              note: req.body.note.replace(/\n/g, ","),
              date: req.body.date,
            },
          }
        );

        res.redirect("/user");
      }
    }
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
        batch: doc.batch,
        branch: doc.branch,
        blood: doc.blood,
        note: doc.note,
        date: doc.date,
        admin: doc.admin,
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
          "batch",
          "branch",
          "blood",
          "note",
          "date",
          "admin",
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

app.get("/make-admin", forwardAuthenticated, async (req, res) => {
  if (req.user.admin) {
    res.render("pages/make-admin");
  } else {
    res.redirect("/login");
  }
});

app.post("/make-admin", forwardAuthenticated, async (req, res) => {
  if (req.user.admin) {
    const check = await Users.findOne({ email: req.body.email });
    if (check) {
      await Users.updateOne(
        { email: req.body.email },
        {
          $set: {
            admin: true,
          },
        }
      );

      res.send("Now user with this email is a admin");
    } else {
      res.send("This email have no account");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/delete-user", forwardAuthenticated, async (req, res) => {
  if (req.user.admin) {
    res.render("pages/delete-user");
  } else {
    res.redirect("/login");
  }
});

app.post("/delete-user", forwardAuthenticated, async (req, res) => {
  if (req.user.admin) {
    const check = await Users.findOne({ email: req.body.email });
    if (check) {
      await Users.deleteOne({ email: req.body.email });

      res.send("Now user with this email deleted");
    } else {
      res.send("This email have no account");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/admin", forwardAuthenticated, async (req, res) => {
  if (req.user.admin) {
    res.render("pages/admin");
  } else {
    res.redirect("/login");
  }
});

app.get("/view-data", forwardAuthenticated, async (req, res) => {
  if (req.user.admin) {
    let users = await Users.find(
      req.query.filter ? { blood: req.query.filter } : {}
    );

    users = users.map((doc) => {
      return {
        name: doc.name,
        email: doc.email,
        phone: doc.phone,
        address: doc.address,
        age: doc.age,
        height: doc.height,
        weight: doc.weight,
        batch: doc.batch,
        branch: doc.branch,
        blood: doc.blood,
        note: doc.note,
        date: doc.date,
        admin: doc.admin,
      };
    });

    if (req.query.sort && req.query.order) {
      if (["age", "height", "weight"].includes(req.query.sort)) {
        users = users.sort((a, b) => {
          return req.query.order == "ac"
            ? a[req.query.sort] - b[req.query.sort]
            : b[req.query.sort] - a[req.query.sort];
        });
      } else {
        users = users.sort((a, b) => {
          let fa = a[req.query.sort].toLowerCase(),
            fb = b[req.query.sort].toLowerCase();

          if (fa < fb) {
            return -1;
          }

          if (fa > fb) {
            return 1;
          }

          return 0;
        });

        if (req.query.order == "ac") {
          users = users.reverse();
        }
      }
    }

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
          "batch",
          "branch",
          "blood",
          "note",
          "date",
          "admin",
        ],
      });
      const csv = parser.parse(users);
      let table = "";
      const rows = csv.split("\n");
      for (var i = 0; i < rows.length; i++) {
        var cells = rows[i].split(",");
        if (cells.length > 1) {
          table += "<tr>";
          for (var j = 0; j < cells.length; j++) {
            if (cells[j][0] == '"') {
              cells[j] = cells[j].slice(1, -1);
            }
            table += i ? `<td>${cells[j]}</td>` : `<th>${cells[j]}</th>`;
          }
          table += "<tr>";
        }
      }
      res.render("pages/view-data", { csv: table });
    } catch (e) {
      console.log(e);
      res.redirect("/login");
    }
  } else {
    res.redirect("/login");
  }
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
