import pyaudio
import numpy as np
import torch
from faster_whisper import WhisperModel
import ollama
import sys
import re

print("Loading VAD model...")
vad_model, utils = torch.hub.load(repo_or_dir='snakers4/silero-vad', model='silero_vad', force_reload=False)

print("Loading ASR (Whisper) model...")
asr_model = WhisperModel("small.en", device="cpu", compute_type="int8")

FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK = 512

audio = pyaudio.PyAudio()
stream = audio.open(format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=CHUNK,input_device_index=2)

full_transcript = []
audio_buffer = []
silence_frames = 0
SILENCE_THRESHOLD = 30 # Number of silent chunks before processing speech

print("\n--- Pipeline Ready ---")
print("Speak into your microphone. Say 'Thank you' to end the session and generate the summary.\n")

try:
    while True:
        data = stream.read(CHUNK, exception_on_overflow=False)
        audio_chunk = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0 
        
        # 1. Check for complete silence (Microphone blocked or muted)
        if np.max(np.abs(audio_chunk)) == 0.0:
            print("[Warning: Microphone is sending complete silence. Check Windows Privacy settings]", end="\r", flush=True)
            continue

        tensor_chunk = torch.from_numpy(audio_chunk)
        speech_prob = vad_model(tensor_chunk, RATE).item()
        
        if speech_prob > 0.5:
            # Speech detected
            audio_buffer.append(audio_chunk)
            silence_frames = 0
            print("[Status: Listening...]             ", end="\r", flush=True)
            
        elif len(audio_buffer) > 0:
            # Silence detected after speech
            silence_frames += 1
            audio_buffer.append(audio_chunk) 
            
            if silence_frames > SILENCE_THRESHOLD:
                print("[Status: Transcribing...]          ", end="\r", flush=True)
                
                audio_data = np.concatenate(audio_buffer)
                segments, info = asr_model.transcribe(audio_data, beam_size=5)
                
                text = "".join([segment.text for segment in segments]).strip()
                
                if text:
                    # Print the spoken words to PowerShell immediately
                    print(f"\nUser: {text}")
                    full_transcript.append(text)
                    
                    # Clean punctuation to check for the stop phrase reliably
                    clean_text = re.sub(r'[^\w\s]', '', text.lower())
                    
                    # 2. Stop listening if "thank you" is detected
                    if "thank you" in clean_text:
                        print("\nStop command 'Thank you' detected. Ending session...")
                        break 
                
                # Reset buffer for the next sentence
                audio_buffer = []
                silence_frames = 0
        else:
            print("[Status: Waiting for speech...]    ", end="\r", flush=True)

except KeyboardInterrupt:
    print("\n\nSession ended manually.")

# ==========================================
# LLM SUMMARIZATION
# ==========================================
stream.stop_stream()
stream.close()
audio.terminate()

final_text = " ".join(full_transcript)

if not final_text.strip():
    print("\nNo speech detected. Ensure your microphone is not muted and accessible to PowerShell.")
else:
    print("\n--- Generating Medical Summary (Llama 3.2:1b) ---")
    prompt = f"""
    You are a clinical data extractor. Analyze the following patient transcript and extract the specific details. 

    Format your response exactly like this:

    **Patient Details**
    - Name: [Extract name if mentioned, otherwise write 'Not provided']
    - Age: [Extract age if mentioned, otherwise write 'Not provided']
    - Chief Complaint: [Extract the main problem or symptoms]

    **Clinical Profile**
    - History of Present Illness: [Extract if mentioned, else 'Not provided']
    - Past Medical History: [Extract if mentioned, else 'Not provided']
    - Medication History: [Extract if mentioned, else 'Not provided']
    - Assessment: [Brief clinical assessment based on the transcript]

    **Clinical Summary**
    [Write a short, professional medical summary based strictly on the extracted information above.]
    
    Transcript: {final_text}
    """
    
    response = ollama.chat(model='llama3.2:1b', messages=[{'role': 'user', 'content': prompt}])
    print("\n" + response['message']['content'])