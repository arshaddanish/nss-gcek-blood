const express = require("express");

const app = express();

app.set('view engine', 'ejs');

app.use(express.static("public"));

app.get("/", function (req, res) {
  res.render('pages/index');
});

app.get("/login", function (req, res) {
  res.render('pages/login');
});

app.get("/register", function (req, res) {
  res.render('pages/register');
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
