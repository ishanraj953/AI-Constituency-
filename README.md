
# AI Constituency – Intelligent Grievance Management System

## 📌 Overview

AI Constituency is an AI-powered grievance management platform designed to help citizens submit and track public complaints efficiently.

The system allows citizens to submit complaints through **text or voice**, provide their **location, address, and pincode**, and automatically processes the complaint using AI.

The backend categorizes complaints, determines their urgency and priority, detects similar complaints, and stores the information in MongoDB.

The system also provides an **Analytics Dashboard** to help administrators understand complaint trends, priority levels, categories, and location-based issues.

---

## 🎯 Problem Statement

Traditional grievance systems often involve:

- Manual complaint registration
- Difficulty in identifying duplicate complaints
- Lack of automatic complaint prioritization
- Limited location-based analysis
- Difficulty handling voice-based complaints
- Delayed identification of critical public issues

Citizens may also have difficulty describing their complaints in a structured format.

AI Constituency addresses these problems by combining **AI, voice processing, location intelligence, and analytics** into a single platform.

---

## 💡 Proposed Solution

The platform provides an intelligent complaint submission system where citizens can:

1. Submit a complaint using text.
2. Submit a complaint using voice.
3. Provide their location manually.
4. Use live location to automatically detect their current address.
5. Enter a pincode to retrieve location information.
6. Submit the complaint to the AI processing pipeline.

The AI system then:

1. Processes the complaint.
2. Identifies the complaint category.
3. Determines urgency.
4. Detects similar complaints.
5. Calculates a priority score.
6. Assigns a priority level.
7. Stores the complaint in MongoDB.

---

# ✨ Features

## 👤 Citizen Complaint Submission

Citizens can submit grievances through:

### 📝 Text Complaint

Users can enter their complaint directly through a text field.

Example:

> Road in Ward 5 is badly damaged and needs immediate repair.

### 🎙️ Voice Complaint

Users can record their complaint using the voice input interface.

The recorded audio is sent to the backend, converted into text using speech-to-text processing, and then passed through the AI complaint-processing pipeline.

---

## 📍 Location Intelligence

The complaint form supports location-based information.

### Manual Location

Users can enter their:

- Ward
- Constituency
- City
- State
- Other location information

### 📍 Live Location

Users can select **Use Current Location**.

The browser obtains the user's GPS coordinates and the application uses reverse geocoding to obtain a readable address.

### 📮 Pincode

Users can enter a 6-digit Indian pincode.

The system retrieves location information associated with the pincode and automatically fills the location field.

---

# 🤖 AI Complaint Processing

Every submitted complaint goes through an AI processing pipeline.

text
Citizen Complaint
       ↓
Complaint Processing
       ↓
Category Detection
       ↓
Urgency Detection
       ↓
Similarity Detection
       ↓
Priority Calculation
       ↓
MongoDB Storage

SYSTEM ARCHITECTURE:
                    ┌──────────────────────┐
                    │       Citizen        │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │    React Frontend    │
                    │                      │
                    │ Text / Voice Input   │
                    │ Location / Pincode   │
                    └──────────┬───────────┘
                               │
                         HTTP Requests
                               │
                    ┌──────────▼───────────┐
                    │     FastAPI Backend  │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌────────────┐   ┌────────────┐   ┌────────────┐
       │ Complaint  │   │ Similarity │   │  Priority  │
       │ Processor  │   │   Engine   │   │   Engine   │
       └────────────┘   └────────────┘   └────────────┘
              │                │                │
              └────────────────┼────────────────┘
                               │
                      ┌────────▼────────┐
                      │     MongoDB     │
                      └────────┬────────┘
                               │
                      ┌────────▼────────┐
                      │    Analytics    │
                      │    Dashboard    │
                      └─────────────────┘
## 📁 Project Structure
AI-Hackethon/
│
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ActivitySummaryCard.jsx
│   │   ├── ComplaintCard.jsx
│   │   ├── ComplaintForm.jsx
│   │   ├── Navbar.jsx
│   │   ├── ResultCard.jsx
│   │   ├── StatisticsCards.jsx
│   │   └── VoiceRecorder.jsx
│   │
│   ├── pages/               # Main application pages
│   │   ├── Home.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ComplaintManagement.jsx
│   │   └── Analytics.jsx
│   │
│   ├── services/            # API and service logic
│   │   ├── api.js
│   │   ├── analyticsApi.js
│   │   └── SpeechService.js
│   │
│   ├── App.jsx              # Main React component
│   ├── main.jsx             # React entry point
│   └── index.css             # Global styles
│
├── server/
│   └── index.js             # Backend server
│
├── backend/
│   ├── database/            # Database related files
│   └── speech/              # Speech processing
│
├── ai/                      # AI/ML related functionality
│
├── public/                  # Static assets
│
├── .gitignore
├── package.json
├── package-lock.json
└── README.md

