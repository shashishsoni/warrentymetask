import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LetterEditor from './pages/LetterEditor';
import GoogleCallback from './pages/GoogleCallback';
import PrivateRoute from './components/PrivateRoute';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/editor/:id?" element={<LetterEditor />} />
          </Route>
          <Route path="/" element={<Login />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
