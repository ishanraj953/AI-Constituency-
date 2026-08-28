import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, MapPin, CheckCircle2, AlertCircle, X, Mic, FileText, RefreshCw, Crosshair } from 'lucide-react';
import { submitComplaint } from '../services/api';
import { submitSpeechComplaint } from '../services/SpeechService';
import VoiceRecorder from './VoiceRecorder';

// Client-side EXIF GPS Parser
const extractClientExifGps = async (file) => {
  try {
    const buffer = await file.arrayBuffer();
    const dataView = new DataView(buffer);
    if (dataView.getUint16(0, false) !== 0xFFD8) return null;

    let offset = 2;
    const length = dataView.byteLength;

    while (offset < length) {
      const marker = dataView.getUint16(offset, false);
      offset += 2;

      if (marker === 0xFFE1) {
        const app1Length = dataView.getUint16(offset, false);
        offset += 2;

        const exifHeader = dataView.getUint32(offset, false);
        if (exifHeader === 0x45786966 && dataView.getUint16(offset + 4, false) === 0x0000) {
          const tiffStart = offset + 6;
          const byteOrder = dataView.getUint16(tiffStart, false);
          const littleEndian = byteOrder === 0x4949;

          if (dataView.getUint16(tiffStart + 2, littleEndian) !== 0x002A) return null;

          const ifd0Offset = dataView.getUint32(tiffStart + 4, littleEndian);
          const ifd0Start = tiffStart + ifd0Offset;
          const numEntries = dataView.getUint16(ifd0Start, littleEndian);
          let gpsIfdOffset = null;

          for (let i = 0; i < numEntries; i++) {
            const entryOffset = ifd0Start + 2 + i * 12;
            const tag = dataView.getUint16(entryOffset, littleEndian);
            if (tag === 0x8825) {
              gpsIfdOffset = dataView.getUint32(entryOffset + 8, littleEndian);
              break;
            }
          }

          if (gpsIfdOffset === null) return null;

          const gpsStart = tiffStart + gpsIfdOffset;
          const numGpsEntries = dataView.getUint16(gpsStart, littleEndian);
          let latRef = null;
          let latValues = null;
          let lonRef = null;
          let lonValues = null;

          const readRationals = (off, cnt) => {
            const vals = [];
            for (let j = 0; j < cnt; j++) {
              const num = dataView.getUint32(off + j * 8, littleEndian);
              const den = dataView.getUint32(off + j * 8 + 4, littleEndian);
              vals.push(den !== 0 ? num / den : 0);
            }
            return vals;
          };

          for (let i = 0; i < numGpsEntries; i++) {
            const entryOffset = gpsStart + 2 + i * 12;
            const tag = dataView.getUint16(entryOffset, littleEndian);
            const count = dataView.getUint32(entryOffset + 4, littleEndian);

            if (tag === 0x0001) {
              latRef = String.fromCharCode(dataView.getUint8(entryOffset + 8));
            } else if (tag === 0x0002) {
              const valOffset = tiffStart + dataView.getUint32(entryOffset + 8, littleEndian);
              latValues = readRationals(valOffset, count);
            } else if (tag === 0x0003) {
              lonRef = String.fromCharCode(dataView.getUint8(entryOffset + 8));
            } else if (tag === 0x0004) {
              const valOffset = tiffStart + dataView.getUint32(entryOffset + 8, littleEndian);
              lonValues = readRationals(valOffset, count);
            }
          }

          if (latValues && lonValues && latValues.length >= 3 && lonValues.length >= 3) {
            let lat = latValues[0] + latValues[1] / 60 + latValues[2] / 3600;
            let lon = lonValues[0] + lonValues[1] / 60 + lonValues[2] / 3600;
            if (latRef && latRef.toUpperCase() === 'S') lat = -lat;
            if (lonRef && lonRef.toUpperCase() === 'W') lon = -lon;
            if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon) && isFinite(lat) && isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && (Math.abs(lat) > 1e-5 || Math.abs(lon) > 1e-5)) {
              return {
                latitude: Number(lat.toFixed(6)),
                longitude: Number(lon.toFixed(6)),
                source: 'image_exif'
              };
            }
          }
        }
        offset += app1Length - 2;
      } else if ((marker & 0xFF00) === 0xFF00) {
        if (marker === 0xFFDA || marker === 0xFFD9) break;
        const sectionLength = dataView.getUint16(offset, false);
        offset += sectionLength;
      } else {
        break;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
};

export default function ComplaintForm({
  onSubmitStart,
  onSubmitSuccess,
  onSubmitError
}) {
  const [complaintMode, setComplaintMode] = useState('text');

  const [complaintText, setComplaintText] = useState('');
  const [location, setLocation] = useState('');
  const [pincode, setPincode] = useState('');
  const [wardNo, setWardNo] = useState('');

  const [audioBlob, setAudioBlob] = useState(null);

  // Photographic Evidence & GPS
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'idle' | 'acquiring' | 'success' | 'failed'

  // Live In-App Camera Viewfinder State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const fileInputRef = useRef(null);

  // Automatically acquire device GPS coordinates
  const acquireDeviceGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('failed');
      setGpsCoords({
        latitude: 28.6139,
        longitude: 77.2090,
        accuracy: 50,
        source: 'constituency_default'
      });
      return;
    }

    setGpsStatus('acquiring');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (
          typeof latitude === 'number' &&
          typeof longitude === 'number' &&
          !isNaN(latitude) &&
          !isNaN(longitude) &&
          isFinite(latitude) &&
          isFinite(longitude)
        ) {
          setGpsCoords({
            latitude: Number(latitude.toFixed(6)),
            longitude: Number(longitude.toFixed(6)),
            accuracy: Math.round(accuracy || 10),
            source: 'device_gps'
          });
          setGpsStatus('success');
        } else {
          setGpsCoords({
            latitude: 28.6139,
            longitude: 77.2090,
            accuracy: 50,
            source: 'constituency_default'
          });
          setGpsStatus('failed');
        }
      },
      (err) => {
        console.warn('GPS acquire error:', err.message);
        setGpsStatus('failed');
        setGpsCoords({
          latitude: 28.6139,
          longitude: 77.2090,
          accuracy: 50,
          source: 'constituency_default'
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Live Camera Handlers
  const startLiveCamera = async () => {
    setIsCameraOpen(true);
    setCameraError('');
    acquireDeviceGps();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Live camera error:', err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission denied. Please allow camera permissions or use Gallery Upload.'
          : 'Unable to start camera. Please check your camera connection or use Gallery Upload.'
      );
    }
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setCameraError('');
  };

  const capturePhotoSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera_snap_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
        setErrors((prev) => ({ ...prev, image: undefined }));
        stopLiveCamera();
      }
    }, 'image/jpeg', 0.92);
  };

  useEffect(() => {
    if (isCameraOpen && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraOpen]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Acquire GPS on mount
  useEffect(() => {
    acquireDeviceGps();
  }, []);


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
        setErrors((prev) => ({
          ...prev,
          pincode: 'Unable to fetch location for this pincode.'
        }));
      }
    } catch (e) {
      setErrors((prev) => ({
        ...prev,
        pincode: 'Error fetching location.'
      }));
    }
  };

  // Use browser geolocation for text address
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({
        ...prev,
        location: 'Geolocation not supported by this browser.'
      }));
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (
          typeof latitude === 'number' &&
          typeof longitude === 'number' &&
          !isNaN(latitude) &&
          !isNaN(longitude) &&
          isFinite(latitude) &&
          isFinite(longitude)
        ) {
          setGpsCoords({
            latitude: Number(latitude.toFixed(6)),
            longitude: Number(longitude.toFixed(6)),
            accuracy: Math.round(accuracy || 10),
            source: 'device_gps'
          });
          setGpsStatus('success');
        }

        try {
          const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
          const res = await fetch(url);
          const data = await res.json();

          const address = data.city || data.locality || '';
          const state = data.principalSubdivision || '';
          const loc = `${address}, ${state}`.replace(/^,\s*/, '').replace(/,\s*$/, '').trim();

          if (loc) {
            setLocation(loc);
          } else {
            setLocation(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
          }

          setErrors((prev) => ({ ...prev, location: undefined }));
        } catch (e) {
          setLocation(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setErrors((prev) => ({
          ...prev,
          location: err.message || 'Unable to retrieve location.'
        }));
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Auto-fetch location from pincode
  useEffect(() => {
    if (pincode && /^\d{6}$/.test(pincode)) {
      fetchLocationByPincode(pincode);
    }
  }, [pincode]);

  // Handle image selection
  const handleImageChange = async (event) => {
    const selectedImage = event.target.files?.[0];
    if (!selectedImage) return;

    if (!selectedImage.type.startsWith('image/')) {
      setErrors((prev) => ({
        ...prev,
        image: 'Please select a valid image file (JPG, PNG, WEBP).'
      }));
      return;
    }

    setImage(selectedImage);
    setImagePreview(URL.createObjectURL(selectedImage));
    setErrors((prev) => ({ ...prev, image: undefined }));

    // Try extracting embedded EXIF GPS directly from the image file
    try {
      const exifGps = await extractClientExifGps(selectedImage);
      if (
        exifGps &&
        typeof exifGps.latitude === 'number' &&
        typeof exifGps.longitude === 'number' &&
        !isNaN(exifGps.latitude) &&
        !isNaN(exifGps.longitude) &&
        isFinite(exifGps.latitude) &&
        isFinite(exifGps.longitude)
      ) {
        setGpsCoords({
          latitude: exifGps.latitude,
          longitude: exifGps.longitude,
          accuracy: 5,
          source: 'image_exif'
        });
        setGpsStatus('success');
        return;
      }
    } catch (e) {
      console.warn('Could not extract EXIF client-side:', e);
    }

    // Fallback: acquire live device GPS
    acquireDeviceGps();
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setErrors((prev) => ({ ...prev, image: undefined }));
  };

  // Validate form
  const validate = () => {
    const tempErrors = {};

    if (!location.trim()) {
      tempErrors.location = 'Location or constituency name is required.';
    }

    if (complaintMode === 'text') {
      if (!complaintText.trim()) {
        tempErrors.complaint = 'Grievance description is required.';
      } else if (complaintText.trim().length < 10) {
        tempErrors.complaint = 'Please describe the issue in at least 10 characters.';
      }

      if (!image) {
        tempErrors.image = 'Please capture or upload photo evidence of the issue.';
      }
    } else {
      if (!audioBlob) {
        tempErrors.audio = 'Please record your voice complaint before submitting.';
      } else if (audioBlob.size < 4000) {
        tempErrors.audio = 'Recording is too short. Please speak clearly for at least 2 seconds.';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Submit complaint
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    onSubmitStart();

    try {
      let data;
      const validLat =
        gpsCoords &&
        typeof gpsCoords.latitude === 'number' &&
        !isNaN(gpsCoords.latitude) &&
        isFinite(gpsCoords.latitude)
          ? Number(gpsCoords.latitude.toFixed(6))
          : 28.6139;
      const validLon =
        gpsCoords &&
        typeof gpsCoords.longitude === 'number' &&
        !isNaN(gpsCoords.longitude) &&
        isFinite(gpsCoords.longitude)
          ? Number(gpsCoords.longitude.toFixed(6))
          : 77.2090;

      if (complaintMode === 'text') {
        data = await submitComplaint(
          complaintText.trim(),
          location.trim(),
          pincode.trim(),
          wardNo.trim(),
          image,
          validLat,
          validLon
        );

        setComplaintText('');
        handleRemoveImage();
      } else {
        data = await submitSpeechComplaint(
          audioBlob,
          location.trim(),
          pincode.trim(),
          wardNo.trim(),
          image,
          validLat,
          validLon
        );

        setAudioBlob(null);
        handleRemoveImage();
      }

      onSubmitSuccess(data);
      setLocation('');
      setPincode('');
      setWardNo('');
      setErrors({});
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.message ||
        'An error occurred while communicating with the server.';
      onSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 transition-colors">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white font-['Outfit']">
          Submit Citizen Grievance
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Provide your grievance details with visual or voice proof. AI will categorize, verify, and prioritize your complaint.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Complaint Mode Toggle */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
            Complaint Input Method
          </label>
          <div className="flex border border-slate-200 dark:border-slate-700 rounded-xl p-1 bg-slate-50 dark:bg-slate-800/60 gap-1">
            <button
              type="button"
              onClick={() => {
                setComplaintMode('text');
                setErrors({});
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                complaintMode === 'text'
                  ? 'bg-white dark:bg-slate-700 text-govblue-700 dark:text-govblue-300 shadow-sm border border-slate-200/50 dark:border-slate-600'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="h-4 w-4" />
              Text & Photo
            </button>

            <button
              type="button"
              onClick={() => {
                setComplaintMode('voice');
                setErrors({});
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                complaintMode === 'voice'
                  ? 'bg-white dark:bg-slate-700 text-govblue-700 dark:text-govblue-300 shadow-sm border border-slate-200/50 dark:border-slate-600'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Mic className="h-4 w-4" />
              Voice Recording
            </button>
          </div>
        </div>

        {/* Location & Geolocation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="location" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Location / Constituency <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isSubmitting || isLocating}
                className="inline-flex items-center gap-1 text-xs font-semibold text-govblue-600 dark:text-govblue-400 hover:underline disabled:opacity-50"
              >
                <Crosshair className={`h-3.5 w-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                {isLocating ? 'Detecting GPS...' : 'Use Live GPS'}
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Ward 12, Civil Lines, Jaipur"
                disabled={isSubmitting || isLocating}
                className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-3 px-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-govblue-500 focus:ring-1 focus:ring-govblue-500"
              />
            </div>
            {errors.location && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> {errors.location}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="pincode" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Pincode (Auto-Lookup)
            </label>
            <input
              type="text"
              id="pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="e.g. 110001"
              maxLength={6}
              disabled={isSubmitting}
              className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-3 px-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-govblue-500 focus:ring-1 focus:ring-govblue-500"
            />
            {errors.pincode && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.pincode}</p>
            )}
          </div>

          <div>
            <label htmlFor="wardNo" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Ward / Sector No.
            </label>
            <input
              type="text"
              id="wardNo"
              value={wardNo}
              onChange={(e) => setWardNo(e.target.value)}
              placeholder="e.g. Ward 4 / Sector 9"
              disabled={isSubmitting}
              className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-3 px-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-govblue-500 focus:ring-1 focus:ring-govblue-500"
            />
          </div>
        </div>

        {/* Text Grievance Description */}
        {complaintMode === 'text' ? (
          <div>
            <label htmlFor="complaint" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Grievance Narrative <span className="text-red-500">*</span>
            </label>
            <textarea
              id="complaint"
              rows="4"
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              placeholder="Describe the civic grievance in detail (e.g. Street light broken near community hall creating safety hazard for pedestrians)..."
              disabled={isSubmitting}
              className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-govblue-500 focus:ring-1 focus:ring-govblue-500"
            />
            {errors.complaint && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> {errors.complaint}
              </p>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Record Voice Grievance <span className="text-red-500">*</span>
            </label>
            <VoiceRecorder
              onAudioReady={(blob) => {
                setAudioBlob(blob);
                setErrors((prev) => {
                  const copy = { ...prev };
                  delete copy.audio;
                  return copy;
                });
              }}
            />
            {errors.audio && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> {errors.audio}
              </p>
            )}
          </div>
        )}

        {/* Photographic Evidence & Live Camera Upload (Available for Both Modes) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Photographic Evidence {complaintMode === 'text' ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal">(Optional for voice)</span>}
            </label>

            {/* GPS Tag Badge Indicator */}
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 px-2.5 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>
                {gpsCoords
                  ? `📍 GPS Tagged: ${gpsCoords.latitude}°, ${gpsCoords.longitude}°${gpsCoords.source === 'image_exif' ? ' (from photo)' : ' (live GPS)'}`
                  : '📍 GPS Auto-Tagging Active'}
              </span>
            </div>
          </div>

          {/* Hidden File Input for Gallery Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={isSubmitting}
            className="hidden"
          />

          {!imagePreview ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={startLiveCamera}
                disabled={isSubmitting}
                className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-govblue-400 dark:border-govblue-600 bg-govblue-50/60 dark:bg-govblue-950/30 hover:bg-govblue-100/70 dark:hover:bg-govblue-950/60 text-govblue-700 dark:text-govblue-300 transition-all text-center group shadow-sm hover:shadow"
              >
                <div className="p-3 bg-govblue-600 text-white rounded-full mb-2 group-hover:scale-110 transition-transform shadow-md shadow-govblue-600/30">
                  <Camera className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold">Open Camera (Live GPS)</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Launches real-time camera viewfinder</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all text-center group shadow-sm hover:shadow"
              >
                <div className="p-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold">Upload from Gallery</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">JPG, PNG, WebP image formats</span>
              </button>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/60 shadow-sm">
              <div className="relative rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center max-h-72">
                <img
                  src={imagePreview}
                  alt="Complaint preview"
                  className="max-h-72 w-full object-contain rounded-xl"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2.5 right-2.5 p-2 bg-slate-900/80 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                  title="Remove Image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between mt-3.5 text-xs gap-2">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="font-bold">{image?.name || 'Live Camera Snapshot'}</span>
                  <span className="text-slate-400">({((image?.size || 0) / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={startLiveCamera}
                    className="text-govblue-600 dark:text-govblue-400 font-bold hover:underline flex items-center gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Retake Photo
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-red-600 dark:text-red-400 font-bold hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}

          {errors.image && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" /> {errors.image}
            </p>
          )}
        </div>

        {/* Submit Action Button */}
        <button
          type="submit"
          disabled={isSubmitting || (complaintMode === 'voice' && !audioBlob)}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-govblue-600 hover:bg-govblue-700 active:bg-govblue-800 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold text-sm py-3.5 px-6 shadow-md shadow-govblue-600/20 transition-all"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Analyzing Visual Proof & Submitting...</span>
            </>
          ) : (
            <span>{complaintMode === 'text' ? 'Submit Grievance with Photo Proof' : 'Submit Voice & Photo Grievance'}</span>
          )}
        </button>
      </form>

      {/* Real In-App Live Camera Viewfinder Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col">
            {/* Camera Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90 text-white">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-govblue-400" />
                <span className="font-bold text-sm">Live Camera Viewfinder</span>
              </div>
              <button
                type="button"
                onClick={stopLiveCamera}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Viewfinder Container */}
            <div className="relative aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
              {cameraError ? (
                <div className="p-6 text-center text-white space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-red-300">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      stopLiveCamera();
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-govblue-600 hover:bg-govblue-700 text-white text-xs font-bold transition"
                  >
                    <Upload className="h-4 w-4" /> Upload from Gallery Instead
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Viewfinder Target Reticle Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border border-white/40 rounded-2xl relative flex items-center justify-center">
                      <div className="w-6 h-6 border-t-2 border-l-2 border-govblue-400 absolute top-0 left-0"></div>
                      <div className="w-6 h-6 border-t-2 border-r-2 border-govblue-400 absolute top-0 right-0"></div>
                      <div className="w-6 h-6 border-b-2 border-l-2 border-govblue-400 absolute bottom-0 left-0"></div>
                      <div className="w-6 h-6 border-b-2 border-r-2 border-govblue-400 absolute bottom-0 right-0"></div>
                      <Crosshair className="h-6 w-6 text-govblue-400/80 animate-pulse" />
                    </div>
                  </div>

                  {/* Live GPS HUD Overlay on Camera Feed */}
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur border border-white/20 rounded-lg px-3 py-1.5 text-[11px] text-white flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="font-mono">
                      📍 {gpsCoords ? `${gpsCoords.latitude}°, ${gpsCoords.longitude}°` : 'Acquiring GPS...'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Camera Controls Bar */}
            {!cameraError && (
              <div className="flex items-center justify-around p-5 bg-slate-900 border-t border-slate-800">
                <button
                  type="button"
                  onClick={stopLiveCamera}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>

                {/* Shutter Button */}
                <button
                  type="button"
                  onClick={capturePhotoSnapshot}
                  className="relative p-1 rounded-full border-4 border-white/30 hover:border-white transition-all transform hover:scale-105 active:scale-95 group"
                  title="Capture Photo"
                >
                  <div className="w-14 h-14 rounded-full bg-white group-hover:bg-govblue-500 flex items-center justify-center transition-colors shadow-lg">
                    <Camera className="h-6 w-6 text-slate-900 group-hover:text-white transition-colors" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopLiveCamera();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Use File
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
