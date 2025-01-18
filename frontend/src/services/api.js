import axios from 'axios';
import { format } from 'date-fns';

const API_URL = 'http://127.0.0.1:8000';

const api = {
    // Upload new document
    uploadDocument: async (file, expiryDate) => {
        const formData = new FormData();
        formData.append('file', file);
        if (expiryDate) {
            // Parse the expiryDate string and format it as YYYY-MM-DD
            const formattedDate = format(new Date(expiryDate), 'yyyy-MM-dd');
            formData.append('expiry_date', formattedDate);
        }
        const response = await axios.post(`${API_URL}/documents/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    // Get all documents
    getDocuments: async () => {
        const response = await axios.get(`${API_URL}/documents/`);
        return response.data;
    },

    // Replace document
    replaceDocument: async (documentId, file, expiryDate) => {
        const formData = new FormData();
        formData.append('file', file);
        if (expiryDate) {
            // Parse the expiryDate string and format it as YYYY-MM-DD
            const formattedDate = format(new Date(expiryDate), 'yyyy-MM-dd');
            formData.append('expiry_date', formattedDate);
        }
        const response = await axios.put(`${API_URL}/documents/${documentId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    // Delete document
    deleteDocument: async (documentId) => {
        const response = await axios.delete(`${API_URL}/documents/${documentId}`);
        return response.data;
    }
};

export default api;