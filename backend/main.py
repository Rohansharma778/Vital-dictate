import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from ai_engine import vad_model, asr_model, generate_medical_summary


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/transcribe")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    audio_buffer = []
    silence_frames = 0
    SILENCE_THRESHOLD = 15

    try:
        while True:
            data = await websocket.receive_bytes()
            audio_chunk = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0 
            # print("Received chunk")
            # print(f"Backend Audio Max: {np.max(np.abs(audio_chunk)):.4f}")
            tensor_chunk = torch.from_numpy(audio_chunk)
            speech_prob = vad_model(tensor_chunk, 16000).item()

            # print(f"VAD Confidence: {speech_prob}")    
            
            if speech_prob > 0.5:
                audio_buffer.append(audio_chunk)
                silence_frames = 0
            elif len(audio_buffer) > 0:
                silence_frames += 1
                audio_buffer.append(audio_chunk)


                if silence_frames > SILENCE_THRESHOLD:
                    audio_data = np.concatenate(audio_buffer)
                    segments, _ = asr_model.transcribe(audio_data, beam_size=5)
                    text = "".join([segment.text for segment in segments]).strip()
                    
                    if text:
                        await websocket.send_json({"text": text})
                    
                    audio_buffer = []
                    silence_frames = 0

    except WebSocketDisconnect:
        print("Frontend disconnected.")

class TranscriptRequest(BaseModel):
    transcript: str

@app.post("/api/summarize")
async def summarize_transcript(request: TranscriptRequest):
    # Call the clean function from ai_engine
    summary = generate_medical_summary(request.transcript)
    return {"summary": summary}