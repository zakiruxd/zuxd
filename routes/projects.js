const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const crypto = require("crypto");
const multer = require("multer");
const mongoose = require("mongoose");
const config = require("../config/database");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
const path = require("path");
const async = require("async");

//Bring in the Project model
let Project = require("../models/project");

//Middlware
router.use(methodOverride("_method"));
router.use(bodyParser.urlencoded({ extended: false }));

//Initialize GridFS
let gfs;
//Connect to mongoose

//Connect to mongoose
// const conn = mongoose.connect(config.database);
const conn = mongoose.createConnection("mongodb://localhost:27017/zuxd");
let db = mongoose.connection;

conn.once("open", function() {
  //Initialize stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("images");
});

//Check connection
db.once("open", () => {
  console.log("Connected to mongoDB");
});
//Check for DB Errors
db.on("error", err => {
  console.log(err);
});

//Create storage engine
const storage = new GridFsStorage({
  url: "mongodb://localhost:27017/zuxd",
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "images" //The bucket name should match the collection name defined above
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

//Get All Projects Route
router.get("/", (req, res) => {
  Project.find({}, (err, projects) => {
    res.render("portfolio", {
      projects: projects
    });
  });
});

//Get Single Image Route
router.get("/image/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    //Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: "No file exists"
      });
    }
    //Check if image
    if (file.contentType === "image/jpeg" || file.contentType === "image/png") {
      //Road output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: "Not An Image"
      });
    }
  });
});

//Add New Project GET Route
router.get("/add", (req, res) => {
  res.render("add-project");
});

//Add New Project PUT Route
router.post("/add", upload.any(), (req, res) => {
  let project = new Project({
    title: req.body.title,
    description: req.body.description,
    livelink: req.body.livelink,
    designlink: req.body.designlink,
    image: req.files[0].filename
  });
  project.save(err => {
    res.redirect("/portfolio");
  });
});

//Get the Edit Project Route
router.get("/edit/:id", upload.any(), (req, res) => {
  Project.findById(req.params.id, (err, projects) => {
    if (err) {
      return res.status(404).json({ err: "There is an error" });
    } else {
      res.render("edit-project", {
        projects: projects
      });
    }
  });
});

//Add New Project PUT Route (This is a working code for updating only text)
// router.put("/edit/:id", upload.any(), (req, res) => {
//   Project.findByIdAndUpdate(
//     req.params.id,
//     req.body.project,
//     (err, updatedProject) => {
//       if (err) {
//         res.redirect("/edit/" + req.params.id);
//       } else {
//         res.redirect("/portfolio");
//       }
//     }
//   );
// });

//Add New Project PUT Route (This is a code for updating both text and image)
router.post("/edit/:id", upload.any(), (req, res) => {
  let newProjectData = {};
  newProjectData.title = req.body.project.title;
  newProjectData.description = req.body.project.description;
  newProjectData.livelink = req.body.project.livelink;
  newProjectData.designlink = req.body.project.designlink;
  // newProjectData.image = req.files[0].filename;
  // newProjectData.image = req.body.image;

  console.log(newProjectData);

  let query = { _id: req.params.id };

  Project.update(query, newProjectData, (err, updatedProject) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/portfolio");
    }
  });
});

// Delete Project Route
// EXPLANATION FOR ROUTE BELOW
// The first step is to find the relevant project and so the outter most Mongoose query does that with findById. Then within the query we asychronously delete both the project
// in the projects database and the chunks and files in the two images databases. To run the two nested queries simultaneously, we use the async.series feature by requiring the async variable
// at the top of this document.
router.delete("/:id", (req, res) => {
  Project.findById(req.params.id, (err, projects) => {
    async.series(
      [
        callback => {
          //Remove the project from the database
          Project.findByIdAndRemove(req.params.id, err => {
            if (err) {
              return res.status(404).json({ err: "There is an error" });
            }
          });
          //Callback must be invoked in order to move to the next callback
          callback();
        },
        callback => {
          gfs.remove(
            { filename: projects.image, root: "images" },
            (err, gridStore) => {
              if (err) {
                return res.status(404).json({ err: "There is an error" });
              }
              res.redirect("/portfolio");
            }
          );
        }
      ],
      err => {
        res.redirect("/portfolio");
      }
    );
  });
});
module.exports = router;
