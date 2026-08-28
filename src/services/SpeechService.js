import { api } from './api';


/**
 * Submit a voice complaint to the backend
 * POST /speech-complaint
 * Multipart form data:
 * - audio: Blob (WebM or WAV)
 * - location: String
 */
export const submitSpeechComplaint = async (
  audioBlob,
  location,
  pincode,
  wardNo,
  image,
  latitude,
  longitude
) => {
  try {
    const formData = new FormData();
    // Identify recorded MIME type and append file extension
    const mimeType = audioBlob?.type || 'audio/webm';
    const isWav = mimeType.includes('wav');
    const filename = isWav ? 'recording.wav' : 'recording.webm';

    if (audioBlob) {
      formData.append('audio', audioBlob, filename);
    }
    formData.append('location', location);
    formData.append('pincode', pincode || '');
    formData.append('ward_no', wardNo || '');

    if (latitude !== undefined && latitude !== null && !isNaN(Number(latitude)) && isFinite(Number(latitude))) {
      formData.append('latitude', String(Number(latitude)));
    }
    if (longitude !== undefined && longitude !== null && !isNaN(Number(longitude)) && isFinite(Number(longitude))) {
      formData.append('longitude', String(Number(longitude)));
    }

    if (image) {
      formData.append('image', image);
    }

    const response = await api.post('/speech-complaint', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;

  } catch (error) {
    console.error('Error in speech submission service:', error);
    throw error;
  }
};

export default {
  submitSpeechComplaint,
};
