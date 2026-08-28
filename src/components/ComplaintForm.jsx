import React, { useState, useEffect } from 'react';
import { submitComplaint } from '../services/api';
import { submitSpeechComplaint } from '../services/SpeechService';
import VoiceRecorder from './VoiceRecorder';

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

  // Phase 10
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);


  // Fetch location details based on pincode
  const fetchLocationByPincode = async (pin) => {
    try {
      const res = await fetch(
        `https://api.postalpincode.in/pincode/${pin}`
      );

      const data = await res.json();

      if (
        data[0]?.Status === 'Success' &&
        data[0].PostOffice?.length
      ) {
        const post = data[0].PostOffice[0];

        const loc =
          `${post.Name}, ${post.District}, ${post.State}`;

        setLocation(loc);

        setErrors((prev) => ({
          ...prev,
          location: undefined
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          pincode:
            'Unable to fetch location for this pincode.'
        }));
      }
    } catch (e) {
      setErrors((prev) => ({
        ...prev,
        pincode: 'Error fetching location.'
      }));
    }
  };


  // Use browser geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({
        ...prev,
        location: 'Geolocation not supported.'
      }));

      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {

        const reverseGeocode = async (
          lat,
          lon
        ) => {

          const url =
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;

          const res = await fetch(url);

          const data = await res.json();

          const address =
            data.city ||
            data.locality ||
            '';

          const state =
            data.principalSubdivision ||
            '';

          return `${address}, ${state}`
            .replace(/^,\s*/, '')
            .replace(/,\s*$/, '')
            .trim();
        };

        try {

          const {
            latitude,
            longitude
          } = pos.coords;

          const loc =
            await reverseGeocode(
              latitude,
              longitude
            );

          setLocation(loc);

          setErrors((prev) => ({
            ...prev,
            location: undefined
          }));

        } catch (e) {

          setErrors((prev) => ({
            ...prev,
            location:
              'Failed to reverse geocode location.'
          }));

        } finally {

          setIsLocating(false);

        }
      },

      (err) => {

        setErrors((prev) => ({
          ...prev,
          location:
            err.message ||
            'Unable to retrieve location.'
        }));

        setIsLocating(false);

      }
    );
  };


  // Auto-fetch location from pincode
  useEffect(() => {

    if (
      pincode &&
      /^\d{6}$/.test(pincode)
    ) {
      fetchLocationByPincode(pincode);
    }

  }, [pincode]);


  // Handle image selection
  const handleImageChange = (event) => {

    const selectedImage =
      event.target.files?.[0];

    if (!selectedImage) {
      return;
    }

    // Only allow images
    if (
      !selectedImage.type.startsWith(
        'image/'
      )
    ) {
      setErrors((prev) => ({
        ...prev,
        image:
          'Please select a valid image file.'
      }));

      return;
    }

    setImage(selectedImage);

    setImagePreview(
      URL.createObjectURL(selectedImage)
    );

    setErrors((prev) => ({
      ...prev,
      image: undefined
    }));
  };


  // Remove selected image
  const handleRemoveImage = () => {

    setImage(null);

    setImagePreview(null);

    setErrors((prev) => ({
      ...prev,
      image: undefined
    }));
  };


  // Validate form
  const validate = () => {

    const tempErrors = {};

    // Location
    if (!location.trim()) {
      tempErrors.location =
        'Location or constituency is required.';
    }


    // Text complaint
    if (complaintMode === 'text') {

      if (!complaintText.trim()) {

        tempErrors.complaint =
          'Complaint details are required.';

      } else if (
        complaintText.trim().length < 15
      ) {

        tempErrors.complaint =
          'Please describe the issue in at least 15 characters.';
      }


      // Phase 10:
      // Geo-tagged image is required
      if (!image) {

        tempErrors.image =
          'Please upload a geo-tagged image of the issue.';
      }

    } else {

      // Voice complaint
      if (!audioBlob) {

        tempErrors.audio =
          'Please record or upload a voice complaint before submitting.';

      } else if (
        audioBlob.size < 4000
      ) {

        tempErrors.audio =
          'The recording is too short. Please speak clearly for at least 1-2 seconds.';
      }
    }


    setErrors(tempErrors);

    return (
      Object.keys(tempErrors).length === 0
    );
  };


  // Submit complaint
  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    onSubmitStart();

    try {

      let data;

      if (complaintMode === 'text') {

        data = await submitComplaint(
          complaintText.trim(),
          location.trim(),
          pincode.trim(),
          wardNo.trim(),
          image
        );

        setComplaintText('');

        setImage(null);

        setImagePreview(null);

      } else {

        data =
          await submitSpeechComplaint(
            audioBlob,
            location.trim(),
            pincode.trim(),
            wardNo.trim()
          );

        setAudioBlob(null);
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
        'Network error occurred while connecting to the server.';

      onSubmitError(errorMessage);

    } finally {

      setIsSubmitting(false);

    }
  };


  return (

    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">

      <div className="mb-6">

        <h2 className="text-xl font-semibold text-slate-900 font-['Outfit']">
          Submit a Complaint
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Provide your grievance details. AI will automatically process,
          categorize, and prioritize your concern.
        </p>

      </div>


      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >


        {/* Complaint Mode */}

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

              Voice Complaint

            </button>

          </div>

        </div>


        {/* Location */}

        <div>

          <label
            htmlFor="location"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2"
          >
            Location / Constituency
          </label>

          <div className="relative">

            <input
              type="text"

              id="location"

              value={location}

              onChange={(e) =>
                setLocation(e.target.value)
              }

              placeholder="e.g. Ward 4, New Delhi"

              disabled={
                isSubmitting ||
                isLocating
              }

              className="block w-full rounded-lg border border-slate-300 bg-slate-50 py-3 px-3 text-sm"
            />

            <button
              type="button"

              onClick={
                handleUseCurrentLocation
              }

              disabled={
                isSubmitting ||
                isLocating
              }

              className="absolute right-2 top-1/2 -translate-y-1/2 bg-govblue-600 text-white px-2 py-1 rounded"
            >

              {isLocating
                ? 'Locating...'
                : 'Use Current'}

            </button>

          </div>


          {errors.location && (

            <p className="mt-1 text-xs text-red-600">

              {errors.location}

            </p>

          )}

        </div>


        {/* Pincode */}

        <div>

          <label
            htmlFor="pincode"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2"
          >
            Pincode
          </label>

          <input
            type="text"

            id="pincode"

            value={pincode}

            onChange={(e) =>
              setPincode(e.target.value)
            }

            placeholder="e.g. 110001"

            disabled={isSubmitting}

            className="block w-full rounded-lg border border-slate-300 bg-slate-50 py-3 px-3 text-sm"
          />


          {errors.pincode && (

            <p className="mt-1 text-xs text-red-600">

              {errors.pincode}

            </p>

          )}

        </div>


        {/* Ward Number */}

        <div>

          <label
            htmlFor="wardNo"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2"
          >
            Ward No.
          </label>

          <input
            type="text"

            id="wardNo"

            value={wardNo}

            onChange={(e) =>
              setWardNo(e.target.value)
            }

            placeholder="e.g. 12"

            disabled={isSubmitting}

            className="block w-full rounded-lg border border-slate-300 bg-slate-50 py-3 px-3 text-sm"
          />

        </div>


        {/* Text / Voice Input */}

        {complaintMode === 'text' ? (

          <div>

            <label
              htmlFor="complaint"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2"
            >
              Grievance Details
            </label>

            <textarea
              id="complaint"

              rows="5"

              value={complaintText}

              onChange={(e) =>
                setComplaintText(e.target.value)
              }

              placeholder="Describe the issue in detail..."

              disabled={isSubmitting}

              className="block w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm"
            />


            {errors.complaint && (

              <p className="mt-1 text-xs text-red-600">

                {errors.complaint}

              </p>

            )}

          </div>

        ) : (

          <div>

            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Record Grievance Details
            </label>

            <VoiceRecorder
              onAudioReady={(blob) => {

                setAudioBlob(blob);

                setErrors((prev) => {

                  const copy = {
                    ...prev
                  };

                  delete copy.audio;

                  return copy;

                });

              }}
            />


            {errors.audio && (

              <p className="mt-1 text-xs text-red-600">

                {errors.audio}

              </p>

            )}

          </div>

        )}


        {/* Phase 10 Image Upload - Text Complaints */}

        {complaintMode === 'text' && (

          <div>

            <label
              htmlFor="image"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2"
            >
              Geo-Tagged Image
            </label>

            <input
              type="file"

              id="image"

              accept="image/*"
              capture="environment"

              onChange={handleImageChange}

              disabled={isSubmitting}

              className="block w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm"
            />

            <p className="mt-2 text-xs text-slate-500">
              Upload the original photo captured with location enabled.
              Images without GPS metadata will be rejected.
            </p>


            {imagePreview && (

              <div className="mt-4 border border-slate-200 rounded-lg p-3">

                <img
                  src={imagePreview}

                  alt="Complaint preview"

                  className="w-full max-h-64 object-contain rounded-lg"
                />


                <div className="flex items-center justify-between mt-3">

                  <p className="text-xs text-slate-600">

                    {image?.name}

                  </p>


                  <button
                    type="button"

                    onClick={
                      handleRemoveImage
                    }

                    className="text-xs text-red-600 hover:text-red-700"
                  >

                    Remove Image

                  </button>

                </div>

              </div>

            )}


            {errors.image && (

              <p className="mt-2 text-xs text-red-600">

                {errors.image}

              </p>

            )}

          </div>

        )}


        {/* Submit */}

        <button
          type="submit"

          disabled={
            isSubmitting ||
            (
              complaintMode === 'voice' &&
              !audioBlob
            )
          }

          className="w-full flex items-center justify-center rounded-lg bg-govblue-600 hover:bg-govblue-700 disabled:bg-slate-200 text-white font-medium text-sm py-3 px-4"
        >

          {isSubmitting
            ? (
              complaintMode === 'text'
                ? 'Submitting Complaint...'
                : 'Transcribing & Processing...'
            )
            : (
              complaintMode === 'text'
                ? 'Submit Complaint'
                : 'Submit Voice Complaint'
            )}

        </button>

      </form>

    </div>

  );
}