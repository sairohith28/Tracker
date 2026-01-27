# Calorie Tracker

A minimal, professional web application for tracking daily calories, exercise, and nutrition goals.

## Features

- 🔐 **Google Sign-In** - Secure authentication with your Google account
- 🔑 **Traditional Login** - Or use username/password
- 📅 **Daily Tracking** - Track food and exercise with calendar navigation
- 🎯 **Goal Management** - Set maintenance and target calories
- 📊 **Smart Status** - Color-coded daily status with deficit/surplus calculation
- 📈 **Reports & Analytics** - Visualize data with daily, weekly, and monthly charts
- ☁️ **Cloud Sync** - All data syncs across devices via Firebase
- 🎨 **Clean UI** - Minimal, mature, and professional design
- 📱 **Mobile-First** - Optimized for mobile devices

## Quick Start

Simply visit the app and:
- **Sign in with Google** for instant access, or
- Use traditional login credentials

## Usage

### Daily Tracking

1. Select a date using the calendar
2. Add food entries with name, calories, and optional notes
3. Add exercise entries with name and calories burned
4. View real-time status showing your calorie deficit/surplus

### Settings

Configure your calorie goals:
- **Maintenance Calories**: Your daily calorie needs (e.g., 2500)
- **Target Calories**: Your daily calorie goal (e.g., 1800)

### Reports

View your progress with interactive charts:
- Switch between daily, weekly, and monthly views
- Filter by custom date ranges
- Track calories consumed vs burned
- Monitor net calorie trends

## Status Calculation

The app calculates your daily status as:
```
Maintenance Calories - Consumed + Burned = Deficit/Surplus
```

**Example:** 2500 - 1700 + 300 = 1100 calories deficit

**Color Coding:**
- 🟢 **Green** - Calorie deficit (losing weight)
- 🟡 **Yellow** - At maintenance
- 🔴 **Red** - Calorie surplus (gaining weight)

## Deployment to GitHub Pages

1. Create a new repository on GitHub
2. Add all files to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

3. Enable GitHub Pages:
   - Go to repository Settings
   - Navigate to Pages section
   - Select "main" branch as source
   - Click Save

4. Your app will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO/`

## Data Storage

All data is stored in Firebase Firestore (cloud database):
- Automatic sync across all devices
- Access your data from any browser
- Offline support with localStorage backup

## Authentication

Two sign-in methods available:
1. **Google Sign-In** - One-click authentication with your Google account
2. **Traditional Login** - Username and password (for development/testing)

**Note:** Data is automatically synced across all your devices when using the same login method.

## File Structure

```
tracker/
├── index.html      # Main HTML structure
├── styles.css      # Styling and responsive design
├── app.js          # Application logic and data management
└── README.md       # Documentation
```

## Technologies Used

- HTML5
- CSS3 (Modern, responsive design)
- Vanilla JavaScript (No frameworks)
- Chart.js for data visualization
- Firebase Firestore for cloud data sync
- Firebase Authentication (Google Sign-In)

## Browser Compatibility

Works on all modern browsers:
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Security

- Firebase Authentication for secure sign-in
- Firestore security rules protect your data
- All data is user-specific and private

## Future Enhancements

- Multi-user support with Firebase Auth
- Data export/import
- Meal planning
- Nutrition macros tracking
- Native mobile app version
- Social sharing features

## License

Free to use and modify for personal projects.

---

**Tip:** Bookmark the page on your phone for easy access as a PWA-like experience!
