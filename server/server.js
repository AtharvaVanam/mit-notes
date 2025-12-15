const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
// Serve the 'uploads' folder so the frontend can access the PDF files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 1. DATABASE SCHEMA ---
const NoteSchema = new mongoose.Schema({
  branch: { type: String, required: true },
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  description: String,
  filePath: { type: String, required: true },
  originalName: String,
  uploadDate: { type: Date, default: Date.now },
});

// Create text index for the search functionality
NoteSchema.index({ subject: 'text', topic: 'text', description: 'text' });
const Note = mongoose.model('Note', NoteSchema);

// --- 2. MODERATION SYSTEM ---
const BANNED_KEYWORDS = ['gore', 'violence', 'nude', 'nsfw', 'xxx', 'kill', 'blood'];

const checkContentSafety = (text) => {
  if (!text) return true;
  const lowerText = text.toLowerCase();
  // Returns true if NO banned words are found
  return !BANNED_KEYWORDS.some(word => lowerText.includes(word));
};

// --- 3. FILE STORAGE CONFIGURATION ---
// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files to 'uploads' folder
  },
  filename: (req, file, cb) => {
    // Rename file to prevent duplicates: Timestamp-OriginalName
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// --- 4. API ROUTES ---

// Route: Upload a new note
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const { branch, subject, topic, description } = req.body;

    // Basic Moderation Check
    if (!checkContentSafety(topic) || !checkContentSafety(description)) {
        // If unsafe, delete the file that was just uploaded
        if(req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Content flagged by moderation system.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const newNote = new Note({
      branch,
      subject,
      topic,
      description,
      filePath: req.file.path.replace(/\\/g, "/"), // Fix for Windows paths
      originalName: req.file.originalname
    });

    await newNote.save();
    res.status(201).json({ message: 'Upload successful!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route: Smart Search
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json({ internal: [], external: null });

  try {
    // A. Internal DB Search
    const internalResults = await Note.find({
      $text: { $search: query }
    }).limit(10);

    // B. External Knowledge Fallback (Simulated)
    // If fewer than 3 results found, trigger the "AI" fallback
    let externalKnowledge = null;
    if (internalResults.length < 3) {
      externalKnowledge = {
        source: "External Knowledge Base",
        title: `Concept Summary: ${query}`,
        summary: `We found limited local PDFs, but here is what you need to know about ${query}. This topic usually covers foundational principles in ${req.query.branch || 'engineering'}. Important questions often involve derivations and practical applications.`,
      };
    }

    res.json({ internal: internalResults, external: externalKnowledge });

  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// Route: Get Recent Notes (for Home Page)
app.get('/api/notes', async (req, res) => {
    try {
        const notes = await Note.find().sort({ uploadDate: -1 }).limit(20);
        res.json(notes);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

// Route: Test Server Status
app.get('/', (req, res) => {
  res.send('✅ MIT Notes Backend is Running!');
});

// --- 5. START SERVER (UPDATED FOR CLOUD) ---
// This part looks for Cloud settings (process.env) first
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mit_notes';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Connection Error:', err));

// Start Listening immediately
app.listen(PORT, () => console.log(`✅ Server running on Port ${PORT}`));