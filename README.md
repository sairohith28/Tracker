# Calorie Tracker

A minimal, professional web application for tracking daily calories, exercise, and nutrition goals.

## Features

- 🔐 **Secure Login** - Username and password authentication
- 📅 **Daily Tracking** - Track food and exercise with calendar navigation
- 🎯 **Goal Management** - Set maintenance and target calories
- 📊 **Smart Status** - Color-coded daily status with deficit/surplus calculation
- 📈 **Reports & Analytics** - Visualize data with daily, weekly, and monthly charts
- 💾 **Data Persistence** - All data stored locally in browser
- 🎨 **Clean UI** - Minimal, mature, and professional design

## Default Credentials

- **Username:** `admin`
- **Password:** `admin123`

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

All data is stored in browser's localStorage:
- User credentials
- Daily food and exercise entries
- Settings (maintenance and target calories)

**Note:** Data is stored locally in your browser. Clearing browser data will reset the app.

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
- localStorage for data persistence

## Browser Compatibility

Works on all modern browsers:
- Chrome
- Firefox
- Safari
- Edge

## Future Enhancements

- Multi-user support
- Data export/import
- Meal planning
- Nutrition macros tracking
- Mobile app version

## License

Free to use and modify for personal projects.

---

**Tip:** Bookmark the page on your phone for easy access as a PWA-like experience!
