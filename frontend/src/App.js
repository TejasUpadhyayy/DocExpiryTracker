import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DocumentUpload from './components/Upload/DocumentUpload';
import DocumentDashboard from './components/Dashboard/DocumentDashboard';
import api from './services/api';

const App = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.getDocuments();
      setDocuments(data);
    } catch (err) {
      setError('Failed to fetch documents');
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDocumentUpload = async (file, expiryDate) => {
    try {
      setLoading(true);
      const formattedDate = expiryDate ? format(new Date(expiryDate), 'yyyy-MM-dd') : null;
      await api.uploadDocument(file, formattedDate);
      fetchDocuments();
    } catch (err) {
      setError('Failed to upload document');
      console.error('Error uploading document:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentReplace = async (documentId, file, expiryDate) => {
    try {
      setLoading(true);
      const formattedDate = expiryDate ? format(new Date(expiryDate), 'yyyy-MM-dd') : null;
      await api.replaceDocument(documentId, file, formattedDate);
      fetchDocuments();
    } catch (err) {
      setError('Failed to replace document');
      console.error('Error replacing document:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Simplified background with fewer, slower animations */}
      <div className="absolute inset-0">
        {/* Primary gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50"></div>

        {/* Reduced number of animated blobs */}
        <div className="absolute -top-1/2 -left-1/2 w-[150vw] h-[150vh] animate-blob opacity-40">
          <div className="absolute w-full h-full bg-gradient-to-br from-emerald-200/40 to-teal-200/40 rounded-blob mix-blend-multiply filter blur-xl"></div>
        </div>

        <div className="absolute -bottom-1/2 -right-1/2 w-[150vw] h-[150vh] animate-blob-slow opacity-40">
          <div className="absolute w-full h-full bg-gradient-to-br from-blue-200/40 to-purple-200/40 rounded-blob mix-blend-multiply filter blur-xl"></div>
        </div>
      </div>

      <div className="relative min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-mono text-4xl font-light tracking-tight sm:text-5xl md:text-6xl">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-purple-500">
                Document Expiry Tracker
              </span>
            </h1>
          </div>

          <div className="space-y-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-md p-6 transition-all duration-300 hover:shadow-lg hover:bg-white/70">
              <DocumentUpload onUpload={handleDocumentUpload} />
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-md p-6 transition-all duration-300 hover:shadow-lg hover:bg-white/70">
              <DocumentDashboard
                documents={documents}
                onReplace={handleDocumentReplace}
                loading={loading}
                error={error}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0%, 0%) rotate(0deg) scale(1); }
          50% { transform: translate(-10%, -10%) rotate(180deg) scale(1.1); }
        }

        .animate-blob {
          animation: blob 20s ease-in-out infinite;
        }

        .animate-blob-slow {
          animation: blob 25s ease-in-out infinite reverse;
        }

        .rounded-blob {
          border-radius: 60% 40% 50% 50% / 50% 50% 40% 60%;
        }
      `}</style>
    </div>
  );
};

export default App;