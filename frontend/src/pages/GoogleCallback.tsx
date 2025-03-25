import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography, Container } from '@mui/material';
import { useAuth } from '../hooks/useAuth';

const GoogleCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleGoogleSuccess, setAuthToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const hasProcessed = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const processCallback = async () => {
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      try {
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const error = params.get('error');
        const token = params.get('token');
        const details = params.get('details');

        if (token) {
          setAuthToken(token);
          if (isMounted) {
            navigate('/dashboard', { replace: true });
          }
          return;
        }

        if (error) {
          console.error(`Auth error: ${error}, details: ${details}`);
          if (isMounted) {
            setError(`Google OAuth error: ${error}`);
            setIsProcessing(false);
          }
          return;
        }

        if (!code) {
          if (isMounted) {
            setError('No authorization code received');
            setIsProcessing(false);
          }
          return;
        }

        const success = await handleGoogleSuccess(code);
        if (isMounted) {
          if (success) {
            navigate('/dashboard', { replace: true });
          } else {
            setError('Authentication failed');
            setIsProcessing(false);
          }
        }
      } catch (error) {
        console.error('Error processing Google callback:', error);
        if (isMounted) {
          setError('Failed to process Google authentication');
          setIsProcessing(false);
        }
      }
    };

    processCallback();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '50vh',
        }}
      >
        {error ? (
          <Typography color="error" variant="h6" align="center">
            {error}
          </Typography>
        ) : isProcessing ? (
          <>
            <CircularProgress />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Completing sign-in...
            </Typography>
          </>
        ) : (
          <Typography variant="h6" align="center">
            Authentication complete!
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default GoogleCallback; 