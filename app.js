const express = require("express");
const path = require("path");

const app = express();

app.use(express.static("public"));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "/index.html"));
});

app.get("/login", function (req, res) {
  res.sendFile(path.join(__dirname, "/login.html"));
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
