# 🩺 MediAI — Next-Generation Healthcare Accessibility Platform

<div align="center">
  <p><strong>An advanced, multi-agent AI telemedicine and triaging platform designed for global accessibility, precise clinical guidance, and emergency response.</strong></p>
</div>

---

## 🌟 Overview

**MediAI** bridges the gap in primary healthcare access by providing a highly robust, multilingual, and AI-driven platform. It empowers underserved communities with clinical guidance, triage prioritization, medication adherence tracking, and seamless telemedicine escalations. 

Built with scalability and cross-platform readiness in mind (Web, iOS, and Android via Capacitor), MediAI integrates state-of-the-art NLP, multimodal vision, real-time geolocation routing, and secure instant messaging alerts to deliver a complete patient journey from symptom to specialist.

---

## 🚀 Core Features & Technical Innovations

### 1. 🧠 Multi-Agent Clinical NLP & Triage
- **Grounded Medical Retrieval (RAG)**: Integrates `BAAI/bge-large-en-v1.5` embeddings with a local vector database indexed with clinical guidelines from the **WHO, CDC, and NIH** to eliminate LLM hallucinations.
- **Symptom Intelligence**: Utilizes `emilyalsentzer/BioClinicalBERT` for precise clinical token extraction.
- **Triage Severity Prediction**: Employs `microsoft/BiomedNLP-BiomedBERT` to predict urgency scoring (🔴 Emergency, 🟡 Visit Clinic Soon, 🟢 Home Care).

### 2. 🚑 Emergency SOS & Location-Based Dispatch
- **Intelligent Hospital Routing**: Integrates the **Geoapify API** to locate the nearest hospitals within a dynamic radius and calculate accurate ETA based on patient coordinates.
- **Real-Time Telegram Alerts**: Features automated secure Telegram dispatcher alerts for instant emergency notifications and medication reminders.
- **Deterministic Doctor Matching**: Dynamically routes patients to realistically matched practitioners based on clinical severity and geolocation.

### 3. 👁️ Multimodal Medical Vision Lab
- **Dermatological & Wound Scanning**: Interactive drag-and-drop vision scanner for wounds and rashes. Uses pixel-level arrays and CLIP features to analyze redness/purulence density and output severity scores.

### 4. 🌍 Accessibility & Multilingual Support
- **Elderly & Accessibility Mode**: A screen-reader-ready interface with dynamic layout scaling.
- **Multilingual Query & Voice Integration**: Supports inputs in multiple regional languages (English, Hindi, Tamil, Telugu, Bengali, Marathi). Integrates Whisper speech recognition and native browser speech synthesis for hands-free and low-literacy usage.

### 5. 📱 Cross-Platform Ready (Capacitor)
- Native mobile deployment support via **Capacitor**, enabling seamless builds for iOS and Android platforms from a single web codebase.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Lucide Icons, Capacitor (Mobile)
- **Backend**: Python, FastAPI, Uvicorn
- **AI/ML Layer**: Hugging Face Serverless Inference, Mistral LLM, CLIP, Whisper, BioClinicalBERT
- **Integrations**: Geoapify (Location & Mapping), Telegram Bot API (Alerts & Dispatch)

---

## 📂 Repository Structure

```text
MediAI/
├── .env                  # Configuration keys (Mistral API, HF API Token, Telegram)
├── README.md             # Project documentation
├── frontend/             # Single-Page Vite + React Application
│   ├── src/
│   │   ├── components/   # Modular UI components (Dashboard, SymptomChat, VisionLab)
│   │   ├── App.jsx       # State coordinator & routing
│   │   └── index.css     # Premium glassmorphic styling system
│   ├── capacitor.config.ts # Mobile app build configuration
│   └── package.json
├── backend/              # FastAPI Server
│   ├── main.py           # Core endpoints (symptoms, triage, vision, CRUD meds, SOS)
│   ├── requirements.txt
│   └── medications_store.json # Local JSON database for persistent records
└── ml/                   # Machine Learning Layer (Clinical Inference)
    ├── agents.py         # BioClinicalBERT & PubMedBERT classifiers
    ├── rag.py            # BGE-Large Embeddings & custom cosine vector match
    ├── vision.py         # CLIP Wound & Rash color analysis
    └── voice.py          # Whisper transcription
```

---

## ⚙️ Quick Start & Installation

### 1. Environment Configuration (`.env`)
Create a `.env` file in the root directory and add the following keys:
```bash
# LLM Provider
MISTRAL_API=your_mistral_key_here

# Hugging Face Serverless API Token (Required for BioClinicalBERT/Whisper/CLIP calls)
HF_API_TOKEN=your_hugging_face_token_here

# Telegram Bot Alerts (Optional - for medication reminders and SOS dispatch)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# Geoapify (Location Routing)
GEOAPIFY_API_KEY=your_geoapify_key_here
```

### 2. Launch FastAPI Backend
Open a terminal window and run:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
*The API runs at `http://127.0.0.1:8000`. Interactive documentation is available at `/docs`.*

### 3. Launch Vite React Frontend
Open a second terminal window and run:
```bash
cd frontend
npm install
npm run dev
```
*The application runs locally at `http://localhost:5173`.*

---

## 🩺 Patient Journey Demonstration

1. **Accessibility Selection**: Toggle **"Elderly Mode"** to scale up UI elements and activate auditory screen-reader guidance.
2. **AI Symptom Chat**: Use voice input to describe symptoms in native languages. Watch the telemetry console parse data through `[BioClinicalBERT]` for tokens and `[PubMedBERT]` for urgency scoring.
3. **Medication Management**: Schedule prescriptions and receive real-time adherence alerts via the Telegram Bot API.
4. **Emergency Escalation (SOS)**: Trigger an SOS to calculate the nearest medical facility via **Geoapify** and dispatch a real-time notification block with patient coordinates to the Telegram emergency channel.
5. **Telemedicine Consultations**: Connect directly to specialized practitioners via secure consultation feeds based on triage routing.

---

<div align="center">
  <p><i>Empowering global healthcare through autonomous clinical intelligence.</i></p>
</div>
