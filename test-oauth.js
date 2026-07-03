const { google } = require('googleapis');
const oauth2Client = new google.auth.OAuth2(
  "test_client_id",
  "test_client_secret",
  "https://brainrot-automator.onrender.com/api/oauth/youtube/callback"
);
const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly'
  ],
  state: "test_state",
  prompt: 'consent'
});
console.log(url);
