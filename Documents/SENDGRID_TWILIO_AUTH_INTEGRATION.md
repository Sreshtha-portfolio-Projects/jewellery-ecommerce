# SendGrid, Twilio, Google Auth, 2FA & Card Storage Integration Guide

**Aldorado Jewells – Complete Authentication & Communication Setup**

This document provides a comprehensive guide for integrating SendGrid (email), Twilio (SMS/OTP), Google OAuth, Two-Factor Authentication (2FA), OTP-based login, and secure card storage (India-compliant) into the Aldorado Jewells e-commerce platform.

---

## SECTION 1: OVERVIEW

### Why These Integrations?

**SendGrid (Email Service)**:
- **Reliable Email Delivery**: Professional email service with high deliverability rates
- **Transactional Emails**: Order confirmations, password resets, OTP emails
- **Marketing Emails**: Newsletters, promotions, abandoned cart recovery
- **Analytics**: Track email opens, clicks, bounces
- **Templates**: Pre-built email templates for common scenarios
- **Scalable**: Handles high email volumes without infrastructure concerns

**Twilio (SMS/OTP Service)**:
- **SMS Delivery**: Send OTP codes, order updates, alerts via SMS
- **OTP Verification**: Secure two-factor authentication
- **Global Reach**: Works in India and internationally
- **Reliable**: High delivery rates, real-time status updates
- **API-First**: Easy integration with REST APIs
- **Cost-Effective**: Pay-per-message pricing

**Google OAuth (Enhanced)**:
- **Social Login**: Users can sign in with Google account
- **Reduced Friction**: No need to create new account
- **Trust**: Users trust Google's security
- **Profile Data**: Automatically get name, email, profile picture
- **Security**: Google handles password security

**Two-Factor Authentication (2FA)**:
- **Enhanced Security**: Adds extra layer beyond password
- **Protection**: Prevents unauthorized access even if password is compromised
- **Compliance**: Meets security best practices and regulations
- **User Control**: Users can enable/disable 2FA
- **Multiple Methods**: SMS OTP, Email OTP, Authenticator apps

**OTP-Based Login**:
- **Passwordless**: Users can login without password using OTP
- **Convenience**: No need to remember passwords
- **Security**: OTP expires quickly, reducing risk
- **Mobile-First**: Ideal for mobile users
- **Reduced Support**: Fewer password reset requests

**Card Storage (India-Compliant)**:
- **Faster Checkout**: Users don't need to re-enter card details
- **Better UX**: One-click payments for returning customers
- **Compliance**: Follows RBI and PCI-DSS regulations
- **Tokenization**: Cards stored as tokens, not actual numbers
- **Security**: Meets Indian government compliance requirements

### Integration Order

**Recommended Sequence**:
1. **SendGrid** (Email service) - Foundation for notifications
2. **Twilio** (SMS service) - Foundation for OTP
3. **Google OAuth** (Enhancement) - Social login
4. **OTP Login** (Passwordless) - Alternative login method
5. **2FA** (Security) - Enhanced security for accounts
6. **Card Storage** (Payment) - After payment integration is complete

---

## SECTION 2: SENDGRID INTEGRATION

### Step 1: Create SendGrid Account

