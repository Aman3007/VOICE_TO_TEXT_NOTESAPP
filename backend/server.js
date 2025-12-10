
// // ============================================
// // COMPLETE BACKEND - SINGLE FILE
// // Voice Notes App with JWT Authentication + OpenAI Whisper
// // ============================================

// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const cookieParser = require('cookie-parser');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const multer = require('multer');
// const FormData = require('form-data');
// const fetch = require('node-fetch');
// const fs = require('fs');
// const path = require('path');
// require('dotenv').config();

// const app = express();

// // ============================================
// // MULTER CONFIGURATION
// // ============================================
// const upload = multer({
//   dest: 'uploads/',
//   limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Invalid file type. Only audio files are allowed.'));
//     }
//   }
// });

// // ============================================
// // MIDDLEWARE
// // ============================================
// app.use(express.json());
// app.use(cookieParser());
// app.use(cors({
//   origin: "http://localhost:5173",
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   credentials: true
// }));

// // ============================================
// // MONGODB CONNECTION
// // ============================================
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => console.log('✅ MongoDB connected successfully'))
//   .catch(err => console.error('❌ MongoDB connection error:', err));

// // ============================================
// // MONGOOSE SCHEMAS & MODELS
// // ============================================

// // User Schema
// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true
//   },
//   password: {
//     type: String,
//     required: true,
//     minlength: 6
//   }
// }, {
//   timestamps: true
// });

// const client = mongoose.model('client', userSchema);

// // Note Schema
// const noteSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'client',
//     required: true
//   },
//   title: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   content: {
//     type: String,
//     required: true
//   },
//   category: {
//     type: String,
//     trim: true,
//     default: ''
//   },
//   tags: [{
//     type: String,
//     trim: true
//   }],
//   pinned: {
//     type: Boolean,
//     default: false
//   }
// }, {
//   timestamps: true
// });

// // Index for search functionality
// noteSchema.index({ title: 'text', content: 'text', tags: 'text' });

// const Note = mongoose.model('Note', noteSchema);

// // ============================================
// // AUTHENTICATION MIDDLEWARE
// // ============================================
// const auth = async (req, res, next) => {
//   try {
//     const token = req.cookies.token;

//     if (!token) {
//       return res.status(401).json({ message: 'Authentication required' });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
//     req.userId = decoded.userId;
//     next();
//   } catch (error) {
//     return res.status(401).json({ message: 'Invalid or expired token' });
//   }
// };

// // ============================================
// // OPENAI WHISPER TRANSCRIPTION
// // ============================================
// async function transcribeAudio(filePath) {
//   try {
//     // Check if file exists
//     if (!fs.existsSync(filePath)) {
//       throw new Error('Audio file not found');
//     }

//     // Check file size
//     const stats = fs.statSync(filePath);
//     console.log(`Processing audio file: ${filePath}, Size: ${stats.size} bytes`);

//     const formData = new FormData();
//     formData.append('file', fs.createReadStream(filePath), {
//       filename: 'audio.webm',
//       contentType: 'audio/webm'
//     });
//     formData.append('model', 'whisper-1');

//     console.log('Sending request to OpenAI Whisper API...');

//     const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//         ...formData.getHeaders()
//       },
//       body: formData
//     });

//     console.log('OpenAI Response Status:', response.status);

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('OpenAI Error Response:', errorText);
      
//       let errorMessage = 'Transcription failed';
//       try {
//         const errorJson = JSON.parse(errorText);
//         errorMessage = errorJson.error?.message || errorMessage;
//       } catch (e) {
//         errorMessage = errorText || errorMessage;
//       }
      
//       throw new Error(errorMessage);
//     }

//     const data = await response.json();
//     console.log('Transcription successful:', data.text?.substring(0, 50) + '...');
//     return data.text;
//   } catch (error) {
//     console.error('Transcription error details:', error.message);
//     throw error;
//   } finally {
//     // Clean up uploaded file
//     try {
//       if (fs.existsSync(filePath)) {
//         fs.unlinkSync(filePath);
//         console.log('Cleaned up audio file:', filePath);
//       }
//     } catch (err) {
//       console.error('Error deleting file:', err);
//     }
//   }
// }

// // ============================================
// // AUTHENTICATION ROUTES
// // ============================================

// // Register
// app.post('/api/auth/register', async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     // Validation
//     if (!name || !email || !password) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }

//     if (password.length < 6) {
//       return res.status(400).json({ message: 'Password must be at least 6 characters' });
//     }

//     // Email validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({ message: 'Invalid email format' });
//     }

//     // Check if user exists
//     const existingUser = await client.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'Email already registered' });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create user
//     const user = new client({
//       name,
//       email,
//       password: hashedPassword
//     });

//     await user.save();

//     // Create token
//     const token = jwt.sign(
//       { userId: user._id },
//       process.env.JWT_SECRET || 'your-secret-key-change-in-production',
//       { expiresIn: '7d' }
//     );

