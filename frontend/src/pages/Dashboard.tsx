import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';

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

  const { data: letters, isLoading, error, refetch } = useQuery<Letter[]>({
    queryKey: ['letters'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/letters`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        
        // Validate the response data
        if (!response.data || !Array.isArray(response.data)) {
          console.error('Invalid response data format:', response.data);
          return [];
        }
        
        // Filter out any potentially invalid letters
        const validLetters = response.data.filter(letter => 
          letter && letter.id && letter.title
        );
        
        console.log(`Fetched ${validLetters.length} valid letters`);
        return validLetters;
      } catch (error) {
        console.error('Error fetching letters:', error);
        
        // Handle 403 errors (expired token)
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          alert('Your session has expired. Please log in again.');
          logout();
          setTimeout(() => navigate('/login'), 1000);
        }
        
        throw error;
      }
    },
    enabled: !!token,
  });

  console.log("Dashboard rendering with:", { 
    isLoading, 
    hasLetters: letters?.length, 
    error: error?.message 
  });

  // Clean up any invalid letter references from localStorage
  useEffect(() => {
    if (!isLoading && letters) {
      // Get valid letter IDs
      const validIds = new Set(letters.map(letter => letter.id));
      
      // Clear any editor data that references non-existent letters
      try {
        // Check localStorage for any editor state
        const storageKeys = Object.keys(localStorage);
        for (const key of storageKeys) {
          if (key.startsWith('editor_') || key.includes('letter_')) {
            const idMatch = key.match(/[0-9a-fA-F]{24}/);
            if (idMatch && !validIds.has(idMatch[0])) {
              console.log(`Removing invalid letter reference: ${key}`);
              localStorage.removeItem(key);
            }
          }
        }
      } catch (error) {
        console.error('Error cleaning localStorage:', error);
      }
    }
  }, [isLoading, letters]);

  // Function to refresh letters data
  const refreshLetters = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['letters'] });
  }, [queryClient]);

  // Refresh letters when component mounts to ensure fresh data
  useEffect(() => {
    refreshLetters();
    // Set up an interval to refresh data every 30 seconds
    const intervalId = setInterval(refreshLetters, 30000);
    
    return () => clearInterval(intervalId);
  }, [refreshLetters]);

  const handleCreateNew = () => {
    navigate('/editor');
  };

  const handleEdit = useCallback((id: string) => {
    // First check if this letter exists in our data
    const letterExists = letters?.some(letter => letter.id === id);
    
    if (!letterExists) {
      // Letter doesn't exist in our list, confirm before navigating
      const confirmNavigation = window.confirm(
        "This letter may no longer exist. Would you like to refresh the list or go to the editor anyway?"
      );
      
      if (confirmNavigation) {
        // User wants to continue to the editor
        navigate(`/editor/${id}`);
      } else {
        // Refresh the list
        refreshLetters();
      }
    } else {
      // Letter exists, navigate to editor
      navigate(`/editor/${id}`);
    }
  }, [letters, navigate, refreshLetters]);

  // Updated delete handler
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this letter?')) {
      return;
    }
    
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/letters/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Force refresh the letters query and remove any references to the deleted letter
      refreshLetters();
      queryClient.removeQueries({ queryKey: ['letter', id] });
      
      // Clean up any localStorage references
      try {
        const storageKeys = Object.keys(localStorage);
        for (const key of storageKeys) {
          if (key.includes(id)) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        // Silent error handling
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete the letter. Please try again.');
    }
  };

  // Add a proper logout handler
  const handleLogout = () => {
    try {
      // First clear our auth state
      logout();
      
      // Clean up any sensitive localStorage data
      const keysToRemove = ['google_auth_code', 'oauth_state'];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Optional: Call API to invalidate server-side session
      fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset?returnTo=login`, { 
        method: 'GET',
        credentials: 'include'
      }).finally(() => {
        // Navigate to login page
        navigate('/login');
      });
    } catch (error) {
      console.error('Logout error:', error);
      // If there's an error, still try to navigate to login
      navigate('/login');
    }
  };

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4, minWidth: '100vw' }}>
      <Container maxWidth="lg">
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              My Letters
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
                sx={{ 
                  textTransform: 'none',
                  borderRadius: 1.5
                }}
              >
                New Letter
              </Button>
              <Button
                variant="outlined"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ 
                  textTransform: 'none',
                  borderRadius: 1.5
                }}
              >
                Logout
              </Button>
            </Box>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {letters?.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  No letters yet. Create your first letter to get started.
                </Typography>
              </Paper>
            </Grid>
          ) : (
            letters?.map((letter) => (
              <Grid item xs={12} sm={6} md={4} key={letter.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom noWrap>
                      {letter.title}
                    </Typography>
                    <Chip 
                      label={letter.isDraft ? 'Draft' : 'Published'} 
                      size="small" 
                      sx={{ mb: 2 }}
                      color={letter.isDraft ? 'default' : 'success'}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Last updated: {new Date(letter.updatedAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <Divider />
                  <CardActions sx={{ justifyContent: 'flex-start', px: 2, py: 1 }}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEdit(letter.id)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(letter.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard; 