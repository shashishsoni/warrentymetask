import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Letter {
  id: string;
  title: string;
  content: string;
  isDraft: boolean;
}

const LetterEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isDraft, setIsDraft] = useState(true);

  // Fetch letter if editing
  const { data: letter, isLoading } = useQuery<Letter>({
    queryKey: ['letter', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/letters/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (letter) {
      setTitle(letter.title);
      setContent(letter.content);
      setIsDraft(letter.isDraft);
    }
  }, [letter]);

  const saveMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; isDraft: boolean }) => {
      if (id) {
        return axios.put(
          `${process.env.REACT_APP_API_URL}/api/letters/${id}`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      return axios.post(
        `${process.env.REACT_APP_API_URL}/api/letters`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      navigate('/');
    },
  });

  const saveToDriveMutation = useMutation({
    mutationFn: async () => {
      return axios.post(
        `${process.env.REACT_APP_API_URL}/api/letters/${id}/save-to-drive`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      // Handle success (e.g., show notification)
    },
  });

  const handleSave = () => {
    saveMutation.mutate({ title, content, isDraft });
  };

  const handleSaveToDrive = () => {
    if (id) {
      saveToDriveMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/')}
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
            disabled={!id}
          >
            Save to Drive
          </Button>
          <Button
            color="inherit"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            <ReactQuill
              value={content}
              onChange={setContent}
              style={{ height: 'calc(100% - 42px)' }}
            />
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LetterEditor; 