import { google } from 'googleapis';
import { db } from './db';

export async function getGoogleOAuth2Client(userId: string) {
  const tokenRecord = await db.calendarToken.findUnique({
    where: { userId },
  });

  if (!tokenRecord) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  );

  oauth2Client.setCredentials({
    access_token: tokenRecord.accessToken,
    refresh_token: tokenRecord.refreshToken || undefined,
    expiry_date: tokenRecord.expiresAt ? tokenRecord.expiresAt.getTime() : undefined,
  });

  // Check if token needs refresh
  const isExpired = tokenRecord.expiresAt && tokenRecord.expiresAt.getTime() < Date.now();
  if (isExpired && tokenRecord.refreshToken) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update database
      await db.calendarToken.update({
        where: { userId },
        data: {
          accessToken: credentials.access_token!,
          expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
          refreshToken: credentials.refresh_token || tokenRecord.refreshToken, // keep old if not returned
        },
      });

      oauth2Client.setCredentials(credentials);
    } catch (error) {
      console.error('Failed to refresh Google access token:', error);
      return null;
    }
  }

  return oauth2Client;
}
