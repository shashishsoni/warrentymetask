import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

interface Letter {
  id: string;
  title: string;
  content: string;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const queryClient = useQueryClient();

  const { data: letters, isLoading, error } = useQuery<Letter[]>({
    queryKey: ['letters'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/letters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  console.log("Dashboard rendering with:", { 
    isLoading, 
    hasLetters: letters?.length, 
    error: error?.message 
  });

  const handleCreateNew = () => {
    navigate('/editor');
  };

  const handleEdit = (id: string) => {
    navigate(`/editor/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/letters/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      queryClient.invalidateQueries({ queryKey: ['letters'] });
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Letters</h1>
        <div className="space-x-4">
          <button 
            onClick={handleCreateNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Letter
          </button>
          <button 
            onClick={logout}
            className="border border-gray-300 hover:bg-gray-100 px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {letters?.map((letter) => (
          <div key={letter.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-5">
              <h2 className="text-xl font-semibold mb-2">{letter.title}</h2>
              <span className="inline-block px-2 py-1 text-xs rounded bg-gray-200 text-gray-700 mb-3">
                {letter.isDraft ? 'Draft' : 'Published'}
              </span>
              <p className="text-sm text-gray-500">
                Last updated: {new Date(letter.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="px-5 py-3 bg-gray-50 flex justify-start space-x-2">
              <button 
                onClick={() => handleEdit(letter.id)}
                className="p-2 rounded-full hover:bg-gray-200"
              >
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button 
                onClick={() => handleDelete(letter.id)}
                className="p-2 rounded-full hover:bg-gray-200"
              >
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard; 