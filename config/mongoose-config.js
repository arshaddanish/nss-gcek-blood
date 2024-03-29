const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", function () {
  console.log("Mongoose Connected");
});

mongoose.connection.on("error", function (err) {
  console.log("Mongoose default connection error: " + err);
});

mongoose.connection.on("disconnected", function () {
  console.log("Mongoose default connection disconnected");
});

process.on("SIGINT", function () {
  mongoose.connection.close(function () {
    console.log(
      "Mongoose default connection disconnected through app termination"
    );
    process.exit(0);
  });
});

const Users = mongoose.model("users", {
  id: String,
  name: String,
  email: String,
  phone: String,
  password: String,
  address: String,
  age: Number,
  height: Number,
  weight: Number,
  batch: String,
  branch: String,
  blood: String,
  note: String,
  date: String,
  admin: Boolean,
});

const Donations = mongoose.model("donations", {
  id: String,
  name: String,
  email: String,
  phone: String,
  date: String,
  image: String,
  patient: String,
  place: String,
});

module.exports = { Users, Donations };
