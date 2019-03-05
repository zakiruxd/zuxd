//In this model file, we build a Schema for the projects we want to display.

const mongoose = require("mongoose");

//Schema
let projectSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  livelink: {
    type: String
  },
  designlink: {
    type: String
  },
  image: {
    type: String,
    required: true
  }
});

let Poject = (module.exports = mongoose.model("Project", projectSchema));