1. Go to [https://sendgrid.com](https://sendgrid.com)
2. Click **"Start for Free"** or **"Sign Up"**
3. Enter your details:
   - Email address
   - Password
   - Company name: "Aldorado Jewells"
4. Verify your email address
5. Complete account setup

### Step 2: Verify Sender Identity

**Option 1: Single Sender Verification (Development)**:
1. Go to **Settings → Sender Authentication → Single Sender Verification**
2. Click **"Create a Sender"**
3. Fill in details:
   - **From Email**: `noreply@aldoradojewells.com` (or your domain)
   - **From Name**: "Aldorado Jewells"
   - **Reply To**: `support@aldoradojewells.com`
   - **Address**: Your business address
   - **City, State, ZIP**: Your location
4. Verify email address (check inbox and click verification link)

**Option 2: Domain Authentication (Production - Recommended)**:
1. Go to **Settings → Sender Authentication → Domain Authentication**
2. Click **"Authenticate Your Domain"**
3. Enter your domain: `aldoradojewells.com`
4. Choose DNS provider or add DNS records manually
5. Add CNAME records to your DNS:
   - Copy records from SendGrid dashboard
   - Add to your domain's DNS settings
   - Wait for verification (can take up to 48 hours)
6. Once verified, you can send from any email on that domain

### Step 3: Create API Key

1. Go to **Settings → API Keys**
2. Click **"Create API Key"**
3. Choose **"Full Access"** (for development) or **"Restricted Access"** (production)
4. For Restricted Access, select:
   - **Mail Send**: Full Access
   - **Template Engine**: Read/Write (if using templates)
5. Name the key: "Aldorado Backend API Key"
6. Click **"Create & View"**
7. **⚠️ IMPORTANT**: Copy the API key immediately (shown only once)
8. Store in backend `.env` file

### Step 4: Environment Variables

Add to `backend/.env`:
```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@aldoradojewells.com
SENDGRID_FROM_NAME=Aldorado Jewells
```

### Step 5: Install SendGrid SDK

```bash
cd backend
npm install @sendgrid/mail
```

### Step 6: Backend Implementation

**Create `backend/src/services/emailService.js`**:
```javascript
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: process.env.SENDGRID_FROM_NAME
      },
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('SendGrid error:', error);
    if (error.response) {
      console.error('Error details:', error.response.body);
    }
    return { success: false, error: error.message };
  }
};

// Email Templates
const sendOTPEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your OTP Code</h2>
      <p>Your One-Time Password (OTP) for Aldorado Jewells is:</p>
      <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
        ${otp}
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: 'Your OTP Code - Aldorado Jewells',
    html
  });
};

const sendOrderConfirmation = async (email, orderDetails) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Order Confirmed!</h2>
      <p>Thank you for your order, ${orderDetails.customerName}!</p>
      <p><strong>Order Number:</strong> ${orderDetails.orderNumber}</p>
      <p><strong>Total Amount:</strong> ₹${orderDetails.totalAmount}</p>
      <p>We'll send you shipping updates soon.</p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: `Order Confirmed - ${orderDetails.orderNumber}`,
    html
  });
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendOrderConfirmation
};
```

### Step 7: Use in Controllers

**Example: Send OTP Email**:
```javascript
const emailService = require('../services/emailService');

// In your OTP controller
const sendOTP = async (req, res) => {
  const { email } = req.body;
  const otp = generateOTP(); // Your OTP generation function
  
  // Store OTP in database with expiry
  await storeOTP(email, otp, 10); // 10 minutes expiry
  
  // Send email
  const result = await emailService.sendOTPEmail(email, otp);
  
  if (result.success) {
    res.json({ message: 'OTP sent to email' });
  } else {
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};
```

---

## SECTION 3: TWILIO INTEGRATION

### Step 1: Create Twilio Account

1. Go to [https://www.twilio.com](https://www.twilio.com)
2. Click **"Sign Up"** or **"Start Free Trial"**
3. Enter your details:
   - Email address
   - Password
   - Phone number (for verification)
4. Verify your phone number via SMS
5. Complete account setup

### Step 2: Get Account Credentials

1. Go to **Console Dashboard**
2. You'll see:
   - **Account SID**: Starts with `AC...`
   - **Auth Token**: Click "View" to reveal (shown only once)
3. Copy both immediately

### Step 3: Get Phone Number

**Option 1: Use Trial Number (Development)**:
- Twilio provides a trial number automatically
- Can only send to verified numbers (your phone)
- Good for testing

**Option 2: Buy Phone Number (Production)**:
1. Go to **Phone Numbers → Manage → Buy a Number**
2. Select country: **India**
3. Choose number with SMS capability
4. Purchase number (monthly fee applies)

### Step 4: Environment Variables

Add to `backend/.env`:
```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+91XXXXXXXXXX
```

### Step 5: Install Twilio SDK

```bash
cd backend
npm install twilio
```

### Step 6: Backend Implementation

**Create `backend/src/services/smsService.js`**:
```javascript
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

const sendSMS = async (to, message) => {
  try {
    // Ensure phone number has country code (e.g., +91 for India)
    const formattedTo = to.startsWith('+') ? to : `+91${to}`;
    
    const result = await client.messages.create({
      body: message,
      from: phoneNumber,
      to: formattedTo
    });

    return {
      success: true,
      messageId: result.sid,
      status: result.status
    };
  } catch (error) {
    console.error('Twilio error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const sendOTP = async (phoneNumber, otp) => {
  const message = `Your Aldorado Jewells OTP is: ${otp}. Valid for 10 minutes. Do not share this code.`;
  return await sendSMS(phoneNumber, message);
};

module.exports = {
  sendSMS,
  sendOTP
};
```

### Step 7: OTP Generation & Storage

**Create `backend/src/services/otpService.js`**:
```javascript
const supabase = require('../config/supabase');
const smsService = require('./smsService');
const emailService = require('./emailService');

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP in database
const storeOTP = async (identifier, otp, channel, expiryMinutes = 10) => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

  const { data, error } = await supabase
    .from('otp_codes')
    .insert({
      identifier, // email or phone number
      otp,
      channel, // 'email' or 'sms'
      expires_at: expiresAt.toISOString(),
      verified: false
    })
    .select()
    .single();

  if (error) {
    console.error('Error storing OTP:', error);
    return null;
  }

  return data;
};

// Verify OTP
const verifyOTP = async (identifier, otp) => {
  const { data, error } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('identifier', identifier)
    .eq('otp', otp)
    .eq('verified', false)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return { valid: false, message: 'Invalid or expired OTP' };
  }

  // Mark OTP as used
  await supabase
    .from('otp_codes')
    .update({ verified: true })
    .eq('id', data.id);

  return { valid: true, message: 'OTP verified' };
};

// Send OTP via SMS or Email
const sendOTP = async (identifier, channel = 'sms') => {
  const otp = generateOTP();
  
  // Store OTP
  const stored = await storeOTP(identifier, otp, channel);
  if (!stored) {
    return { success: false, message: 'Failed to store OTP' };
  }

  // Send OTP
  let result;
  if (channel === 'sms') {
    result = await smsService.sendOTP(identifier, otp);
  } else if (channel === 'email') {
    result = await emailService.sendOTPEmail(identifier, otp);
  } else {
    return { success: false, message: 'Invalid channel' };
  }

  if (result.success) {
    return { success: true, message: `OTP sent via ${channel}` };
  } else {
    return { success: false, message: `Failed to send OTP via ${channel}` };
  }
};

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  sendOTP
};
```

### Step 8: Database Schema for OTP

**Add to Supabase SQL Editor**:
```sql
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(255) NOT NULL, -- email or phone number
  otp VARCHAR(10) NOT NULL,
  channel VARCHAR(20) NOT NULL, -- 'email' or 'sms'
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_identifier_otp (identifier, otp),
  INDEX idx_expires_at (expires_at)
);

-- Auto-cleanup expired OTPs (optional, run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_codes
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
```

---

## SECTION 4: GOOGLE OAUTH ENHANCEMENT

### Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing: "Aldorado Jewells"
3. Enable **Google+ API**:
   - Go to **APIs & Services → Library**
   - Search "Google+ API"
   - Click **Enable**

### Step 2: Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **"Create Credentials" → "OAuth 2.0 Client ID"**
3. If prompted, configure OAuth consent screen first:
   - **User Type**: External (for public users)
   - **App Name**: "Aldorado Jewells"
   - **Support Email**: Your email
   - **Developer Contact**: Your email
   - **Scopes**: `email`, `profile`
   - **Test Users**: Add test emails (for testing before verification)
4. Create OAuth Client:
   - **Application Type**: Web application
   - **Name**: "Aldorado Jewells Web Client"
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (development)
     - `https://yourdomain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:5173/auth/callback` (development)
     - `http://localhost:3000/api/auth/google/callback` (development backend)
     - `https://yourdomain.com/auth/callback` (production)
5. Copy **Client ID** and **Client Secret**

### Step 3: Environment Variables

Add to `backend/.env`:
```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### Step 4: Install Google OAuth Library

```bash
cd backend
npm install google-auth-library
```

### Step 5: Backend Implementation

**Update `backend/src/controllers/customerAuthController.js`**:
```javascript
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleAuth = async (req, res) => {
  try {
    const { token } = req.body; // Google ID token from frontend

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Check if user exists
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);

    let user;
    if (existingUser?.user) {
      // User exists, sign them in
      user = existingUser.user;
    } else {
      // Create new user
      const { data: newUser, error } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          avatar_url: picture,
          google_id: googleId,
          role: 'customer'
        }
      });

      if (error) throw error;
      user = newUser.user;
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'customer'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google authentication successful',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || name,
        picture: user.user_metadata?.avatar_url || picture
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'Google authentication failed' });
  }
};
```

### Step 6: Frontend Implementation

**Install Google Sign-In Library**:
```bash
cd frontend
npm install @react-oauth/google
```

**Update `frontend/src/pages/CustomerLogin.jsx`**:
```javascript
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

