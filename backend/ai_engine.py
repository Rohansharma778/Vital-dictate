import torch
from faster_whisper import WhisperModel
import ollama

print("Loading AI Models into memory...")
vad_model, utils = torch.hub.load(repo_or_dir='snakers4/silero-vad', model='silero_vad', force_reload=False)

asr_model = WhisperModel("small.en", device="cpu", compute_type="int8")

def generate_medical_summary(transcript: str) -> str:
    prompt = f"""
    You are a clinical data extractor. Analyze the following patient transcript and extract the specific details into a strict JSON format. 
    DO NOT include any markdown formatting, do not use ```json, and do not write any text outside of the JSON object.

    Return a JSON object with exactly these keys:
    {{
      "patientName": "Extract name if mentioned, otherwise 'Not provided'",
      "patientAge": "Extract age if mentioned, otherwise 'Not provided'",
      "patientGender": "Extract gender if mentioned, otherwise 'Not provided'",
      "clinicalSummary": "Write a short, professional medical summary based strictly on the transcript",
      "chiefComplaints": "Extract the main problem",
      "symptoms": "Extract specific symptoms",
      "clinicalImpression": "Brief clinical assessment",
      "medications": "Extract medication history",
      "examinationsAndTests": "Extract if mentioned, else 'None'",
      "allergies": "Extract if mentioned, else 'None'",
      "pastMedicalHistory": "Extract if mentioned, else 'None'",
      "historyAndFollowUp": "Extract if mentioned, else 'None'"
    }}
    
    Transcript: {transcript}
    """
    response = ollama.chat(model='llama3.2:1b', messages=[{'role': 'user', 'content': prompt}])
    return response['message']['content']