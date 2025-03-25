import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Typography, Paper, CircularProgress, Divider } from '@mui/material';
import { Google as GoogleIcon, Email as EmailIcon } from '@mui/icons-material';
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
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        overflow: 'hidden',
        margin: 0,
        padding: 0
      }}
    >
      <Container 
        maxWidth="sm"
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          width: '100%',
          padding: { xs: 2, sm: 3 }
        }}
      >
        <Paper
          elevation={8}
          sx={{
            padding: { xs: 3, sm: 5 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            borderRadius: 3,
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3
          }}>
            <EmailIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography 
              component="h1" 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Letter Writer
            </Typography>
          </Box>
          
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Create professional letters and save to Google Drive
          </Typography>
          
          <Divider sx={{ width: '80%', mb: 4 }} />
          
          <Box sx={{ width: '100%' }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
              disabled={loading}
              onClick={handleGoogleLogin}
              sx={{ 
                py: 1.5,
                fontSize: '1rem', 
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                background: loading ? 'primary.main' : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                '&:hover': {
                  boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
                }
              }}
            >
              Sign in with Google
            </Button>
          </Box>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
            Secure authentication with Google
          </Typography>
        </Paper>
        
        <Box sx={{ mt: 3, textAlign: 'center', maxWidth: '90%' }}>
          <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.8 }}>
            Trouble signing in? Try disabling ad-blockers or privacy extensions,
            or use an incognito window.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Login; 