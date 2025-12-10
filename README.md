##**Live Link** : https://voice-to-text-notesapp-front.onrender.com 

##**Voice Notes App** – Full-Stack MERN + Groq Whisper Transcription

A modern full-stack voice-powered notes application built with  ##**Node.js, Express, MongoDB, React, JWT Authentication, Multer, and Groq Whisper API transcription.**
Users can create, edit, search, pin, categorize, and transcribe voice notes in real-time.

📌 ##**Features**

Authentication

User Registration & Login (JWT + http-only cookies)

Protected routes

Auto-login session persistence

Notes System

Create, Read, Update, Delete (CRUD)

Pin notes

Category filtering

Tag support

Full text search (MongoDB text indexing)

Voice Transcription

Record audio in the browser

Upload to backend using Multer

Transcribe using Groq Whisper-Large-v3-Turbo

Auto-insert transcription into note editor

##**UI/UX**

React + Tailwind CSS + Lucide Icons

Light animations

Editable modal note editor

Fully responsive

🧱 ##**Tech Stack**

##**Backend**

Node.js + Express

MongoDB + Mongoose

JWT Authentication

Multer (file uploads)

Groq Whisper API (speech-to-text)

cookie-parser

dotenv

CORS

##**Frontend**

React.js

Tailwind CSS

Lucide Icons

MediaRecorder API (browser)

Fetch API

📂 ##**Project Structure**

/backend

 ├── server.js
 
 ├── .env
 
 ├── package.json
 
 └── uploads/ (auto-created)

 /frontend
 
 ├── src/
 
 │    ├── App.jsx
 
 │    ├── components/
 
 │    │      └── NoteEditor.jsx (inside App code)
 
 │    └── assets/
 
 └── package.json

 ⚙️ ##**Backend Setup**
 
 ##**Install dependencies**

      cd backend

      npm install

 ##**Create .env**

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

MY_KEY=your_groq_api_key   # must start with gsk_

NODE_ENV=development

⚙️ ##**Frontend Setup**

 ##**Install dependencies**

 cd frontend
 
 npm install

🛡️ ##**Security Highlights**

Password hashing with bcrypt

JWT stored in HttpOnly, Secure cookies

Protected routes middleware

Input validation

File type filtering for audio uploads

Auto deletion of uploaded audio files

📖 ##**How Everything Works Together**

##**Backend Responsibilities**

Authenticate users

Store notes

Process audio → transcribe text

Serve secured endpoints

##**Frontend Responsibilities**

Provide UI

Record audio

Upload audio for transcription

Manage notes

Display transcription results

Together, they form a complete AI-powered notes system.

📦 ##**Requirements**

Node 18+

MongoDB Atlas or local MongoDB

Groq API key (starts with gsk_)

Browser that supports MediaRecorder (Chrome recommended)
