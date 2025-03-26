import { Request, Response } from 'express';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Configure Google OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback';
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/drive.file'  // For Google Drive access
];

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// Google OAuth authentication
export const googleAuth = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Generate the url that will be used for authorization
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'  // Force to always show the consent screen
    });
    
    res.json({ url: authUrl });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to initialize Google authentication'
    });
  }
};

// Google OAuth callback handler
export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    // Handle the code from Google OAuth
    const code = req.query.code as string || req.body.code as string;
    
    if (!code) {
      res.status(400).json({ message: 'Authorization code is required' });
      return;
    }
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Get user info
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });
    
    const { data } = await oauth2.userinfo.get();
    
    if (!data.email) {
      res.status(400).json({ message: 'Email not provided by Google' });
      return;
    }
    
    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email: data.email }
    });
    
    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name || data.email.split('@')[0],
          googleId: data.id ? data.id.toString() : '',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined
        }
      });
    } else if (!user.googleId) {
      // Update existing user with Google ID
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: data.id ? data.id.toString() : '',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined
        }
      });
    } else {
      // Update tokens for existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined
        }
      });
    }
    
    // Create JWT token and pass it to the frontend
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Check if the request is from the frontend callback page or a direct API call
    const isApiCall = req.headers['accept']?.includes('application/json');
    
    if (isApiCall) {
      // If it's an API call, return JSON response
      res.json({
        message: 'Google authentication successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          },
          token: accessToken
        }
      });
    } else {
      // If it's a browser redirect, redirect to the frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/google/callback?token=${accessToken}`);
    }
  } catch (error) {
    console.error('Google callback error:', error);
    res.status(401).json({
      message: error instanceof Error ? error.message : 'Google authentication failed'
    });
  }
};

// Get current authenticated user
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name
    });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Failed to retrieve user'
    });
  }
};

// Reset OAuth state (for development/testing purposes)
export const resetOAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    // Revoke the token
    if (oauth2Client.credentials.access_token) {
      await oauth2Client.revokeToken(oauth2Client.credentials.access_token as string);
    }
    
    // Clear credentials
    oauth2Client.credentials = {};
    
    // Check if there's a returnTo parameter
    const returnTo = req.query.returnTo as string;
    
    if (returnTo === 'login') {
      // Generate a new auth URL for Google login
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent'  // Force to always show the consent screen
      });
      
      // Redirect to Google auth
      res.redirect(authUrl);
    } else {
      // Default response if no returnTo or unknown value
      res.json({ message: 'OAuth state reset successfully' });
    }
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to reset OAuth state'
    });
  }
};