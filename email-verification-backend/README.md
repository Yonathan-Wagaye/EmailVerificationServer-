# Email Verification Server with MailTrap

This is a Node.js Express server that handles email verification using MailTrap.io for sending emails.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create or update your `.env` file with the following variables:

```env
PORT=3001
EMAIL_FROM=noreply@easyeyes.app
MAILTRAP_TOKEN=your_mailtrap_token_here
FRONTEND_ORIGIN=http://localhost:3000
```

### 3. Get MailTrap Token
1. Sign up at [mailtrap.io](https://mailtrap.io)
2. Go to your project/inbox
3. Navigate to Settings → API Tokens
4. Create a new token with proper permissions
5. Copy the token and add it to your `.env` file

### 4. Verify Your Domain
1. In MailTrap, go to Settings → Sending Domains
2. Add your domain (e.g., `easyeyes.app`)
3. Follow the DNS verification steps
4. Once verified, you can use emails like `noreply@easyeyes.app`

### 5. Start the Server
```bash
node server.js
```

The server will run on `http://localhost:3001`

## API Endpoints

### POST /send-code
Sends a verification code to the provided email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Verification code sent"
}
```

### POST /verify-code
Verifies the code sent to the email.

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "verified": true
}
```

## Features

- ✅ 6-digit verification codes
- ✅ 10-minute expiration
- ✅ One-time use codes
- ✅ Professional email templates
- ✅ CORS enabled for frontend integration
- ✅ Error handling and logging

## Frontend Integration

The frontend React app should be configured to make API calls to `http://localhost:3001` for the email verification endpoints.

