import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';

const DocumentUpload = ({ onUpload }) => {
  const [file, setFile] = useState(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = useCallback((event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 5 * 1024 * 1024;

      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Please select a PDF, JPEG, or PNG file.');
        return;
      }

      if (selectedFile.size > maxSize) {
        setError('File size exceeds the limit of 5MB.');
        return;
      }

      setFile(selectedFile);
      setError('');
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess(false);

    try {
      // Convert DD-MM-YYYY to YYYY-MM-DD
      let formattedDate = null;
      if (expiryDate) {
        const [day, month, year] = expiryDate.split('-');
        formattedDate = `${year}-${month}-${day}`;
      }

      await onUpload(file, formattedDate);
      setFile(null);
      setExpiryDate('');
      setSuccess(true);
      event.target.reset();
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to upload document. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
};

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="fileInput" className="block font-serif text-lg text-gray-700 mb-2">
            Document
          </label>
          <div className="relative">
            <input
              id="fileInput"
              type="file"
              onChange={handleFileChange}
              className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors"
              accept=".pdf,.jpg,.jpeg,.png"
              disabled={isUploading}
              aria-describedby="fileInputHelp"
            />
          </div>
          <p id="fileInputHelp" className="mt-2 text-sm text-gray-500">
            Accepted formats: PDF, JPG, PNG (max 5MB)
          </p>
        </div>

        <div>
          <label htmlFor="expiryDate" className="block font-serif text-lg text-gray-700 mb-2">
            Expiry Date
            <span className="text-gray-500 text-base font-sans ml-2">(optional)</span>
          </label>
          <input
            id="expiryDate"
            type="text"
            placeholder="DD-MM-YYYY"
            value={expiryDate}
            onChange={(e) => {
              const value = e.target.value.replace(/[^\d-]/g, '');
              if (value.length <= 10) {
                if (value.length === 2 || value.length === 5) {
                  if (!value.endsWith('-')) {
                    setExpiryDate(value + '-');
                  } else {
                    setExpiryDate(value);
                  }
                } else {
                  setExpiryDate(value);
                }
              }
            }}
            pattern="\d{2}-\d{2}-\d{4}"
            maxLength="10"
            className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors"
            disabled={isUploading}
            aria-describedby="expiryDateHelp"
          />
          <p id="expiryDateHelp" className="mt-2 text-sm text-gray-500">
            Format: DD-MM-YYYY (e.g., 31-12-2024)
          </p>
        </div>

        {error && (
          <div className="text-red-600 bg-red-50 px-4 py-3 rounded border border-red-100">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="text-green-600 bg-green-50 px-4 py-3 rounded border border-green-100">
            <p className="text-sm">Document uploaded successfully.</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading || !file}
          className="w-full px-4 py-3 bg-gray-800 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isUploading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </span>
          ) : (
            'Upload Document'
          )}
        </button>
      </form>
    </div>
  );
};

export default DocumentUpload;