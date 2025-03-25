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

    const letter = await prisma.letter.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!letter || !letter.user || letter.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to save this letter' });
    }

    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );

    oauth2Client.setCredentials({
      access_token: letter.user.accessToken,
      refresh_token: letter.user.refreshToken
    });

    const docs = google.docs({ version: 'v1', auth: oauth2Client });

    // Create a new document
    const doc = await docs.documents.create({
      requestBody: {
        title: letter.title
      }
    });

    if (!doc.data.documentId) {
      throw new Error('Failed to create document');
    }

    // Update the document content
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
    await prisma.letter.update({
      where: { id },
      data: { googleDocId: doc.data.documentId }
    });

    return res.json({ documentId: doc.data.documentId });
  } catch (error) {
    console.error('Save to Google Drive error:', error);
    return res.status(500).json({ message: 'Failed to save to Google Drive' });
  }
}; 