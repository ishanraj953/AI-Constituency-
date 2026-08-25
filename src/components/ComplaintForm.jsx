import React, { useState, useEffect } from 'react';
import { submitComplaint } from '../services/api';
import { submitSpeechComplaint } from '../services/SpeechService';
import VoiceRecorder from './VoiceRecorder';

export default function ComplaintForm({ onSubmitStart, onSubmitSuccess, onSubmitError }) {
  const [complaintMode, setComplaintMode] = useState('text'); // 'text' or 'voice'
  const [complaintText, setComplaintText] = useState('');
  const [location, setLocation] = useState('');
  const [pincode, setPincode] = useState('');
  const [wardNo, setWardNo] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Fetch location details based on pincode
  const fetchLocationByPincode = async (pin) => {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data[0]?.Status === 'Success' && data[0].PostOffice?.length) {
        const post = data[0].PostOffice[0];
        const loc = `${post.Name}, ${post.District}, ${post.State}`;
        setLocation(loc);
        setErrors((prev) => ({ ...prev, location: undefined }));
      } else {
        setErrors((prev) => ({ ...prev, pincode: 'Unable to fetch location for this pincode.' }));
      }
    } catch (e) {
      setErrors((prev) => ({ ...prev, pincode: 'Error fetching location.' }));
    }
  };

  // Use browser geolocation to get current coordinates and reverse geocode
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({ ...prev, location: 'Geolocation not supported.' }));
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const reverseGeocode = async (lat, lon) => {
          const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
          const res = await fetch(url);
          const data = await res.json();
          const address = data.city || data.locality || '';
          const state = data.principalSubdivision || '';
          return `${address}, ${state}`.replace(/^,\s*/, '').replace(/,\s*$/, '').trim();
        };
        try {
          const { latitude, longitude } = pos.coords;
          const loc = await reverseGeocode(latitude, longitude);
          setLocation(loc);
          setErrors((prev) => ({ ...prev, location: undefined }));
        } catch (e) {
          setErrors((prev) => ({ ...prev, location: 'Failed to reverse geocode location.' }));
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setErrors((prev) => ({ ...prev, location: err.message || 'Unable to retrieve location.' }));
        setIsLocating(false);
      }
    );
  };




  // Auto-fetch location when a valid pincode is entered
  useEffect(() => {
    if (pincode && /^\d{6}$/.test(pincode)) {
      fetchLocationByPincode(pincode);
    }
  }, [pincode]);

  const validate = () => {
    const tempErrors = {};
    
    // Validate Location (needed for both text and voice)
    if (!location.trim()) {
      tempErrors.location = 'Location or constituency is required.';
    }


    if (complaintMode === 'text') {
      // Validate Text Complaint
      if (!complaintText.trim()) {
        tempErrors.complaint = 'Complaint details are required.';
      } else if (complaintText.trim().length < 15) {
        tempErrors.complaint = 'Please describe the issue in at least 15 characters.';
      }
    } else {
      // Validate Voice Complaint
      if (!audioBlob) {
        tempErrors.audio = 'Please record or upload a voice complaint before submitting.';
      } else if (audioBlob.size < 4000) {
        tempErrors.audio = 'The recording is too short. Please speak clearly for at least 1-2 seconds.';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    onSubmitStart();
    try {
      let data;
      if (complaintMode === 'text') {
        data = await submitComplaint(complaintText.trim(), location.trim(), pincode.trim());
        setComplaintText('');
      } else {
        data = await submitSpeechComplaint(audioBlob, location.trim(), pincode.trim());
        setAudioBlob(null); // Clear recorded state after success
      }
      onSubmitSuccess(data);
      setLocation('');
      setPincode('');
      setErrors({});
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail || err.message || 'Network error occurred while connecting to the server.';
      onSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 font-['Outfit']">Submit a Complaint</h2>
        <p className="text-sm text-slate-500 mt-1">
          Provide your grievance details. AI will automatically process, categorize, and prioritize your concern.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tab Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3">
            Complaint Input Method
          </label>
          <div className="flex border border-slate-200 rounded-lg p-1 bg-slate-50 gap-1">
            <button
              type="button"
              onClick={() => {
                setComplaintMode('text');
                setErrors({});
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                complaintMode === 'text'
                  ? 'bg-white text-govblue-700 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4.5 w-4.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14.008.865-.501 3.423-.086 4.562-.213 5.69-.379 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              Text Complaint
            </button>

            <button
              type="button"
              onClick={() => {
                setComplaintMode('voice');
                setErrors({});
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                complaintMode === 'voice'
                  ? 'bg-white text-govblue-700 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4.5 w-4.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
              Voice Complaint
            </button>
          </div>
        </div>

        {/* Location Input (Universal) */}
        <div>
          <label htmlFor="location" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            Location / Constituency
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-slate-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Ward 4, New Delhi"
              disabled={isSubmitting || isLocating}
              className={`block w-full rounded-lg border py-3 pl-10 pr-3 text-sm transition-all focus:outline-none focus:ring-2 ${
                errors.location
                  ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-govblue-500 focus:ring-govblue-500/20 focus:bg-white'
              }`}
            />
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isSubmitting || isLocating}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-govblue-600 text-white px-2 py-1 rounded"
            >
              {isLocating ? 'Locating...' : 'Use Current'}
            </button>
          </div>
          {errors.location && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {errors.location}
            </p>
          )}
        </div>
        {/* Pincode Input */}
        <div className="mt-4">
          <label htmlFor="pincode" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            Pincode
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-slate-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
              </svg>
            </div>
            <input
              type="text"
              id="pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="e.g. 110001"
              disabled={isSubmitting}
              onBlur={() => { if (pincode && /^\d{6}$/.test(pincode)) { fetchLocationByPincode(pincode); } }}
              className={`block w-full rounded-lg border py-3 pl-10 pr-3 text-sm transition-all focus:outline-none focus:ring-2 ${
                errors.pincode
                  ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-govblue-500 focus:ring-govblue-500/20 focus:bg-white'
              }`}
            />
          </div>
          {errors.pincode && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {errors.pincode}
            </p>
          )}
        </div>
        {/* Ward Number Input */}
        <div className="mt-4">
          <label htmlFor="wardNo" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            Ward No.
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-slate-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
              </svg>
            </div>
            <input
              type="text"
              id="wardNo"
              value={wardNo}
              onChange={(e) => setWardNo(e.target.value)}
              placeholder="e.g. 12"
              disabled={isSubmitting}
              className={`block w-full rounded-lg border py-3 pl-10 pr-3 text-sm transition-all focus:outline-none focus:ring-2 ${
                errors.wardNo
                  ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-govblue-500 focus:ring-govblue-500/20 focus:bg-white'
              }`}
            />
          </div>
          {errors.wardNo && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {errors.wardNo}
            </p>
          )}
        </div>

        {/* Dynamic Input Body */}
        {complaintMode === 'text' ? (
          <div>
            <label htmlFor="complaint" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Grievance Details
            </label>
            <textarea
              id="complaint"
              rows="5"
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              placeholder="Describe the issue in detail. e.g., Water leakage in main street pipe causing water logging, affecting local shop owners..."
              disabled={isSubmitting}
              className={`block w-full rounded-lg border p-3 text-sm transition-all focus:outline-none focus:ring-2 ${
                errors.complaint
                  ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-govblue-500 focus:ring-govblue-500/20 focus:bg-white'
              }`}
            ></textarea>
            {errors.complaint && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                {errors.complaint}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Record Grievance Details
            </label>
            <VoiceRecorder onAudioReady={(blob) => {
              setAudioBlob(blob);
              setErrors((prev) => {
                const copy = { ...prev };
                delete copy.audio;
                return copy;
              });
            }} />
            {errors.audio && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                {errors.audio}
              </p>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || (complaintMode === 'voice' && !audioBlob && !isSubmitting)}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-govblue-600 hover:bg-govblue-700 active:bg-govblue-800 disabled:bg-slate-200 text-white font-medium text-sm py-3 px-4 shadow-md shadow-govblue-600/10 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-govblue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:text-slate-400 disabled:shadow-none"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {complaintMode === 'text' ? 'Submitting Grievance...' : 'Transcribing & Processing...'}
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
              {complaintMode === 'text' ? 'Submit Complaint' : 'Submit Voice Complaint'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