//     // Set cookie
//     res.cookie('token', token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Registration successful',
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email
//       }
//     });
//   } catch (error) {
//     console.error('Register error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// // Login
// app.post('/api/auth/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Validation
//     if (!email || !password) {
//       return res.status(400).json({ message: 'Email and password are required' });
//     }

//     // Find user
//     const user = await client.findOne({ email });
//     if (!user) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     // Check password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     // Create token
//     const token = jwt.sign(
//       { userId: user._id },
//       process.env.JWT_SECRET || 'your-secret-key-change-in-production',
//       { expiresIn: '7d' }
//     );

//     // Set cookie
//     res.cookie('token', token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
//     });

//     res.json({
//       success: true,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email
//       }
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// // Logout
// app.post('/api/auth/logout', (req, res) => {
//   res.clearCookie('token');
//   res.json({ success: true, message: 'Logged out successfully' });
// });

// // Get current user
// app.get('/api/auth/me', auth, async (req, res) => {
//   try {
//     const user = await client.findById(req.userId).select('-password');
//     res.json({ user });
//   } catch (error) {
//     console.error('Get user error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// // ============================================
// // TRANSCRIPTION ROUTE
// // ============================================
// app.post('/api/transcribe', auth, upload.single('audio'), async (req, res) => {
//   try {
//     console.log('Transcription request received');
    
//     if (!req.file) {
//       console.error('No audio file in request');
//       return res.status(400).json({ message: 'No audio file provided' });
//     }

//     console.log('File received:', {
//       filename: req.file.filename,
//       mimetype: req.file.mimetype,
//       size: req.file.size,
//       path: req.file.path
//     });

//     if (!process.env.OPENAI_API_KEY) {
//       console.error('OPENAI_API_KEY not configured');
//       return res.status(500).json({ message: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file' });
//     }

//     // Check if API key format is correct
//     if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
//       console.error('Invalid OPENAI_API_KEY format');
//       return res.status(500).json({ message: 'Invalid OpenAI API key format. Key should start with "sk-"' });
//     }

//     const transcription = await transcribeAudio(req.file.path);

//     res.json({
//       success: true,
//       transcription
//     });
//   } catch (error) {
//     console.error('Transcription endpoint error:', error);
    
//     // Clean up file if it still exists
//     if (req.file && req.file.path && fs.existsSync(req.file.path)) {
//       try {
//         fs.unlinkSync(req.file.path);
//       } catch (e) {
//         console.error('Error cleaning up file:', e);
//       }
//     }
    
//     res.status(500).json({
//       message: 'Failed to transcribe audio',
//       error: error.message
//     });
//   }
// });

// // ============================================
// // NOTES ROUTES (All require authentication)
// // ============================================

// // Get all notes for logged-in user
// app.get('/api/notes', auth, async (req, res) => {
//   try {
//     const notes = await Note.find({ user: req.userId })
//       .sort({ pinned: -1, createdAt: -1 });
//     res.json(notes);
//   } catch (error) {
//     console.error('Get notes error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// // Get single note
// app.get('/api/notes/:id', auth, async (req, res) => {
//   try {
//     const note = await Note.findOne({
//       _id: req.params.id,
//       user: req.userId
//     });

//     if (!note) {
//       return res.status(404).json({ message: 'Note not found' });
//     }

//     res.json(note);
//   } catch (error) {
//     console.error('Get note error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// // Create note
// app.post('/api/notes', auth, async (req, res) => {
//   try {
//     const { title, content, category, tags, pinned } = req.body;

//     if (!title || !content) {
//       return res.status(400).json({ message: 'Title and content are required' });
//     }

//     const note = new Note({
//       user: req.userId,
//       title,
//       content,
//       category: category || '',
//       tags: tags || [],
//       pinned: pinned || false
//     });

//     await note.save();
//     res.status(201).json(note);
//   } catch (error) {
//     console.error('Create note error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// // Update note
// app.put('/api/notes/:id', auth, async (req, res) => {
//   try {
//     const { title, content, category, tags, pinned } = req.body;

//     const note = await Note.findOne({
//       _id: req.params.id,
//       user: req.userId
//     });

//     if (!note) {
//       return res.status(404).json({ message: 'Note not found' });
//     }

//     // Update fields
//     if (title !== undefined) note.title = title;
//     if (content !== undefined) note.content = content;
//     if (category !== undefined) note.category = category;
//     if (tags !== undefined) note.tags = tags;
//     if (pinned !== undefined) note.pinned = pinned;

//     await note.save();
//     res.json(note);
//   } catch (error) {
//     console.error('Update note error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// // Delete note
// app.delete('/api/notes/:id', auth, async (req, res) => {
//   try {
//     const note = await Note.findOneAndDelete({
//       _id: req.params.id,
//       user: req.userId
//     });

//     if (!note) {
//       return res.status(404).json({ message: 'Note not found' });
//     }

