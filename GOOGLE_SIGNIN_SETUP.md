# Google Sign-In Setup Guide

## Enable Google Authentication in Firebase

To make Google Sign-In work, follow these steps:

### 1. Go to Firebase Console
Visit: https://console.firebase.google.com/project/calorietracker-b00ea

### 2. Navigate to Authentication
- Click **"Authentication"** in the left sidebar
- Click **"Get Started"** (if first time)

### 3. Enable Google Sign-In Provider
- Click the **"Sign-in method"** tab
- Find **"Google"** in the providers list
- Click on it
- Toggle the **"Enable"** switch to ON
- Enter a **Project support email** (your email)
- Click **"Save"**

### 4. Configure Authorized Domains
- Still in the "Sign-in method" tab
- Scroll to **"Authorized domains"**
- Your localhost and Firebase domains are already added
- Add your custom domain if you have one:
  - Click **"Add domain"**
  - Enter your domain (e.g., `myapp.com`)
  - Click **"Add"**

### 5. That's It! 🎉

Your Google Sign-In is now active.

## Testing Google Sign-In

1. **Open your app**
2. **Click "Sign in with Google"**
3. **Select your Google account**
4. **Grant permissions**
5. **You're in!** ✨

## How It Works

- **Google Sign-In**: Uses your Google account (secure OAuth2)
- **User Data**: Email, name, and profile photo are stored
- **Data Sync**: All your calorie data syncs to your Google account
- **Multi-Device**: Access from any device with the same Google account

## Traditional Login

You can still use traditional username/password:
- **Username**: `hitty`
- **Password**: `1234`

## Troubleshooting

### "Popup blocked" error?
- Allow popups in your browser settings for this site

### "Unauthorized domain" error?
- Make sure your domain is added in Firebase Console → Authentication → Authorized domains

### Still not working?
- Check browser console (F12) for detailed errors
- Verify Firebase Authentication is enabled
- Ensure you've published Firestore security rules

## Security Notes

### Current Setup (Development)
The app currently uses basic Firestore rules allowing all reads/writes. This is fine for personal use.

### For Production (Recommended)
Update Firestore rules to restrict data by user:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // User-specific data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Shared app data (read-only)
    match /appData/{document=**} {
      allow read: if request.auth != null;
      allow write: if false; // Prevent writes to shared data
    }
  }
}
```

This ensures:
- Only authenticated users can access data
- Users can only read/write their own data
- Shared configuration is read-only

---

**You're all set! Enjoy seamless Google Sign-In! 🚀**
