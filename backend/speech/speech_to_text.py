import os
from groq import Groq

def transcribe_audio(audio_file_path: str) -> str:
    """
    Transcribes the audio file at the given path using Groq's Whisper API.

    Args:
        audio_file_path (str): Absolute or relative path to the audio file.

    Returns:
        str: The transcribed text.
    """
    if not os.path.exists(audio_file_path):
        raise FileNotFoundError(f"Audio file does not exist: {audio_file_path}")

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not configured. Cannot perform cloud transcription.")

    client = Groq(api_key=api_key)
    print(f"[Speech-to-Text] Transcribing audio file using Groq Whisper API: {audio_file_path}")
    
    with open(audio_file_path, "rb") as file:
        transcription = client.audio.transcriptions.create(
            file=(os.path.basename(audio_file_path), file.read()),
            model="whisper-large-v3",
            response_format="json"
        )
    
    text = transcription.text.strip()
    print(f"[Speech-to-Text] Transcription result: '{text}'")
    return text
