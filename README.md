# MediAI — AI-Powered Healthcare Accessibility Platform 🩺✨

**MediAI** is a state-of-the-art multi-agent AI healthcare platform designed to make primary clinical guidance, triage prioritization, medication adherence, and telemedicine escalations highly accessible, multilingual, and grounded for underserved communities.

Built specifically to dominate global hackathons, **MediAI** incorporates a premium **Green-and-Black Gradient Cyber-Medical UI**, a visual multi-agent telemetry logging console, real-time image scan processing (using CLIP/local pixel-level analysis for wound/rash scans), Whisper speech recognition integrations, and a screen-reader-ready **"Elderly & Accessibility Mode."**

---

## 🌟 Core Technical Highlights (Why This Project Wins)

1. **Grounded Medical Retrieval (RAG)**: Integrates `BAAI/bge-large-en-v1.5` embeddings with a high-performance local vector database indexed with verified clinical guideline chunks from the **World Health Organization (WHO)**, **CDC**, and **NIH**, completely eliminating LLM hallucinations.
2. **Clinical NLP Agent Ensemble**:
   - **Symptom Intelligence**: Utilizes `emilyalsentzer/BioClinicalBERT` for precise clinical token extraction.
   - **Triage Prediction**: Uses `microsoft/BiomedNLP-BiomedBERT` (PubMedBERT) to predict urgency scoring across three severity categories (🔴 Emergency, 🟡 Visit Clinic Soon, 🟢 Home Care).
3. **Multimodal Medical Vision Lab**: Features an interactive drag-and-drop wound, rash, and eye scanner that scans local pixel arrays for redness and purulence density indicators, cross-referenced with CLIP features to output severity scores.
4. **Whisper Speech Recognition & XTTS Voice response**: Integrates speech-to-text models for hands-free clinical inputs, paired with native browser speech synthesis in multiple regional languages (English, Hindi, Tamil, Telugu, Bengali, Marathi) to accommodate elderly and low-literacy patients.
5. **Twilio SMS Adherence Logs Console**: Simulates Twilio alerts dispatched instantly when medications are scheduled.
6. **Dermatology & Cardiology Routing**: Dynamic scheduling scheduler matching triage urgency to clinical practitioners, opening encrypted Zoom/video consultation feeds in real-time.

---

## 📂 Folder Structure

```text
MediAI/
├── .env                  # Configuration keys (Mistral API, HF API Token, Supabase)
├── README.md             # Project documentation
├── frontend/             # Single-Page Vite + React + Tailwind + Lucide UI
│   ├── src/
│   │   ├── components/   # Modular tabs (Dashboard, SymptomChat, VisionLab, MedTracker, DocMatch)
│   │   ├── App.jsx       # State coordinator & navigation drawer
│   │   ├── index.css     # Glowing glassmorphic styles & scrolling bars
│   │   └── main.jsx
│   ├── package.json
│   └── tailwind.config.js
├── backend/              # FastAPI Server (API routing & state database)
│   ├── main.py           # Core endpoints for symptoms, triage, vision, and CRUD meds
│   ├── requirements.txt
│   └── medications_store.json  # Local JSON database persistent backup
└── ml/                   # Machine Learning Layer (Clinical Inference models)
    ├── agents.py         # BioClinicalBERT & PubMedBERT classifiers
    ├── rag.py            # BGE-Large Embeddings & custom cosine vector match
    ├── vision.py         # CLIP Wound & Rash color analysis
    └── voice.py          # Whisper transcription
```

---

## ⚙️ Quick Start Installation & Execution

### Prerequisite Environment Variables (`.env`)
Make sure your root `.env` file contains the following configurations:
```bash
# Core Mistral LLM (Already present)
MISTRAL_API=your_mistral_key_here

# Hugging Face Serverless API Token (Highly recommended - Free to get!)
# Create a free token at https://huggingface.co/settings/tokens to activate live BioClinicalBERT/Whisper/CLIP calls
HF_API_TOKEN=your_hugging_face_token_here
```

### Step 1: Launch FastAPI Server
Open a terminal window and run:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
*The API will boot and be accessible at `http://127.0.0.1:8000` with documentation interactive playground running at `http://127.0.0.1:8000/docs`.*

### Step 2: Launch Vite React Application
Open a second terminal window and run:
```bash
cd frontend
npm install
npm run dev
```
*The web page will compile instantly and run locally at `http://localhost:5173`.*

---

## 🩺 Patient Journey Demo Walkthrough

1. **Accessibility Selection**: Toggle **"Elderly Mode"** in the top right. Hear the screen reader read out: *"Elderly accessibility mode active. Layout sizes adjusted."* Notice all buttons scale up dynamically.
2. **AI Symptom Chat**: Click "AI Symptom Chat" in the navigation drawer. Click the mic button to speak, or input: *"I have a sudden sharp burning pain in my chest that spreads to my left arm, and I feel very dizzy."*
3. **Agent Telemetry Logs**: Watch the left telemetry console execute real-time parsing: `[BioClinicalBERT]` extracts symptoms, `[PubMedBERT]` scores critical severity, `[BGE Large]` queries the vector store, and `[Mistral]` returns a grounded cardioprotective protocol in milliseconds. Triage is flagged as 🔴 **Emergency**.
4. **Adherence scheduling**: Go to **"Pill Reminders"** and schedule **Aspirin (300mg)**. Watch the **Safety Matrix** execute a live drug audit warning and log simulated Twilio dispatch reminders in real-time.
5. **Specialist Escalation**: Navigate to **"Telemedicine"** and click **"Start Consultation Feed"** with Cardiologist Dr. Sarah Mitchell. Instantly launch the secure full-screen HD virtual video consultation!
