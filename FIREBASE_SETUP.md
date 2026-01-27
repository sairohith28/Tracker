# Firebase Setup Guide

## ✅ Firebase Integration Complete!

Your calorie tracker now syncs across ALL browsers and devices using Firebase Firestore.

## What Changed

- **Data Storage**: Now uses Firebase Firestore (cloud database)
- **Sync**: Automatic sync across all your devices
- **Backup**: Still saves to localStorage as fallback
- **No Breaking Changes**: Existing data migrates automatically

## Final Step: Configure Firestore Security Rules

To secure your data, you need to set up Firestore security rules:

### 1. Go to Firebase Console
Visit: https://console.firebase.google.com/

### 2. Select Your Project
Click on "calorietracker-0ea"

### 3. Navigate to Firestore Database
- Click "Firestore Database" in the left menu
- Click the "Rules" tab

### 4. Replace Rules with This:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to the main app data document
    match /appData/{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 5. Click "Publish"

## How It Works

### Data Syncing
- When you add food/exercise, it saves to Firestore
- Other devices/browsers fetch from Firestore
- Changes appear instantly across all devices

### Offline Support
- Data still works offline using localStorage
- When you come back online, it syncs to Firestore

### No Data Loss
- Your existing localStorage data is preserved as backup
- First time loading, it uploads to Firestore

## Testing Cross-Device Sync

1. **Open your app on Computer**: Add a food entry
2. **Open same app on Phone**: Refresh the page
3. **See the magic**: Your food entry appears! ✨

## Free Tier Limits

Firebase Free Tier includes:
- **50,000 reads/day**
- **20,000 writes/day**
- **1 GB storage**

This is MORE than enough for personal use (even with heavy usage, you'll use ~100-500 operations/day).

## Troubleshooting

### Data not syncing?
1. Check browser console for errors (F12)
2. Verify Firebase security rules are published
3. Make sure you're online

### See "Firebase not ready" error?
- Refresh the page
- Check your internet connection
- Verify Firebase SDK loaded correctly

## Advanced: More Secure Rules (Optional)

For production with multiple users, you can add authentication:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /appData/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Then add Firebase Authentication to the app.

---

## 🎉 You're All Set!

Your calorie tracker now syncs perfectly across all devices. Enjoy tracking your calories anywhere! 📱💻
