import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Typography, Paper, CircularProgress } from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  const handleGoogleLogin = () => {
    setLoading(true);
    
    // Generate unique state to prevent CSRF
    const state = `state-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem('oauth_state', state);
    
    // Clear any existing sessions
    const logoutFirst = true;
    
    if (logoutFirst) {
      // Method 1: Visit reset route first, then continue
      window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/reset?returnTo=login`;
    } else {
      // Method 2: Direct OAuth flow
      const scopes = ['email', 'profile', 'https://www.googleapis.com/auth/drive.file'].join(' ');
      const redirectUri = `${import.meta.env.VITE_API_URL}/api/auth/google/callback`;
      
      const params = new URLSearchParams({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scopes,
        access_type: 'offline',
        prompt: 'select_account consent',
        include_granted_scopes: 'true',
        state
      });

      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5" gutterBottom>
            Welcome to Letter Writer
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Sign in to create and manage your letters
          </Typography>
          <Box sx={{ width: '100%' }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
              disabled={loading}
              onClick={handleGoogleLogin}
              sx={{ py: 1.5 }}
            >
              Sign in with Google
            </Button>
          </Box>
        </Paper>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary" align="center">
          Trouble signing in? Try disabling ad-blockers or privacy extensions,
          or use an incognito window.
        </Typography>
      </Box>
    </Container>
  );
};

export default Login; 