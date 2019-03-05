const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
var exphbs = require("express-handlebars");
const PORT = process.env.PORT || 3000;
const config = require("./config/database");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");

//Connect to mongoose
const conn = mongoose.connect(config.database);

//Load the View Engine for Handlebars
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

//Home Page Route
app.get("/", (req, res) => {
  res.render("home");
});

//Our Process Page Route
app.get("/process", (req, res) => {
  res.render("our-process");
});

app.use(express.static(path.join(__dirname, "/public")));

//Routing to Projects Portfolio
let portfolio = require("./routes/projects");
app.use("/portfolio", portfolio);

//
//  LISTENER
//

//Listener to get the app running on a port
app.listen(PORT, () => {
  console.log(`Server has started on port: ${PORT}`);
});
