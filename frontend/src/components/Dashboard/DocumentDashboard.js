import React, { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import api from '../../services/api';

const DocumentDashboard = ({ documents, onReplace, loading }) => {
  const [replacementForm, setReplacementForm] = useState({
    isOpen: false,
    documentId: null,
    error: '',
    isLoading: false
  });

  const getStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, today);

    if (daysUntilExpiry < 0) return 'overdue';
    if (daysUntilExpiry <= 30) return 'expiring-soon';
    return 'up-to-date';
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'expiring-soon':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const handleReplaceClick = (documentId) => {
    setReplacementForm({
      isOpen: true,
      documentId,
      error: '',
      isLoading: false
    });
  };

  const handleReplaceSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const file = formData.get('file');
    const expiryDate = formData.get('expiryDate');

    setReplacementForm(prev => ({ ...prev, error: '', isLoading: true }));

    try {
      await onReplace(replacementForm.documentId, file, expiryDate || null);
      setReplacementForm({ isOpen: false, documentId: null, error: '', isLoading: false });
    } catch (err) {
      setReplacementForm(prev => ({
        ...prev,
        error: err.response?.data?.detail || 'Failed to replace document. Please try again.',
        isLoading: false
      }));
    }
  };

  const handleDelete = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await api.deleteDocument(documentId);
        // Refresh documents list through parent component
        window.location.reload();
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete document');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Document Dashboard</h2>
      
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-lg mb-1">Up-to-date</h3>
          <p className="text-2xl font-bold text-green-600">
            {documents.filter(doc => getStatus(doc.expiry_date) === 'up-to-date').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-lg mb-1">Expiring Soon</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {documents.filter(doc => getStatus(doc.expiry_date) === 'expiring-soon').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-lg mb-1">Overdue</h3>
          <p className="text-2xl font-bold text-red-600">
            {documents.filter(doc => getStatus(doc.expiry_date) === 'overdue').length}
          </p>
        </div>
      </div>

      {replacementForm.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full m-4">
            <h3 className="text-lg font-bold mb-4">Replace Document</h3>
            <form onSubmit={handleReplaceSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Document
                </label>
                <input
                  type="file"
                  name="file"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  disabled={replacementForm.isLoading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Max file size: 5MB. Supported formats: PDF, DOC, DOCX, JPG, PNG
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Expiry Date (optional)
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={replacementForm.isLoading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to attempt automatic date extraction
                </p>
              </div>

              {replacementForm.error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{replacementForm.error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={replacementForm.isLoading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {replacementForm.isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Replacing...
                    </span>
                  ) : (
                    'Replace Document'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setReplacementForm({ isOpen: false, documentId: null, error: '', isLoading: false })}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Document
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Upload Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expiry Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No documents uploaded yet
                </td>
              </tr>
            ) : (
              documents.map((doc) => {
                const status = getStatus(doc.expiry_date);
                const badgeColor = getStatusBadgeColor(status);
                
                return (
                  <tr key={doc.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{doc.original_filename}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {format(new Date(doc.upload_date), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {format(new Date(doc.expiry_date), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeColor}`}>
                        {status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button 
                        onClick={() => handleReplaceClick(doc.id)}
                        className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200 mr-3"
                      >
                        Replace
                      </button>
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="text-red-600 hover:text-red-900 transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentDashboard;