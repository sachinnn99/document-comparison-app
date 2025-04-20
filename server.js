const express = require("express");
const multer = require("multer");
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Serve static files from the public folder
app.use(express.static("public"));

// Ensure uploads directory exists
const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ✅ Use multer with original file names
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Keep original name
  },
});

const upload = multer({ storage });

// Handle upload and comparison
app.post("/upload", upload.array("documents"), (req, res) => {
  if (!req.files || req.files.length < 2) {
    return res.status(400).json({ error: "Please upload at least two documents to compare" });
  }

  const pythonScript = path.join(__dirname, "compare.py");

  execFile("python3", [pythonScript, uploadsDir], { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
    if (err) {
      console.error("Python execution error:", err);
      console.error("Python stderr:", stderr);
      return res.status(500).json({ error: "Error processing documents" });
    }

    console.log("Raw Python output:", stdout);

    try {
      const result = JSON.parse(stdout.trim());

      // Clean up uploaded files
      fs.readdir(uploadsDir, (err, files) => {
        if (!err) {
          for (const file of files) {
            fs.unlink(path.join(uploadsDir, file), (err) => {
              if (err) console.error("Failed to delete", file);
            });
          }
        }
      });

      return res.json(result);
    } catch (e) {
      console.error("JSON parse error:", e);
      console.error("Invalid JSON from Python:", stdout);
      return res.status(500).json({
        error: "Invalid result from Python script",
        details: e.message,
      });
    }
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Start the server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));