# Vital-dictate

# AI Medical Scribe

A full-stack web application that captures real-time medical dictation and generates structured clinical summaries using local AI models. 

## Features
* **Live Dictation:** Streams microphone audio to the backend via WebSockets.
* **Noise Filtering:** Uses Silero VAD to detect speech and drop background noise.
* **Local Transcription:** Powered by Faster-Whisper for low-latency, private speech-to-text.
* **Clinical Summarization:** Extracts structured medical records (Patient Details, Symptoms, Medications, etc.) as JSON using Ollama.
* **Session Management:** Saves offline dictation sessions directly to the browser's local storage.

## Tech Stack
* **Frontend:** React, Vite, Tailwind CSS, Lucide Icons
* **Backend:** FastAPI, WebSockets, PyTorch
* **AI Models:** Faster-Whisper, Silero VAD, Ollama (Llama 3.2:1b)

## Prerequisites
* Node.js and npm
* Python 3.10+
* [Ollama](https://ollama.com/download) installed and running locally. You must pull the model before running the app:
  `ollama pull llama3.2:1b`

## Setup Instructions

**1. Start the Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
