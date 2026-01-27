# 🔐 Security Fix: Firebase Config

Your Firebase API keys were exposed in Git! Here's what to do:

## ⚠️ IMPORTANT: Rotate Your API Keys

1. **Go to Firebase Console**: https://console.firebase.google.com/project/calorietracker-b00ea/settings/general
2. **Click "Web API Key"** 
3. **Regenerate your API key** (or restrict it)
4. **Update your local `firebase-config.js`** with the new key

## 🛡️ What Changed

- ✅ Moved Firebase config to `firebase-config.js` (ignored by Git)
- ✅ Created `.gitignore` to prevent committing secrets
- ✅ Created `firebase-config.template.js` for reference

## 📝 Setup for New Users

If someone clones your repo, they need to:

1. Copy the template:
   ```bash
   cp firebase-config.template.js firebase-config.js
   ```

2. Edit `firebase-config.js` with their Firebase credentials

3. The app will now work without exposing secrets!

## 🧹 Clean Git History (Optional but Recommended)

Your old commits still contain the API keys. To remove them:

### Option 1: BFG Repo Cleaner (Easiest)
```bash
# Install BFG
brew install bfg  # Mac
# or download from https://rtyley.github.io/bfg-repo-cleaner/

# Remove the secrets
bfg --replace-text <(echo 'AIzaSyDgsq3R_KW3mhyA_lgU0A7QAPeCqiUaSIY==>REMOVED')

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
```

### Option 2: GitHub's Secret Scanning

GitHub will automatically notify you. Just:
1. Rotate the keys in Firebase Console
2. Commit this fix
3. GitHub will mark it as resolved

## 🚀 Next Steps

1. **Rotate your Firebase API key** (most important!)
2. **Commit this fix**:
   ```bash
   git add .
   git commit -m "Security: Move Firebase config to separate file"
   git push origin dev
   ```

3. **Your app will still work** - `firebase-config.js` is local only

## ℹ️ Note

The Firebase API key in the template is safe to share - it's a **public identifier**, not a secret. However, you should still restrict it in Firebase Console:

**Firebase Console → Project Settings → General → Web API Key → Restrict Key**

Add restrictions:
- HTTP referrers: `hitty.me/*`, `*.github.io/*`
- This prevents others from using your Firebase project

---

**You're now secure! 🎉**
