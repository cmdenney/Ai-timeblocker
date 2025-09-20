# Google Calendar API Setup Guide

This guide walks you through setting up Google Calendar API integration for AI Timeblocker.

## Prerequisites

- Google Cloud Platform account
- Domain verification (for production)
- SSL certificate (for webhook endpoints)

## Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create New Project**
   - Click "Select a project" dropdown
   - Click "New Project"
   - Enter project name: `AI Timeblocker`
   - Click "Create"

3. **Select the Project**
   - Ensure the new project is selected in the dropdown

## Step 2: Enable Google Calendar API

1. **Navigate to APIs & Services**
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click on "Google Calendar API"
   - Click "Enable"

2. **Enable Additional APIs** (Optional but recommended)
   - Google Drive API (for file attachments)
   - Google People API (for contact integration)

## Step 3: Configure OAuth 2.0 Credentials

1. **Go to Credentials**
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"

2. **Configure OAuth Consent Screen**
   - Click "Configure Consent Screen"
   - Choose "External" user type
   - Fill in required fields:
     - App name: `AI Timeblocker`
     - User support email: your email
     - Developer contact: your email
   - Add scopes:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Save and continue

3. **Create OAuth 2.0 Client ID**
   - Application type: "Web application"
   - Name: `AI Timeblocker Web Client`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)
   - Click "Create"

4. **Download Credentials**
   - Download the JSON file
   - Rename to `google-credentials.json`
   - Store securely (never commit to version control)

## Step 4: Configure Environment Variables

Add to your `.env.local`:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# Google Calendar API
GOOGLE_CALENDAR_API_KEY=your-api-key-here
GOOGLE_WEBHOOK_SECRET=your-webhook-secret-here

# Production URLs (update for production)
GOOGLE_WEBHOOK_URL=https://yourdomain.com/api/calendar/webhook
```

## Step 5: Set Up Webhook Notifications

1. **Enable Calendar API Push Notifications**
   - Go to Google Cloud Console
   - Navigate to "APIs & Services" > "Credentials"
   - Create API Key (if not already created)
   - Restrict the key to Google Calendar API

2. **Configure Webhook Endpoint**
   - Ensure your webhook endpoint is accessible via HTTPS
   - The endpoint should handle POST requests from Google
   - Implement proper authentication and validation

## Step 6: Domain Verification (Production Only)

1. **Go to OAuth Consent Screen**
   - Navigate to "APIs & Services" > "OAuth consent screen"
   - Add your production domain to "Authorized domains"
   - Complete domain verification process

2. **Update Redirect URIs**
   - Add production redirect URI
   - Remove development URI for production

## Step 7: Test the Integration

1. **Test OAuth Flow**
   ```bash
   npm run dev
   ```
   - Visit `/auth/signin`
   - Click "Sign in with Google"
   - Complete OAuth flow

2. **Test Calendar API**
   - Check if events are being created
   - Verify webhook notifications
   - Test bidirectional sync

## Security Considerations

### API Key Security
- Restrict API keys to specific APIs
- Use IP restrictions for production
- Rotate keys regularly
- Monitor usage in Google Cloud Console

### OAuth Security
- Use HTTPS for all redirect URIs
- Implement CSRF protection
- Validate state parameter
- Store tokens securely

### Webhook Security
- Verify webhook signatures
- Implement rate limiting
- Use HTTPS endpoints
- Validate request origin

## Troubleshooting

### Common Issues

1. **OAuth Consent Screen Issues**
   - Ensure all required fields are filled
   - Verify domain ownership
   - Check scopes are properly configured

2. **Redirect URI Mismatch**
   - Verify URIs match exactly
   - Check for trailing slashes
   - Ensure protocol (http/https) matches

3. **API Quota Exceeded**
   - Check quota limits in Google Cloud Console
   - Implement exponential backoff
   - Consider request batching

4. **Webhook Not Working**
   - Verify HTTPS endpoint
   - Check webhook secret configuration
   - Test with Google's webhook testing tool

### Debug Mode

Enable debug logging:
```env
GOOGLE_DEBUG=true
GOOGLE_LOG_LEVEL=debug
```

### Testing Webhooks Locally

Use ngrok for local webhook testing:
```bash
# Install ngrok
npm install -g ngrok

# Start your app
npm run dev

# In another terminal, expose local port
ngrok http 3000

# Use the ngrok URL for webhook configuration
```

## Production Deployment

### Environment Variables
```env
# Production configuration
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/callback/google
GOOGLE_WEBHOOK_URL=https://yourdomain.com/api/calendar/webhook
GOOGLE_WEBHOOK_SECRET=your-production-webhook-secret
```

### SSL Certificate
- Ensure valid SSL certificate
- Use Let's Encrypt for free certificates
- Configure automatic renewal

### Monitoring
- Set up Google Cloud Monitoring
- Monitor API quota usage
- Track webhook delivery success
- Set up alerts for failures

## Support

For additional help:
- [Google Calendar API Documentation](https://developers.google.com/calendar)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
