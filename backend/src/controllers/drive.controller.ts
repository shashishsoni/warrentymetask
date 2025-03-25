import { Request, Response } from 'express';
import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const drive = google.drive('v3');

export const saveToDrive = async (req: Request, res: Response) => {
  try {
    const { content, title } = req.body;
    const userId = (req as any).user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { accessToken: true }
    });

    if (!user?.accessToken) {
      return res.status(401).json({ message: 'No access token found' });
    }

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );

    const fileMetadata = {
      name: title,
      mimeType: 'application/vnd.google-apps.document',
    };

    const file = await drive.files.create({
      auth,
      requestBody: fileMetadata,
      media: {
        mimeType: 'text/plain',
        body: content,
      },
    });

    return res.json({
      id: file.data.id,
      name: file.data.name,
      webViewLink: file.data.webViewLink,
    });
  } catch (error) {
    console.error('Error saving to Google Drive:', error);
    return res.status(500).json({ message: 'Failed to save to Google Drive' });
  }
};

export const listDriveFiles = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { accessToken: true }
    });

    if (!user?.accessToken) {
      return res.status(401).json({ message: 'No access token found' });
    }

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );
    
    auth.setCredentials({ access_token: user.accessToken });

    const response = await drive.files.list({
      auth,
      q: "mimeType='application/vnd.google-apps.document'",
      fields: 'files(id, name, mimeType, webViewLink, createdTime)',
      orderBy: 'createdTime desc',
    });

    return res.json(response.data.files);
  } catch (error) {
    console.error('Error listing files:', error);
    return res.status(500).json({ message: 'Failed to list files' });
  }
};

export const getDriveFileContent = async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const userId = (req as any).user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { accessToken: true }
    });

    if (!user?.accessToken) {
      return res.status(401).json({ message: 'No access token found' });
    }

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );
    
    auth.setCredentials({ access_token: user.accessToken });

    const response = await drive.files.export({
      auth,
      fileId,
      mimeType: 'text/plain',
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Error getting file content:', error);
    return res.status(500).json({ message: 'Failed to get file content' });
  }
}; 