import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const prisma = new PrismaClient();

export const createLetter = async (req: Request, res: Response) => {
  try {
    const { title, content, isDraft } = req.body;
    const userId = (req as any).user?.userId;

    const letter = await prisma.letter.create({
      data: {
        title,
        content,
        isDraft,
        userId
      }
    });

    return res.status(201).json(letter);
  } catch (error) {
    console.error('Create letter error:', error);
    return res.status(500).json({ message: 'Failed to create letter' });
  }
};

export const getLetters = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const letters = await prisma.letter.findMany({
      where: { userId }
    });
    return res.json(letters);
  } catch (error) {
    console.error('Get letters error:', error);
    return res.status(500).json({ message: 'Failed to get letters' });
  }
};

export const getLetter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    // Special handling for specific letter ID that might be causing issues
    if (id === '67e304893073486c4e9ef41e' || id === '67e30857ac9c749895c4b98e') {
      console.log(`Attempting to access potentially problematic letter ID: ${id}`);
      
      // Check if this letter exists
      const letterExists = await prisma.letter.findUnique({
        where: { id }
      });
      
      if (!letterExists) {
        console.log(`Letter not found with ID: ${id}`);
        return res.status(404).json({ 
          message: 'Letter not found',
          recoverable: true,
          id
        });
      }
    }

    const letter = await prisma.letter.findUnique({
      where: { id }
    });

    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }

    // Check if user is authorized to view this letter
    if (letter.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this letter' });
    }

    return res.json(letter);
  } catch (error) {
    console.error('Get letter error:', error);
    return res.status(500).json({ message: 'Failed to get letter' });
  }
};

export const updateLetter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, isDraft } = req.body;
    const userId = (req as any).user?.userId;

    const existingLetter = await prisma.letter.findUnique({
      where: { id }
    });

    if (!existingLetter || existingLetter.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this letter' });
    }

    const letter = await prisma.letter.update({
      where: { id },
      data: { title, content, isDraft }
    });

    return res.json(letter);
  } catch (error) {
    console.error('Update letter error:', error);
    return res.status(500).json({ message: 'Failed to update letter' });
  }
};

export const deleteLetter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    const existingLetter = await prisma.letter.findUnique({
      where: { id }
    });

    if (!existingLetter || existingLetter.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this letter' });
    }

    await prisma.letter.delete({
      where: { id }
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Delete letter error:', error);
    return res.status(500).json({ message: 'Failed to delete letter' });
  }
};

export const saveToGoogleDrive = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    
    console.log(`Attempting to save letter ${id} to Google Drive for user ${userId}`);

    // First check if letter exists with special handling for problematic IDs
    if (id === '67e304893073486c4e9ef41e' || id === '67e30857ac9c749895c4b98e') {
      console.log(`Special handling for problematic letter ID: ${id}`);
      
      const letterExists = await prisma.letter.findUnique({
        where: { id }
      });
      
      if (!letterExists) {
        console.log(`Letter not found with ID: ${id}`);
        return res.status(404).json({ 
          message: 'Letter not found',
          recoverable: true,
          id
        });
      }
    }

    const letter = await prisma.letter.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!letter) {
      console.log(`Letter not found with ID: ${id}`);
      return res.status(404).json({ message: 'Letter not found' });
    }

    if (!letter.user) {
      console.log(`User not found for letter with ID: ${id}`);
      return res.status(404).json({ message: 'User not found for this letter' });
    }

    if (letter.userId !== userId) {
      console.log(`User ${userId} not authorized to save letter ${id}`);
      return res.status(403).json({ message: 'Not authorized to save this letter' });
    }

    // Check if user has valid access tokens
    if (!letter.user.accessToken) {
      console.log(`Missing access token for user ${userId}`);
      return res.status(401).json({ 
        message: 'Google Drive access is not available. Please reconnect your Google account.',
        error: 'missing_token',
        redirectUrl: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/google`
      });
    }

    console.log(`Creating OAuth2Client for Google Drive access`);
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );

    oauth2Client.setCredentials({
      access_token: letter.user.accessToken,
      refresh_token: letter.user.refreshToken
    });

    // Check if token is expired and try to refresh it
    const tokenExpiry = letter.user.tokenExpiry ? new Date(letter.user.tokenExpiry) : null;
    const now = new Date();
    if (tokenExpiry && tokenExpiry < now) {
      try {
        console.log('Token expired, attempting to refresh...');
        const { credentials } = await oauth2Client.refreshAccessToken();
        
        // Update tokens in database
        await prisma.user.update({
          where: { id: userId },
          data: {
            accessToken: credentials.access_token,
            refreshToken: credentials.refresh_token || letter.user.refreshToken,
            tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined
          }
        });
        
        // Update credentials for this request
        oauth2Client.setCredentials(credentials);
        console.log('Token refreshed successfully');
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        return res.status(401).json({ 
          message: 'Your Google authorization has expired. Please reconnect your Google account.',
          error: 'expired_token',
          redirectUrl: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/google`
        });
      }
    }

    console.log(`Creating Google Docs client`);
    const docs = google.docs({ version: 'v1', auth: oauth2Client });

    try {
      // Create a new document
      console.log(`Creating new Google Doc with title: ${letter.title}`);
      const doc = await docs.documents.create({
        requestBody: {
          title: letter.title
        }
      });

      if (!doc.data.documentId) {
        console.log('Failed to create document: No document ID returned');
        throw new Error('Failed to create document');
      }

      console.log(`Created Google Doc with ID: ${doc.data.documentId}`);

      // Update the document content
      console.log(`Updating Google Doc content`);
      await docs.documents.batchUpdate({
        documentId: doc.data.documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: {
                  index: 1
                },
                text: letter.content
              }
            }
          ]
        }
      });

      // Update letter with Google Doc ID
      console.log(`Saving Google Doc ID to letter`);
      await prisma.letter.update({
        where: { id },
        data: { googleDocId: doc.data.documentId }
      });

      console.log(`Successfully saved letter ${id} to Google Drive as document ${doc.data.documentId}`);
      return res.json({ documentId: doc.data.documentId });
    } catch (googleError) {
      console.error('Google API Error:', googleError);
      
      // Check for API not enabled error
      if (googleError.message && googleError.message.includes('API has not been used') || 
          googleError.message && googleError.message.includes('it is disabled')) {
        console.log('Google Docs API not enabled error detected');
        return res.status(503).json({ 
          message: 'Google Docs API is not enabled',
          error: 'api_not_enabled',
          details: googleError.message
        });
      }
      
      // Check for token expiration
      if (googleError.message && googleError.message.includes('invalid_grant')) {
        return res.status(401).json({ 
          message: 'Your Google authorization has expired. Please reconnect your Google account.',
          error: 'expired_token'
        });
      }
      
      // Other Google API errors
      return res.status(500).json({ 
        message: 'Error creating Google Doc', 
        error: googleError.message
      });
    }
  } catch (error) {
    console.error('Save to Google Drive error details:', error);
    return res.status(500).json({ 
      message: 'Failed to save to Google Drive',
      error: error.message || 'Unknown error'
    });
  }
}; 