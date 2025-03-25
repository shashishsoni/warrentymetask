import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Box, CircularProgress, Typography } from '@mui/material';

const PrivateRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  // Use an effect to delay the redirect decision
  useEffect(() => {
    // Only set redirect flag once loading is complete and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      // Small timeout to prevent rapid redirect cycles
      const timer = setTimeout(() => {
        setShouldRedirect(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated]);

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Checking authentication...
        </Typography>
      </Box>
    );
  }

  // Only redirect once loading is complete and the redirect flag is set
  if (shouldRedirect) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the protected route
  return isAuthenticated ? <Outlet /> : null;
};

export default PrivateRoute; 