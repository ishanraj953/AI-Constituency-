import React, { useState, useRef, useEffect } from 'react';
import AudioPlayer from './AudioPlayer';

export default function VoiceRecorder({ onAudioReady }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Check initial permission status if possible
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'microphone' })
        .then((permissionStatus) => {
          setPermissionGranted(permissionStatus.state === 'granted');
          permissionStatus.onchange = () => {
            setPermissionGranted(permissionStatus.state === 'granted');
          };
        })
        .catch(() => {});
    }
  }, []);

  // Timer runner for recording stopwatch
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop()); // Stop immediately, just checking
      setPermissionGranted(true);
      return true;
    } catch (err) {
      console.error('Microphone access denied:', err);
      setPermissionGranted(false);
      return false;
    }
  };

  const startRecording = async () => {
    const hasPermission = permissionGranted || (await requestPermission());
    if (!hasPermission) return;

    audioChunksRef.current = [];
    setAudioUrl(null);
    setRecordingTime(0);
    onAudioReady(null); // Clear parent status

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine best audio codec supported
      let options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/ogg' };
      }
      if (!MediaRecorder.isTypeSupported('audio/ogg')) {
        options = { mimeType: '' }; // Fallback to browser default
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop all audio tracks from stream to release mic icon
        stream.getTracks().forEach((track) => track.stop());

        const mimeType = audioChunksRef.current[0]?.type || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        
        setAudioUrl(url);
        onAudioReady(audioBlob);
      };

      mediaRecorder.start(250); // Get chunk chunks every 250ms
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording stream:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // File size validation (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert(`Audio file is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 10MB.`);
      return;
    }

    // Check type
    const allowedExtensions = ['.wav', '.mp3', '.m4a', '.webm', '.ogg', '.aac', '.flac'];
    const filenameLower = (file.name || '').toLowerCase();
    const isAllowedExt = allowedExtensions.some(ext => filenameLower.endsWith(ext));
    if (!file.type.startsWith('audio/') && !isAllowedExt) {
      alert('Please upload a valid audio file.');
      return;
    }

    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    onAudioReady(file);
  };

  const formatTimer = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Permission Block */}
      {permissionGranted === false && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <span>Microphone access blocked. Please enable mic permissions in your browser settings.</span>
        </div>
      )}

      {/* Main recording controller */}
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-xl">
        {isRecording ? (
          /* Recording Active View */
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-100 text-xs font-bold font-['Outfit'] tracking-wider">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
              <span>RECORDING • {formatTimer(recordingTime)}</span>
            </div>
            
            <button
              type="button"
              onClick={stopRecording}
              className="h-16 w-16 flex flex-center items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 active:scale-95 transition-all outline-none"
              title="Stop Recording"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="h-7 w-7">
                <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-xs text-slate-500 font-semibold font-['Outfit']">Click stop to finish recording</span>
          </div>
        ) : (
          /* Idle View */
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={startRecording}
                className="h-16 w-16 flex items-center justify-center rounded-full bg-govblue-600 hover:bg-govblue-700 text-white shadow-lg shadow-govblue-600/20 active:scale-95 transition-all outline-none"
                title="Start Recording"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </button>

              <div className="flex flex-col items-center">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="audio-file-upload"
                />
                <label
                  htmlFor="audio-file-upload"
                  className="h-16 w-16 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 shadow-sm active:scale-95 transition-all cursor-pointer"
                  title="Upload Audio File"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </label>
              </div>
            </div>
            <div className="text-center">
              <span className="text-sm font-bold text-slate-700 block font-['Outfit']">
                {audioUrl ? 'Change Audio / Re-record' : 'Record or Upload Voice Complaint'}
              </span>
              <span className="text-xs text-slate-400 mt-1 block">
                {audioUrl ? 'Record a new draft or select another file.' : 'Record live audio or upload a pre-recorded file.'}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Audio preview player */}
      {audioUrl && !isRecording && (
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Audio Preview
          </label>
          <AudioPlayer src={audioUrl} />
        </div>
      )}
    </div>
  );
}