//     res.json({ success: true, message: 'Note deleted successfully' });
//   } catch (error) {
//     console.error('Delete note error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// // Search notes
// app.get('/api/notes/search/:query', auth, async (req, res) => {
//   try {
//     const notes = await Note.find({
//       user: req.userId,
//       $text: { $search: req.params.query }
//     }).sort({ pinned: -1, createdAt: -1 });

//     res.json(notes);
//   } catch (error) {
//     console.error('Search notes error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// // ============================================
// // ERROR HANDLING MIDDLEWARE
// // ============================================
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({
//     message: 'Something went wrong!',
//     error: process.env.NODE_ENV === 'development' ? err.message : undefined
//   });
// });

// // ============================================
// // START SERVER
// // ============================================
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
//   console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
// });



// ============================================
// COMPLETE BACKEND - SINGLE FILE
// Voice Notes App with JWT Authentication + Groq Whisper
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();


// MULTER CONFIGURATION

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});


// MIDDLEWARE

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// ============================================
// MONGODB CONNECTION
// ============================================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));


// MONGOOSE SCHEMAS & MODELS


// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  }
}, {
  timestamps: true
});

const client = mongoose.model('client', userSchema);

// Note Schema
const noteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'client',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    trim: true,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  pinned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for search functionality
noteSchema.index({ title: 'text', content: 'text', tags: 'text' });

const Note = mongoose.model('Note', noteSchema);


// AUTHENTICATION MIDDLEWARE

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};


// GROQ WHISPER TRANSCRIPTION

async function transcribeAudio(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('Audio file not found');
    }

    const stats = fs.statSync(filePath);
    console.log(`Processing audio file: ${filePath}, Size: ${stats.size} bytes`);

    const formData = new FormData();
formData.append("file", fs.createReadStream(filePath), {
  filename: "audio.webm",     
  contentType: "audio/webm"   
});
formData.append("model", "whisper-large-v3-turbo");
formData.append("response_format", "json");


    console.log("Sending request to Groq Whisper API...");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MY_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    console.log("Groq Response Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq Error Response:", errorText);

      let errorMessage = "Transcription failed";
      try {
        const j = JSON.parse(errorText);
        errorMessage = j.error?.message || errorMessage;
      } catch (_) {
        errorMessage = errorText;
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log("Transcription successful:", result.text);

    return result.text;

  } catch (error) {
    console.error("Transcription error details:", error.message);
    throw error;

  } finally {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("Cleaned up audio file:", filePath);
      }
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  }
}



// AUTHENTICATION ROUTES


// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if user exists
    const existingUser = await client.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new client({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
     sameSite: "none",
  secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await client.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "none",
  secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get current user
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await client.findById(req.userId).select('-password');
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// TRANSCRIPTION ROUTE

app.post('/api/transcribe', auth, upload.single('audio'), async (req, res) => {
  try {
    console.log('Transcription request received');
    
    if (!req.file) {
      console.error('No audio file in request');
      return res.status(400).json({ message: 'No audio file provided' });
    }

    console.log('File received:', {
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    if (!process.env.MY_KEY) {
      console.error('MY_KEY not configured');
      return res.status(500).json({ message: 'Groq API key not configured. Please add MY_KEY to your .env file' });
    }

    // Check if API key format is correct (Groq keys start with gsk_)
    if (!process.env.MY_KEY.startsWith('gsk_')) {
      console.error('Invalid MY_KEY format');
      return res.status(500).json({ message: 'Invalid Groq API key format. Key should start with "gsk_"' });
    }

    const transcription = await transcribeAudio(req.file.path);

    res.json({
      success: true,
      transcription
    });
  } catch (error) {
    console.error('Transcription endpoint error:', error);
    
    // Clean up file if it still exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Error cleaning up file:', e);
      }
    }
    
    res.status(500).json({
      message: 'Failed to transcribe audio',
      error: error.message
    });
  }
});


// NOTES ROUTES (All require authentication)

// Get all notes for logged-in user
app.get('/api/notes', auth, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.userId })
      .sort({ pinned: -1, createdAt: -1 });
    res.json(notes);
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single note
app.get('/api/notes/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create note
app.post('/api/notes', auth, async (req, res) => {
  try {
    const { title, content, category, tags, pinned } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const note = new Note({
      user: req.userId,
      title,
      content,
      category: category || '',
      tags: tags || [],
      pinned: pinned || false
    });

    await note.save();
    res.status(201).json(note);
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update note
app.put('/api/notes/:id', auth, async (req, res) => {
  try {
    const { title, content, category, tags, pinned } = req.body;

    const note = await Note.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Update fields
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (category !== undefined) note.category = category;
    if (tags !== undefined) note.tags = tags;
    if (pinned !== undefined) note.pinned = pinned;

    await note.save();
    res.json(note);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete note
app.delete('/api/notes/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search notes
app.get('/api/notes/search/:query', auth, async (req, res) => {
  try {
    const notes = await Note.find({
      user: req.userId,
      $text: { $search: req.params.query }
    }).sort({ pinned: -1, createdAt: -1 });

    res.json(notes);
  } catch (error) {
    console.error('Search notes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});