// In your component
<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
  <GoogleLogin
    onSuccess={async (credentialResponse) => {
      try {
        const response = await customerAuthService.googleLogin({
          token: credentialResponse.credential
        });
        
        // Store token and redirect
        localStorage.setItem('token', response.token);
        navigate('/account/profile');
      } catch (error) {
        console.error('Google login error:', error);
      }
    }}
    onError={() => {
      console.error('Google login failed');
    }}
  />
</GoogleOAuthProvider>
```

**Add to `frontend/.env`**:
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## SECTION 5: OTP-BASED LOGIN

### Overview

OTP-based login allows users to login without a password using a one-time code sent via SMS or email.

### Backend Implementation

**Create `backend/src/controllers/otpAuthController.js`**:
```javascript
const otpService = require('../services/otpService');
const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

// Request OTP for login
const requestOTP = async (req, res) => {
  try {
    const { identifier, channel } = req.body; // identifier = email or phone

    if (!identifier || !channel) {
      return res.status(400).json({ message: 'Identifier and channel required' });
    }

    // Check if user exists (for login) or allow new users (for signup)
    const isSignup = req.body.action === 'signup';
    
    if (!isSignup) {
      // For login, verify user exists
      const { data: user } = await supabase.auth.admin.listUsers();
      const userExists = user.users.some(u => 
        u.email === identifier || u.user_metadata?.mobile === identifier
      );

      if (!userExists) {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    // Send OTP
    const result = await otpService.sendOTP(identifier, channel);

    if (result.success) {
      res.json({ message: `OTP sent to your ${channel}` });
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Verify OTP and login
const verifyOTPLogin = async (req, res) => {
  try {
    const { identifier, otp, channel } = req.body;

    // Verify OTP
    const verification = await otpService.verifyOTP(identifier, otp);
    
    if (!verification.valid) {
      return res.status(400).json({ message: verification.message });
    }

    // Find user by email or phone
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => 
      u.email === identifier || u.user_metadata?.mobile === identifier
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'customer'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name,
        mobile: user.user_metadata?.mobile
      }
    });
  } catch (error) {
    console.error('OTP login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  requestOTP,
  verifyOTPLogin
};
```

**Add routes in `backend/src/routes/customerAuthRoutes.js`**:
```javascript
const { requestOTP, verifyOTPLogin } = require('../controllers/otpAuthController');

router.post('/otp/request', requestOTP);
router.post('/otp/verify', verifyOTPLogin);
```

### Frontend Implementation

**Create OTP Login Component**:
```javascript
const [identifier, setIdentifier] = useState('');
const [otp, setOtp] = useState('');
const [otpSent, setOtpSent] = useState(false);
const [channel, setChannel] = useState('sms'); // or 'email'

const handleRequestOTP = async () => {
  try {
    await customerAuthService.requestOTP({ identifier, channel });
    setOtpSent(true);
  } catch (error) {
    console.error('OTP request error:', error);
  }
};

const handleVerifyOTP = async () => {
  try {
    const response = await customerAuthService.verifyOTPLogin({
      identifier,
      otp,
      channel
    });
    
    localStorage.setItem('token', response.token);
    navigate('/account/profile');
  } catch (error) {
    console.error('OTP verification error:', error);
  }
};

// Render
{!otpSent ? (
  <>
    <input
      type="text"
      value={identifier}
      onChange={(e) => setIdentifier(e.target.value)}
      placeholder="Email or Phone"
    />
    <select value={channel} onChange={(e) => setChannel(e.target.value)}>
      <option value="sms">SMS</option>
      <option value="email">Email</option>
    </select>
    <button onClick={handleRequestOTP}>Send OTP</button>
  </>
) : (
  <>
    <input
      type="text"
      value={otp}
      onChange={(e) => setOtp(e.target.value)}
      placeholder="Enter OTP"
    />
    <button onClick={handleVerifyOTP}>Verify & Login</button>
  </>
)}
```

---

## SECTION 6: TWO-FACTOR AUTHENTICATION (2FA)

### Overview

2FA adds an extra security layer. After entering password, user must verify with OTP (SMS or Email).

### Database Schema

**Add to Supabase**:
```sql
-- Add 2FA settings to users table (or create separate table)
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;

-- Or create separate table
CREATE TABLE IF NOT EXISTS user_2fa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT FALSE,
  method VARCHAR(20) DEFAULT 'sms', -- 'sms' or 'email'
  backup_codes TEXT[], -- Array of backup codes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### Backend Implementation

**Create `backend/src/controllers/twoFactorController.js`**:
```javascript
const otpService = require('../services/otpService');
const supabase = require('../config/supabase');

// Enable 2FA
const enable2FA = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { method } = req.body; // 'sms' or 'email'

    // Get user's email/phone
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const user = userData.user;
    
    const identifier = method === 'sms' 
      ? user.user_metadata?.mobile 
      : user.email;

    if (!identifier) {
      return res.status(400).json({ 
        message: `${method === 'sms' ? 'Phone number' : 'Email'} not found` 
      });
    }

    // Send OTP to verify
    const result = await otpService.sendOTP(identifier, method);

    if (result.success) {
      // Store 2FA setup in progress (temporary)
      await supabase
        .from('user_2fa_settings')
        .upsert({
          user_id: userId,
          enabled: false, // Not enabled until verified
          method: method,
          setup_in_progress: true
        });

      res.json({ 
        message: `OTP sent to your ${method}`,
        requiresVerification: true
      });
    } else {
      res.status(500).json({ message: 'Failed to send OTP' });
    }
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Verify and enable 2FA
const verifyAndEnable2FA = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { otp } = req.body;

    // Get user and 2FA settings
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const user = userData.user;

    const { data: settings } = await supabase
      .from('user_2fa_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!settings || !settings.setup_in_progress) {
      return res.status(400).json({ message: '2FA setup not in progress' });
    }

    const identifier = settings.method === 'sms' 
      ? user.user_metadata?.mobile 
      : user.email;

    // Verify OTP
    const verification = await otpService.verifyOTP(identifier, otp);
    
    if (!verification.valid) {
      return res.status(400).json({ message: verification.message });
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    // Enable 2FA
    await supabase
      .from('user_2fa_settings')
      .update({
        enabled: true,
        setup_in_progress: false,
        backup_codes: backupCodes
      })
      .eq('user_id', userId);

    res.json({
      message: '2FA enabled successfully',
      backupCodes // Show to user, store securely
    });
  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Disable 2FA
const disable2FA = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { password } = req.body; // Require password confirmation

    // Verify password (implement password verification)
    // ... password verification logic ...

    // Disable 2FA
    await supabase
      .from('user_2fa_settings')
      .update({ enabled: false })
      .eq('user_id', userId);

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Login with 2FA
const loginWith2FA = async (req, res) => {
  try {
    const { email, password, otp } = req.body;

    // Step 1: Verify password (existing login logic)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Step 2: Check if 2FA is enabled
    const { data: settings } = await supabase
      .from('user_2fa_settings')
      .select('*')
      .eq('user_id', authData.user.id)
      .eq('enabled', true)
      .single();

    if (!settings) {
      // 2FA not enabled, proceed with normal login
      // ... generate JWT and return ...
      return res.json({ token: '...', user: '...' });
    }

    // Step 3: Verify OTP
    if (!otp) {
      // Send OTP and return pending status
      const identifier = settings.method === 'sms'
        ? authData.user.user_metadata?.mobile
        : authData.user.email;

      await otpService.sendOTP(identifier, settings.method);

      return res.json({
        requires2FA: true,
        message: `OTP sent to your ${settings.method}`
      });
    }

    // Step 4: Verify OTP
    const identifier = settings.method === 'sms'
      ? authData.user.user_metadata?.mobile
      : authData.user.email;

    const verification = await otpService.verifyOTP(identifier, otp);
    
    if (!verification.valid) {
      return res.status(401).json({ message: verification.message });
    }

    // Step 5: Generate JWT token
    const token = jwt.sign(
      {
        userId: authData.user.id,
        email: authData.user.email,
        role: authData.user.user_metadata?.role || 'customer'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: authData.user.id,
        email: authData.user.email
      }
    });
  } catch (error) {
    console.error('2FA login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  enable2FA,
  verifyAndEnable2FA,
  disable2FA,
  loginWith2FA
};
```

---

## SECTION 7: CARD STORAGE (INDIA-COMPLIANT)

### Indian Government Compliance

**RBI Guidelines (Reserve Bank of India)**:
- **Tokenization Mandatory**: Card details must be tokenized (stored as tokens, not actual numbers)
- **PCI-DSS Compliance**: Must comply with Payment Card Industry Data Security Standard
- **No Storage of Sensitive Data**: Cannot store CVV, full card number, or PIN
- **Token Service Provider**: Must use RBI-approved token service provider
- **Customer Consent**: Explicit consent required before storing cards

**What Can Be Stored**:
- ✅ Token (from token service provider)
- ✅ Last 4 digits (for display)
- ✅ Card type (Visa, Mastercard, etc.)
- ✅ Expiry month/year
- ✅ Cardholder name
- ✅ Billing address (if provided)

**What CANNOT Be Stored**:
- ❌ Full card number
- ❌ CVV/CVC
- ❌ PIN
- ❌ Track data (magnetic stripe data)

### Implementation Approach

**Option 1: Use Razorpay Tokenization (Recommended)**:
- Razorpay provides tokenization service
- Compliant with RBI regulations
- Cards stored as tokens on Razorpay's secure servers
- You store only the token reference

**Option 2: Use Third-Party Token Service**:
- Use RBI-approved token service provider
- More complex, but gives more control

### Database Schema

**Add to Supabase**:
```sql
CREATE TABLE IF NOT EXISTS saved_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_token_id VARCHAR(255) NOT NULL, -- Token from Razorpay
  card_type VARCHAR(20), -- 'Visa', 'Mastercard', etc.
  last_4_digits VARCHAR(4) NOT NULL,
  expiry_month INTEGER,
  expiry_year INTEGER,
  cardholder_name VARCHAR(255),
  is_default BOOLEAN DEFAULT FALSE,
  billing_address_id UUID REFERENCES addresses(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_user_id (user_id),
  INDEX idx_razorpay_token (razorpay_token_id)
);
```

### Backend Implementation

**Create `backend/src/controllers/savedCardController.js`**:
```javascript
const Razorpay = require('razorpay');
const supabase = require('../config/supabase');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Save card after payment (using Razorpay token)
const saveCard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      razorpay_payment_id, 
      cardholder_name,
      billing_address_id,
      save_card 
    } = req.body;

    if (!save_card) {
      return res.json({ message: 'Card not saved (user choice)' });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    if (!payment.card) {
      return res.status(400).json({ message: 'Card details not found' });
    }

    // Get token ID (Razorpay provides this)
    const tokenId = payment.card.id; // Or from payment method

    // Check if card already saved
    const { data: existing } = await supabase
      .from('saved_cards')
      .select('*')
      .eq('user_id', userId)
      .eq('razorpay_token_id', tokenId)
      .single();

    if (existing) {
      return res.json({ message: 'Card already saved', card: existing });
    }

    // Save card (only token and non-sensitive data)
    const { data: savedCard, error } = await supabase
      .from('saved_cards')
      .insert({
        user_id: userId,
        razorpay_token_id: tokenId,
        card_type: payment.card.type,
        last_4_digits: payment.card.last4,
        expiry_month: payment.card.expiry_month,
        expiry_year: payment.card.expiry_year,
        cardholder_name: cardholder_name,
        billing_address_id: billing_address_id,
        is_default: false
      })
      .select()
      .single();

    if (error) {
      console.error('Save card error:', error);
      return res.status(500).json({ message: 'Failed to save card' });
    }

    res.json({
      message: 'Card saved successfully',
      card: savedCard
    });
  } catch (error) {
    console.error('Save card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user's saved cards
const getSavedCards = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: cards, error } = await supabase
      .from('saved_cards')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch cards' });
    }

    // Return only safe data (no tokens exposed)
    const safeCards = cards.map(card => ({
      id: card.id,
      card_type: card.card_type,
      last_4_digits: card.last_4_digits,
      expiry_month: card.expiry_month,
      expiry_year: card.expiry_year,
      cardholder_name: card.cardholder_name,
      is_default: card.is_default
    }));

    res.json({ cards: safeCards });
  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete saved card
const deleteCard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { cardId } = req.params;

    // Verify card belongs to user
    const { data: card } = await supabase
      .from('saved_cards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', userId)
      .single();

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Delete card
    await supabase
      .from('saved_cards')
      .delete()
      .eq('id', cardId);

    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Use saved card for payment
const useSavedCard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { cardId, orderIntentId } = req.body;

    // Get saved card
    const { data: card } = await supabase
      .from('saved_cards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', userId)
      .single();

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Get order intent
    const { data: orderIntent } = await supabase
      .from('order_intents')
      .select('*')
      .eq('id', orderIntentId)
      .eq('user_id', userId)
      .single();

    if (!orderIntent) {
      return res.status(404).json({ message: 'Order intent not found' });
    }

    // Create Razorpay order with saved card token
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(orderIntent.total_amount * 100), // Convert to paise
      currency: 'INR',
      receipt: orderIntent.intent_number,
      method: 'card',
      token: card.razorpay_token_id // Use saved token
    });

    res.json({
      razorpay_order_id: razorpayOrder.id,
      // Frontend will open Razorpay checkout with this order
    });
  } catch (error) {
    console.error('Use saved card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  saveCard,
  getSavedCards,
  deleteCard,
  useSavedCard
};
```

### Frontend Implementation

**Card Save Checkbox (During Payment)**:
```javascript
const [saveCard, setSaveCard] = useState(false);

// After successful payment
const handlePaymentSuccess = async (paymentResponse) => {
  // ... process payment ...
  
  if (saveCard) {
    await savedCardService.saveCard({
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      cardholder_name: user.name,
      save_card: true
    });
  }
};
```

**Saved Cards Display**:
```javascript
const [savedCards, setSavedCards] = useState([]);

useEffect(() => {
  const fetchCards = async () => {
    const response = await savedCardService.getSavedCards();
    setSavedCards(response.cards);
  };
  fetchCards();
}, []);

// Render saved cards
{savedCards.map(card => (
  <div key={card.id}>
    <p>{card.card_type} •••• {card.last_4_digits}</p>
    <p>Expires: {card.expiry_month}/{card.expiry_year}</p>
    <button onClick={() => useCardForPayment(card.id)}>
      Use This Card
    </button>
  </div>
))}
```

---

## SECTION 8: SECURITY CONCERNS & BEST PRACTICES

### Email Security (SendGrid)

**Best Practices**:
1. **Verify Sender Domain**: Always use domain authentication (not single sender)
2. **SPF/DKIM Records**: Ensure DNS records are correctly configured
3. **Rate Limiting**: Implement rate limiting for OTP requests
4. **OTP Expiry**: Set short expiry times (5-10 minutes)
5. **One-Time Use**: Mark OTPs as used after verification
6. **No Sensitive Data**: Never send passwords or sensitive data via email
7. **HTTPS Only**: Always use HTTPS for email links

### SMS Security (Twilio)

**Best Practices**:
1. **Rate Limiting**: Limit OTP requests per phone number (e.g., 3 per hour)
2. **OTP Expiry**: Short expiry times (5-10 minutes)
3. **One-Time Use**: OTPs should be single-use only
4. **No Sensitive Data**: Never send account details via SMS
5. **Phone Verification**: Verify phone numbers before sending OTPs
6. **Cost Control**: Monitor SMS costs, set spending limits

### OTP Security

**Critical Rules**:
1. **Random Generation**: Use cryptographically secure random number generator
2. **Minimum Length**: Use at least 6 digits (preferably 6-8)
3. **Expiry**: Maximum 10 minutes expiry
4. **Single Use**: Mark as used immediately after verification
5. **Rate Limiting**: Limit requests per identifier (email/phone)
6. **No Reuse**: Never reuse OTPs, generate new one each time
7. **Case Insensitive**: OTPs should be case-insensitive
8. **No Patterns**: Avoid sequential or predictable patterns

### 2FA Security

**Best Practices**:
1. **Backup Codes**: Generate and securely store backup codes
2. **Multiple Methods**: Support both SMS and Email OTP
3. **Recovery Process**: Secure process for users who lose 2FA access
4. **Session Management**: Require 2FA on new devices/sessions
5. **Trusted Devices**: Option to remember device for 30 days
6. **Admin Override**: Admin can disable 2FA if user is locked out (with verification)

### Google OAuth Security

**Best Practices**:
1. **Token Verification**: Always verify Google ID token on backend
2. **HTTPS Only**: Use HTTPS for all OAuth redirects
3. **State Parameter**: Use state parameter to prevent CSRF attacks
4. **Scope Limitation**: Request only necessary scopes (email, profile)
5. **Token Expiry**: Handle token expiry gracefully
6. **Account Linking**: Link Google account to existing account if email matches

### Card Storage Security

**RBI Compliance Checklist**:
- ✅ Use tokenization (Razorpay tokens)
- ✅ Never store full card number
- ✅ Never store CVV
- ✅ Never store PIN
- ✅ Encrypt stored data (database encryption)
- ✅ PCI-DSS compliant infrastructure
- ✅ Customer consent before saving
- ✅ Option to delete saved cards
- ✅ Audit logs for card operations
- ✅ Regular security audits

**Additional Security**:
1. **Encryption at Rest**: Encrypt database fields containing card tokens
2. **Access Control**: Only user can access their saved cards
3. **Audit Logs**: Log all card save/delete/use operations
4. **Token Rotation**: Consider token rotation if supported by provider
5. **Data Retention**: Allow users to delete cards, auto-delete after inactivity

### General Security

**API Security**:
1. **Rate Limiting**: Implement rate limiting on all auth endpoints
2. **Input Validation**: Validate all inputs (email format, phone format, OTP format)
3. **SQL Injection**: Use parameterized queries (Supabase handles this)
4. **XSS Prevention**: Sanitize user inputs
5. **CORS**: Configure CORS properly
6. **HTTPS**: Always use HTTPS in production
7. **JWT Security**: Use strong JWT secrets, set appropriate expiry

**Data Protection**:
1. **GDPR Compliance**: Allow users to delete their data
2. **Data Minimization**: Store only necessary data
3. **Encryption**: Encrypt sensitive data at rest and in transit
4. **Access Logs**: Log all access to sensitive data
5. **Regular Backups**: Backup database regularly

---

## SECTION 9: ENVIRONMENT VARIABLES SUMMARY

### Backend `.env` File

```env
# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@aldoradojewells.com
SENDGRID_FROM_NAME=Aldorado Jewells

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+91XXXXXXXXXX

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Existing (from other integrations)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-secret-key
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

### Frontend `.env` File

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## SECTION 10: TESTING CHECKLIST

### SendGrid Testing
- [ ] Send test email successfully
- [ ] OTP email received and readable
- [ ] Order confirmation email works
- [ ] Email templates render correctly
- [ ] Bounce handling works
- [ ] Unsubscribe links work (if applicable)

### Twilio Testing
- [ ] Send test SMS successfully
- [ ] OTP SMS received and readable
- [ ] Phone number formatting correct
- [ ] International numbers work (if applicable)
- [ ] Error handling for invalid numbers
- [ ] Rate limiting works

### Google OAuth Testing
- [ ] Google login button appears
- [ ] Redirects to Google login
- [ ] Returns to app after login
- [ ] User data retrieved correctly
- [ ] New users created successfully
- [ ] Existing users logged in correctly
- [ ] JWT token generated

### OTP Login Testing
- [ ] Request OTP via SMS
- [ ] Request OTP via Email
- [ ] OTP received and valid
- [ ] OTP verification works
- [ ] Invalid OTP rejected
- [ ] Expired OTP rejected
- [ ] Rate limiting works
- [ ] Login successful after OTP verification

### 2FA Testing
- [ ] Enable 2FA (SMS)
- [ ] Enable 2FA (Email)
- [ ] Verify and enable 2FA
- [ ] Backup codes generated
- [ ] Login with 2FA works
- [ ] Login without 2FA rejected (if enabled)
- [ ] Disable 2FA works
- [ ] Backup codes work

### Card Storage Testing
- [ ] Save card after payment (with consent)
- [ ] Card saved with token only
- [ ] Saved cards list works
- [ ] Use saved card for payment
- [ ] Delete saved card works
- [ ] Default card selection works
- [ ] No sensitive data stored

---

## SECTION 11: DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All environment variables set in production
- [ ] SendGrid domain authenticated
- [ ] Twilio phone number purchased
- [ ] Google OAuth redirect URIs updated for production
- [ ] Database migrations run
- [ ] All secrets rotated (if needed)
- [ ] HTTPS enabled
- [ ] CORS configured for production domain

### Post-Deployment
- [ ] Test email sending in production
- [ ] Test SMS sending in production
- [ ] Test Google OAuth in production
- [ ] Test OTP login in production
- [ ] Test 2FA in production
- [ ] Test card storage in production
- [ ] Monitor error logs
- [ ] Monitor API usage/costs

---

## SECTION 12: TROUBLESHOOTING

### SendGrid Issues

**Emails Not Sending**:
- Check API key is correct
- Verify sender email is authenticated
- Check SendGrid dashboard for errors
- Verify email is not in spam
- Check rate limits

**Emails Going to Spam**:
- Verify domain authentication (not single sender)
- Check SPF/DKIM records
- Use proper from name/email
- Avoid spam trigger words

### Twilio Issues

**SMS Not Sending**:
- Check account balance
- Verify phone number format (include country code)
- Check Twilio console for errors
- Verify phone number is purchased (not trial)
- Check rate limits

**OTP Not Received**:
- Check phone number is correct
- Verify Twilio account is active
- Check message logs in Twilio dashboard
- Ensure phone number can receive SMS

### Google OAuth Issues

**Redirect URI Mismatch**:
- Verify redirect URI matches exactly in Google Console
- Check HTTP vs HTTPS
- Verify domain matches
- Check for trailing slashes

**Token Verification Fails**:
- Verify client ID matches
- Check token hasn't expired
- Verify token is from correct Google project

### OTP Issues

**OTP Not Working**:
- Check OTP hasn't expired
- Verify OTP format (case-insensitive)
- Check OTP hasn't been used already
- Verify identifier (email/phone) matches

**Rate Limiting Too Strict**:
- Adjust rate limit settings
- Check if user is blocked
- Verify identifier is correct

---

## SUMMARY

This document covers:
- ✅ SendGrid email integration
- ✅ Twilio SMS/OTP integration
- ✅ Google OAuth enhancement
- ✅ OTP-based login
- ✅ Two-Factor Authentication (2FA)
- ✅ Card storage (India-compliant)
- ✅ Security best practices
- ✅ Testing and deployment

All integrations follow security best practices and comply with Indian government regulations (RBI, PCI-DSS) where applicable.

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Project**: Aldorado Jewells E-commerce Platform  
**Status**: Ready for Implementation

