// get-token.js
import dotenv from 'dotenv';
import express from 'express';
import open from 'open';
import { google } from 'googleapis';

dotenv.config();

// ➊ Use DESKTOP_CLIENT_* and a localhost callback
const oAuth2Client = new google.auth.OAuth2(
  process.env.DESKTOP_CLIENT_ID,
  process.env.DESKTOP_CLIENT_SECRET,
  'http://localhost:3000/oauth2callback'
);

async function main() {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',      // request a refresh token
    scope: ['https://mail.google.com/'],
    prompt: 'consent'            // force refresh token every time
  });

  console.log('\nOpening browser to:\n', authUrl, '\n');
  await open(authUrl);

  // ➌ Tiny webserver to receive the code
  const app = express();
  const server = app.listen(3000, () =>
    console.log('Listening on http://localhost:3000/oauth2callback …')
  );

  app.get('/oauth2callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
      res.status(400).send('Missing code in query');
      return;
    }

    try {
      const { tokens } = await oAuth2Client.getToken(code);
      if (!tokens.refresh_token) {
        throw new Error('No refresh token. Did you set prompt: "consent"?');
      }
      console.log('\n✅ Refresh token:\n', tokens.refresh_token, '\n');
      res.send('Refresh token retrieved! Check your console.');
    } catch (err) {
      console.error('Error getting tokens:', err);
      res.status(500).send('Error: ' + err.message);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
