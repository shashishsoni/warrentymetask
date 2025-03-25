import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  Button,
  Paper,
  Typography,
  FormControlLabel,
  Switch,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  WarningAmber as WarningAmberIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import QuillEditor from '../components/QuillEditor';

interface Letter {
  id: string;
  title: string;
  content: string;
  isDraft: boolean;
}

const LetterEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isDraft, setIsDraft] = useState(true);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'info' | 'warning'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Validate the ID format to prevent unnecessary API calls
  const isValidId = useMemo(() => {
    if (!id) return true; // New letter, no ID
    
    // Support various ID formats:
    // - MongoDB ObjectID (24 hex chars)
    // - UUID (32-36 chars with possible hyphens)
    // - Other common ID formats
    return /^[0-9a-fA-F]{24}$/.test(id) || // MongoDB ObjectID
           /^[0-9a-fA-F-]{32,36}$/.test(id) || // UUID format
           /^[0-9a-zA-Z_-]{16,64}$/.test(id); // Generic alphanumeric ID
  }, [id]);

  // Fetch letter data if we have an ID
  const { data: letter, error: letterError, isLoading } = useQuery({
    queryKey: ['letter', id],
    queryFn: async () => {
      try {
        // Try to get the letter from the server
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/letters/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        return response.data;
      } catch (error) {
        console.error(`Error fetching letter ${id}:`, error);
        
        // Check for recoverable flag in the error response
        let isRecoverable = false;
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          isRecoverable = error.response?.data?.recoverable === true;
          console.log(`Letter ${id} not found. Recoverable: ${isRecoverable}`);
        }
        
        // Check for draft content in localStorage that might be recoverable
        const savedTitle = localStorage.getItem(`draft_title_${id}`);
        const savedContent = localStorage.getItem(`draft_content_${id}`);
        
        // If we have saved content, log it for debugging
        if (savedTitle || savedContent) {
          console.log(`Found saved content for letter ${id} that might be recoverable`);
          isRecoverable = true;
        }
        
        // Add recoverable info to the error for use in the UI
        if (isRecoverable && error instanceof Error) {
          (error as any).isRecoverable = true;
        }
        
        // Handle 403 errors (expired token)
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          alert('Your session has expired. Please log in again.');
          logout();
          setTimeout(() => navigate('/login'), 1000);
        }
        
        throw error;
      }
    },
    enabled: !!id && !!token,
  });

  useEffect(() => {
    if (letter) {
      // Type guard to ensure letter has the right properties
      if (typeof letter === 'object' && 
          'title' in letter && 
          'content' in letter && 
          'isDraft' in letter) {
        setTitle(letter.title);
        setContent(letter.content);
        setIsDraft(letter.isDraft);
      }
    }
  }, [letter]);

  // Enhance useEffect to navigate away if ID is invalid
  useEffect(() => {
    // Handle invalid IDs immediately
    if (id && !isValidId) {
      console.error(`Invalid letter ID format: ${id}`);
      setSnackbar({
        open: true,
        message: 'Invalid letter ID format. Redirecting to dashboard...',
        severity: 'error'
      });
      // Navigate back to dashboard after 2 seconds
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [id, isValidId, navigate]);

  // When editing existing letter, if letter not found, handle it gracefully
  useEffect(() => {
    if (id && letterError) {
      // Only log in development mode and not for 404 errors
      if (import.meta.env.DEV && 
          !(letterError instanceof Error && letterError.message.includes('not found'))) {
        console.error('Letter error:', letterError);
      }
      
      // Automatically navigate back after 3 seconds
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [id, letterError, navigate]);

  // Add effect to check for recovered content
  useEffect(() => {
    // Only run this for new letters (no id)
    if (!id) {
      // Check if we have recovered content in sessionStorage
      const recoveredTitle = sessionStorage.getItem('recovery_title');
      const recoveredContent = sessionStorage.getItem('recovery_content');
      
      // If we have recovered content, use it
      if (recoveredTitle || recoveredContent) {
        if (recoveredTitle) setTitle(recoveredTitle);
        if (recoveredContent) setContent(recoveredContent);
        
        // Clear the recovered content so it's not used again
        sessionStorage.removeItem('recovery_title');
        sessionStorage.removeItem('recovery_content');
        
        // Show notification that content was recovered
        setSnackbar({
          open: true,
          message: 'Content was recovered from a previous session',
          severity: 'info'
        });
      }
    }
  }, [id]);
  
  // Enable autosaving of drafts to localStorage
  useEffect(() => {
    // Only save if we have some content
    if (title || content) {
      const saveKey = id ? `draft_${id}` : 'draft_new';
      
      // Save current draft to localStorage
      localStorage.setItem(`${saveKey}_title`, title);
      localStorage.setItem(`${saveKey}_content`, content);
      
      // Also save with timestamp for letter-specific recovery
      if (id) {
        localStorage.setItem(`draft_title_${id}`, title);
        localStorage.setItem(`draft_content_${id}`, content);
      }
    }
  }, [title, content, id]);

  // Helper function to show instructions for enabling the API
  const showApiEnablingHelp = () => {
    const projectId = '531655483474'; // Hardcoded from the error message
    const apiConsoleUrl = `https://console.developers.google.com/apis/api/docs.googleapis.com/overview?project=${projectId}`;
    
    const helpMessage = 
      'To fix this error, the application administrator needs to enable the Google Docs API:\n\n' +
      '1. Go to Google Cloud Console: ' + apiConsoleUrl + '\n' +
      '2. Click "Enable API" button\n' +
      '3. Wait a few minutes for the changes to take effect\n\n' +
      'Would you like to open the Google Cloud Console? (This is only useful if you are the administrator)';
    
    if (confirm(helpMessage)) {
      window.open(apiConsoleUrl, '_blank');
    }
  };

  // Add token validation check before saving
  const saveMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; isDraft: boolean }) => {
      // Check if token is available
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      try {
        if (id) {
          return axios.put(
            `${API_URL}/api/letters/${id}`,
            data,
            { 
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              withCredentials: true // Include cookies if any
            }
          );
        }
        return axios.post(
          `${API_URL}/api/letters`,
          data,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            withCredentials: true // Include cookies if any
          }
        );
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          // Handle unauthorized error - token might be expired
          console.error('Authorization error - token might be expired');
          // Notify user to login again
          navigate('/login');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      setSnackbar({
        open: true,
        message: 'Letter saved successfully',
        severity: 'success'
      });
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Save error:', error);
      
      // Give more specific error message based on error type
      let errorMessage = 'Error saving letter';
      
      if (axios.isAxiosError(error)) {
        // Handle specific status codes
        if (error.response?.status === 403) {
          errorMessage = 'Your session has expired. Please log in again.';
          // Redirect to login after showing message
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response?.status === 400) {
          errorMessage = 'Invalid data. Please check your letter content.';
        } else if (error.response?.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  });

  // Also update the saveToDriveMutation with similar error handling
  const saveToDriveMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error('Authentication token is missing');
      }
      
      // Add validation that letter exists before attempting to save
      if (!letter) {
        throw new Error('Cannot save a non-existent letter to Google Drive');
      }
      
      return axios.post(
        `${API_URL}/api/letters/${id}/save-to-drive`,
        {},
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
    },
    onSuccess: (response) => {
      // Store the document ID for reference
      if (response.data?.documentId) {
        localStorage.setItem(`google_doc_${id}`, response.data.documentId);
      }
      
      setSnackbar({
        open: true,
        message: 'Letter saved to Google Drive successfully',
        severity: 'success'
      });
    },
    onError: (error) => {
      console.error('Google Drive save error:', error);
      
      // Give more specific error message based on error type
      let errorMessage = 'Error saving to Google Drive';
      
      if (axios.isAxiosError(error)) {
        // Handle specific status codes and error messages from the server
        const errorDetails = error.response?.data?.error || '';
        const errorDetailsMessage = error.response?.data?.details || '';
        
        if (error.response?.status === 403) {
          errorMessage = 'Your session has expired or you need to reconnect Google Drive. Please log in again.';
          // Redirect to login after showing message
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response?.status === 401) {
          if (errorDetails.includes('expired_token') || errorDetails.includes('invalid_grant')) {
            errorMessage = 'Your Google authorization has expired. Please log in again to reconnect your account.';
            setTimeout(() => navigate('/login'), 2000);
          } else if (errorDetails.includes('missing_token')) {
            errorMessage = 'Google Drive access is not available. Please reconnect your Google account.';
            setTimeout(() => navigate('/login'), 2000);
          } else {
            errorMessage = 'Authentication failed for Google Drive. Please try logging in again.';
          }
        } else if (error.response?.status === 503 || errorDetails === 'api_not_enabled') {
          // Special handling for Google Docs API not enabled error
          errorMessage = 'Google Docs API is not enabled for this project. Please contact the administrator.';
          // Show a more detailed explanation in the console for developers
          console.error('Google Docs API Error Details:', errorDetailsMessage);
          
          // Show help for enabling the API
          showApiEnablingHelp();
          
          // Save letter locally as a fallback
          const saveLocallyInstead = confirm(
            'Would you like to save your letter locally instead?'
          );
          
          if (saveLocallyInstead) {
            handleSave();
          }
        } else if (error.response?.status === 400) {
          errorMessage = 'Invalid request. Please try again.';
        } else if (error.response?.status === 500) {
          if (errorDetailsMessage.includes('API has not been used') || 
              errorDetailsMessage.includes('it is disabled') ||
              (error.response?.data?.message && error.response?.data?.message.includes('Google Docs API')) ||
              (typeof error.response?.data === 'string' && error.response?.data.includes('API has not been used'))) {
            // Alternative detection of API not enabled error
            errorMessage = 'Google Docs API is not enabled for this project. Please contact the administrator.';
            console.error('Google Docs API Error Details:', errorDetailsMessage || error.response?.data);
            
            // Show help for enabling the API
            showApiEnablingHelp();
            
            // Save letter locally as a fallback
            const saveLocallyInstead = confirm(
              'Would you like to save your letter locally instead?'
            );
            
            if (saveLocallyInstead) {
              handleSave();
            }
          } else if (errorDetails) {
            errorMessage = `Server error: ${errorDetails}. Please try again later.`;
          } else {
            errorMessage = 'Server error accessing Google Drive. Please try again later.';
          }
        } else if (error.response?.status === 404) {
          errorMessage = 'This letter cannot be found on the server. Please save it locally first.';
          // Prompt to save locally
          if (confirm(`${errorMessage} Would you like to save a local copy now?`)) {
            handleSave();
          }
        }
      } else if (error instanceof Error) {
        // For non-axios errors, use the error message directly
        if (error.message.includes('non-existent letter')) {
          errorMessage = 'You need to save this letter before it can be saved to Google Drive.';
          if (confirm('You need to save this letter first. Would you like to save it now?')) {
            handleSave();
          }
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  });

  const handleSave = () => {
    // Validate that we have the necessary data
    if (!title.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a title',
        severity: 'error'
      });
      return;
    }
    
    // Check if we have a valid authentication token
    if (!token) {
      setSnackbar({
        open: true,
        message: 'Your session has expired. Please log in again.',
        severity: 'error'
      });
      // Redirect to login after showing the message
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    // Proceed with saving
    saveMutation.mutate({ title, content, isDraft });
  };

  const handleSaveToDrive = () => {
    // Make sure we have an id and letter before trying to save to Drive
    if (!id) {
      setSnackbar({
        open: true,
        message: 'You need to save the letter locally before saving to Google Drive',
        severity: 'warning'
      });
      
      // Prompt to save locally first
      if (confirm('Would you like to save the letter locally first?')) {
        handleSave();
      }
      return;
    }
    
    // Check if the letter exists by making sure we have data
    if (!letter && id) {
      // Letter ID exists but we don't have the letter data - might be a 404 error
      setSnackbar({
        open: true,
        message: 'This letter may not exist. Please try saving locally first.',
        severity: 'warning'
      });
      
      // Prompt to save as a new letter
      if (confirm('This letter may not exist. Would you like to save as a new letter?')) {
        // Clear the ID and save as new
        navigate('/editor');
      }
      return;
    }
    
    // Check if we have a valid token
    if (!token) {
      setSnackbar({
        open: true,
        message: 'Your session has expired. Please log in again.',
        severity: 'error'
      });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    // All checks pass, proceed with saving to Drive
    saveToDriveMutation.mutate();
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
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

  if (letterError) {
    // Check if this error is for a potentially recoverable letter
    const isRecoverable = (letterError as any)?.isRecoverable === true || (
      id && id.match(/^[0-9a-f]{24}$/) && (
        localStorage.getItem(`draft_title_${id}`) || 
        localStorage.getItem(`draft_content_${id}`)
      )
    );
    
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', p: 3 }}>
        <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
          <WarningAmberIcon color="warning" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Letter Not Found
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {!id || !id.match(/^[0-9a-f]{24}$/) 
              ? "The letter ID is invalid. Please check the URL and try again."
              : isRecoverable
                ? "This letter was not found, but we may be able to recover some content."
                : "This letter may have been deleted or never existed."}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/dashboard')}
              startIcon={<ArrowBackIcon />}
            >
              Return to Dashboard
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => {
                navigate('/editor');
              }}
              startIcon={<AddCircleOutlineIcon />}
            >
              Create New Letter
            </Button>
            {isRecoverable && (
              <Button 
                variant="outlined" 
                color="secondary"
                onClick={() => {
                  // Check for draft content in localStorage
                  const savedTitle = localStorage.getItem(`draft_title_${id}`);
                  const savedContent = localStorage.getItem(`draft_content_${id}`);
                  
                  if (savedTitle || savedContent) {
                    // Store recovered content in sessionStorage for the new letter
                    if (savedTitle) sessionStorage.setItem('recovery_title', savedTitle);
                    if (savedContent) sessionStorage.setItem('recovery_content', savedContent);
                    
                    // Show success message and navigate to create a new letter
                    alert('Content was found and will be used to create a new letter!');
                    navigate('/editor');
                  } else {
                    alert('No saved content was found for this letter.');
                  }
                }}
                startIcon={<RestoreIcon />}
              >
                Recover Saved Content
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {id ? 'Edit Letter' : 'New Letter'}
          </Typography>
          <Button
            color="inherit"
            startIcon={<CloudUploadIcon />}
            onClick={handleSaveToDrive}
            disabled={!id || saveToDriveMutation.isPending}
            sx={{ mx: 1 }}
          >
            {saveToDriveMutation.isPending ? 'Saving...' : 'Save to Drive'}
          </Button>
          <Button
            color="inherit"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </Toolbar>
      </AppBar>

      <Box 
        sx={{ 
          flexGrow: 1, 
          width: '100%', 
          p: 2, 
          backgroundColor: '#f5f5f5',
          overflow: 'auto'
        }}
      >
        <Paper 
          sx={{ 
            p: 3, 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            mx: 'auto',
            maxWidth: '1400px',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter letter title"
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={isDraft}
                onChange={(e) => setIsDraft(e.target.checked)}
              />
            }
            label="Draft"
            sx={{ mb: 2 }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <QuillEditor
              value={content}
              onChange={setContent}
              style={{ height: '100%' }}
            />
          </Box>
        </Paper>
      </Box>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={5000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LetterEditor; 