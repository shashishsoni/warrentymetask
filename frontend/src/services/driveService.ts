import axios from 'axios';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  createdTime: string;
}

export const driveService = {
  async saveLetter(content: string, title: string, accessToken: string): Promise<DriveFile> {
    try {
      // Create a new Google Doc
      const response = await axios.post(
        `${DRIVE_API_URL}/files`,
        {
          name: title,
          mimeType: 'application/vnd.google-apps.document',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const fileId = response.data.id;

      // Update the document content
      await axios.patch(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        {
          content: content,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error saving to Google Drive:', error);
      throw error;
    }
  },

  async listLetters(accessToken: string): Promise<DriveFile[]> {
    try {
      const response = await axios.get(
        `${DRIVE_API_URL}/files`,
        {
          params: {
            q: "mimeType='application/vnd.google-apps.document'",
            fields: 'files(id, name, mimeType, webViewLink, createdTime)',
            orderBy: 'createdTime desc',
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data.files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  },

  async getLetterContent(fileId: string, accessToken: string): Promise<string> {
    try {
      const response = await axios.get(
        `${DRIVE_API_URL}/files/${fileId}/export`,
        {
          params: {
            mimeType: 'text/plain',
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting file content:', error);
      throw error;
    }
  },
}; 