const { app, BrowserWindow } = require('electron');
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");

const port = 3400;

// Create Express app
const expressApp = express();

// Middleware setup
expressApp.use(bodyParser.json({ limit: "1mb" }));
expressApp.use(bodyParser.urlencoded({ extended: true }));
expressApp.use(cors({
  origin: "*", // Allow requests from any origin
  methods: ["OPTIONS", "POST", "GET", "DELETE"], // Allow these HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allow these headers
}));

// Get the path to the application executable directory
// Get the path to the Documents directory
const documentsDirectory = path.join(app.getPath('documents'), 'uploads');

// Ensure the uploads directory exists
if (!fs.existsSync(documentsDirectory)) {
  fs.mkdirSync(documentsDirectory, { recursive: true });
}


// Serve static files
expressApp.use(express.static(path.join(__dirname, 'build')));

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, documentsDirectory);
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
  })
});

// Upload endpoint
expressApp.post("/upload", upload.single("file"), (req, res) => {
  const folderName = req.body.folderName;
  let destinationFolder = documentsDirectory;

  // If the user provided a folder name
  if (folderName) {
    // Resolve the folder path relative to the current working directory
    const folderPath = path.resolve(documentsDirectory, folderName);

    // Check if the folder exists
    if (!fs.existsSync(folderPath)) {
      // If the folder doesn't exist, create it
      fs.mkdirSync(folderPath, { recursive: true });
    }

    destinationFolder = folderPath;
  }

  // Move the uploaded file to the specified destination folder
  const file = req.file;
  const destinationPath = path.join(destinationFolder, file.originalname);

  fs.renameSync(file.path, destinationPath);

  res.send("File uploaded successfully");
});

// Create main Electron window
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true
    }
  });
  mainWindow.setMenu(null)
  mainWindow.loadURL(`http://localhost:${port}`);
}

// Start Express server when Electron app is ready
app.whenReady().then(() => {
  expressApp.listen(port, () => {
    console.log(`Express server running at http://localhost:${port}`);
  });

  createWindow();
});

// Quit the app when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, quit the app when all windows are closed unless Cmd + Q is explicitly used
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// When the app is activated, create a new browser window
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});