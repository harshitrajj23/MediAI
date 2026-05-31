import os
import requests
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")

# Whisper Large v3 model on Hugging Face
WHISPER_MODEL = "openai/whisper-large-v3"

def transcribe_audio_whisper(audio_bytes):
    """
    Transcribes uploaded audio files (webm/wav) using Whisper Large v3 on HF Inference API.
    """
    if not audio_bytes:
        return {"error": "No audio data received"}
        
    if HF_API_TOKEN:
        api_url = f"https://router.huggingface.co/hf-inference/models/{WHISPER_MODEL}"
        headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
        try:
            res = requests.post(api_url, headers=headers, data=audio_bytes, timeout=10)
            if res.status_code == 200:
                result = res.json()
                text = result.get("text", "")
                if text:
                    return {"text": text, "method": "Whisper Large v3 API"}
        except Exception as e:
            print(f"Whisper transcript API failed: {e}")
            
    # Return error so the API triggers 400 Bad Request and launches the frontend Speech dictate modal
    return {
        "error": "Whisper Inference Endpoint Offline. Launching Speech dictate console..."
    }

