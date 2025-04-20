const express = require("express");
const multer = require("multer");
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(express.static("public"));
const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.array("documents"), (req, res) => {
  const uploadDir = path.resolve("uploads");
  const pythonScript = path.join(__dirname, "compare.py");

  execFile("python3", [pythonScript, uploadDir], (err, stdout, stderr) => {
    if (err) {
      console.error("Python error:", stderr);
      return res.status(500).send("Error processing documents.");
    }

    try {
      const result = JSON.parse(stdout);
      // Only delete files after processing is complete
      fs.readdir(uploadDir, (err, files) => {
        if (!err) {
          for (const file of files) {
            fs.unlink(path.join(uploadDir, file), (err) => {
              if (err) console.error("Failed to delete", file);
            });
          }
        }
      });
      res.json(result);
    } catch (e) {
      console.error("Invalid JSON from Python:", stdout);
      res.status(500).send("Invalid result from Python.");
    }
  });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));