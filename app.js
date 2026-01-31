// Application State
let currentUser = null;
let currentDate = new Date();
let currentFilter = 'daily';
let caloriesChart = null;
let netCaloriesChart = null;
let nutritionChart = null;
let isFirebaseReady = false;

// Data Structure
const defaultData = {
    users: {
        'hitty': '1234' // Default username and password
    },
    userData: {} // Per-user data: { username: { settings: {...}, entries: {...} } }
};

const defaultUserData = {
    settings: {
        maintenanceCalories: 2500,
        targetCalories: 1800
    },
    entries: {} // Format: { 'YYYY-MM-DD': { food: [], exercise: [] } }
};

// Wait for Firebase to be ready
function waitForFirebase() {
    return new Promise((resolve) => {
        if (window.firebaseReady) {
            isFirebaseReady = true;
            resolve();
        } else {
            // Set a timeout to prevent infinite loading
            const timeout = setTimeout(() => {
                console.warn('Firebase initialization timed out, continuing without Firebase');
                isFirebaseReady = false;
                resolve();
            }, 5000); // 5 second timeout

            window.addEventListener('firebase-ready', () => {
                clearTimeout(timeout);
                isFirebaseReady = true;
                resolve();
            }, { once: true });
        }
    });
}

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    // Show loading state
    showLoadingState();
    
    try {
        // Wait for Firebase with timeout
        await waitForFirebase();
        
        await initializeData();
        checkAuth();
        setupEventListeners();
    } catch (error) {
        console.error('Initialization error:', error);
        // Continue anyway with localStorage fallback
        await initializeData();
        checkAuth();
        setupEventListeners();
    } finally {
        // Always hide loading state
        hideLoadingState();
    }
});

function showLoadingState() {
    const loginPage = document.getElementById('loginPage');
    if (!loginPage.querySelector('.loading-spinner')) {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = '<div class="spinner"></div>';
        loginPage.appendChild(spinner);
    }
}

function hideLoadingState() {
    const spinner = document.querySelector('.loading-spinner');
    if (spinner) spinner.remove();
}

// Firestore Data Management
async function getData() {
    if (!isFirebaseReady) {
        // Fallback to localStorage if Firebase isn't ready
        const localData = localStorage.getItem('calorieTrackerData');
        return localData ? JSON.parse(localData) : defaultData;
    }

    try {
        const { doc, getDoc } = window.firestoreModules;
        const docRef = doc(window.db, 'appData', 'mainData');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            // Initialize with default data
            await saveData(defaultData);
            return defaultData;
        }
    } catch (error) {
        console.error('Error getting data from Firestore:', error);
        // Fallback to localStorage
        const localData = localStorage.getItem('calorieTrackerData');
        return localData ? JSON.parse(localData) : defaultData;
    }
}

async function saveData(data) {
    if (!isFirebaseReady) {
        // Fallback to localStorage
        localStorage.setItem('calorieTrackerData', JSON.stringify(data));
        return;
    }

    try {
        const { doc, setDoc } = window.firestoreModules;
        const docRef = doc(window.db, 'appData', 'mainData');
        await setDoc(docRef, data);
        
        // Also save to localStorage as backup
        localStorage.setItem('calorieTrackerData', JSON.stringify(data));
    } catch (error) {
        console.error('Error saving data to Firestore:', error);
        // Fallback to localStorage
        localStorage.setItem('calorieTrackerData', JSON.stringify(data));
    }
}

// Data Management
async function initializeData() {
    const data = await getData();
    
    // Ensure all required properties exist
    let needsSave = false;
    
    if (!data.users) {
        data.users = defaultData.users;
        needsSave = true;
    }
    
    if (!data.userData) {
        data.userData = {};
        needsSave = true;
    }
    
    // Ensure default user exists
    if (!data.users['hitty']) {
        data.users['hitty'] = '1234';
        needsSave = true;
    }
    
    if (needsSave) {
        await saveData(data);
    }
}

// Get current user's data (settings and entries)
async function getUserData() {
    const data = await getData();
    if (!data.userData[currentUser]) {
        data.userData[currentUser] = JSON.parse(JSON.stringify(defaultUserData));
        await saveData(data);
    }
    return data.userData[currentUser];
}

// Save current user's data
async function saveUserData(userData) {
    const data = await getData();
    data.userData[currentUser] = userData;
    await saveData(data);
}

// Authentication
function checkAuth() {
    // Check localStorage first (remembered user), then sessionStorage
    const rememberedUser = localStorage.getItem('rememberedUser');
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    
    if (rememberedUser) {
        currentUser = rememberedUser;
        sessionStorage.setItem('loggedInUser', rememberedUser);
        showMainApp();
    } else if (loggedInUser) {
        currentUser = loggedInUser;
        showMainApp();
    } else {
        showLoginPage();
    }
}

function showLoginPage() {
    document.getElementById('loginPage').classList.add('active');
    document.getElementById('mainApp').classList.remove('active');
}

function showMainApp() {
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('mainApp').classList.add('active');
    document.getElementById('selectedDate').valueAsDate = currentDate;
    loadSettings();
    updateTracker();
}

// Event Listeners
function setupEventListeners() {
    // Login & Register
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Toggle between login and register
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.login-card:not(.register-card)').style.display = 'none';
        document.getElementById('registerCard').style.display = 'block';
    });
    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.login-card:not(.register-card)').style.display = 'block';
        document.getElementById('registerCard').style.display = 'none';
    });

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (e.target.id !== 'logoutBtn') {
                e.preventDefault();
                const page = e.target.dataset.page;
                if (page) switchPage(page);
            }
        });
    });

    // Date Navigation
    document.getElementById('selectedDate').addEventListener('change', handleDateChange);
    document.getElementById('prevDay').addEventListener('click', () => changeDate(-1));
    document.getElementById('nextDay').addEventListener('click', () => changeDate(1));
    document.getElementById('todayBtn').addEventListener('click', () => {
        currentDate = new Date();
        document.getElementById('selectedDate').valueAsDate = currentDate;
        updateTracker();
    });

    // Food & Exercise
    document.getElementById('addFoodBtn').addEventListener('click', () => openModal('foodModal'));
    document.getElementById('addExerciseBtn').addEventListener('click', () => openModal('exerciseModal'));
    document.getElementById('foodForm').addEventListener('submit', handleAddFood);
    document.getElementById('exerciseForm').addEventListener('submit', handleAddExercise);

    // Modal Close
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            closeModal(e.target.closest('.modal').id);
        });
    });

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });

    // Settings
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);

    // Reports
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', handleFilterChange);
    });
    document.getElementById('applyFilterBtn').addEventListener('click', updateReports);

    // Set default date range for reports
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    document.getElementById('reportStartDate').valueAsDate = weekAgo;
    document.getElementById('reportEndDate').valueAsDate = today;
}

// Login Handler
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const data = await getData();

    if (data.users[username] && data.users[username] === password) {
        currentUser = username;
        sessionStorage.setItem('loggedInUser', username);
        
        // Remember user if checkbox is checked
        if (rememberMe) {
            localStorage.setItem('rememberedUser', username);
        }
        
        document.getElementById('loginError').textContent = '';
        showMainApp();
    } else {
        document.getElementById('loginError').textContent = 'Invalid username or password';
    }
}

// Register Handler
async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    const errorEl = document.getElementById('registerError');
    const successEl = document.getElementById('registerSuccess');
    errorEl.textContent = '';
    successEl.textContent = '';
    
    // Validation
    if (username.length < 3) {
        errorEl.textContent = 'Username must be at least 3 characters';
        return;
    }
    
    if (password.length < 4) {
        errorEl.textContent = 'Password must be at least 4 characters';
        return;
    }
    
    if (password !== confirmPassword) {
        errorEl.textContent = 'Passwords do not match';
        return;
    }
    
    const data = await getData();
    
    // Check if username already exists
    if (data.users[username]) {
        errorEl.textContent = 'Username already exists';
        return;
    }
    
    // Create new user
    data.users[username] = password;
    await saveData(data);
    
    successEl.textContent = 'Account created! You can now login.';
    document.getElementById('registerForm').reset();
    
    // Switch to login after 2 seconds
    setTimeout(() => {
        document.querySelector('.login-card:not(.register-card)').style.display = 'block';
        document.getElementById('registerCard').style.display = 'none';
        successEl.textContent = '';
    }, 2000);
}

// Logout Handler
function handleLogout() {
    sessionStorage.removeItem('loggedInUser');
    localStorage.removeItem('rememberedUser');
    currentUser = null;
    showLoginPage();
    document.getElementById('loginForm').reset();
    document.getElementById('rememberMe').checked = false;
}

// Page Navigation
function switchPage(pageName) {
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        }
    });

    // Update pages
    document.querySelectorAll('.app-page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageName + 'Page').classList.add('active');

    // Load page data
    if (pageName === 'tracker') {
        updateTracker();
    } else if (pageName === 'reports') {
        updateReports();
    }
}

// Date Handling
function handleDateChange(e) {
    currentDate = new Date(e.target.value);
    updateTracker();
}

function changeDate(days) {
    currentDate.setDate(currentDate.getDate() + days);
    document.getElementById('selectedDate').valueAsDate = currentDate;
    updateTracker();
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Tracker Update
async function updateTracker() {
    const dateKey = formatDate(currentDate);
    const userData = await getUserData();
    const dayData = userData.entries[dateKey] || { food: [], exercise: [] };

    // Update food list
    updateFoodList(dayData.food);
    
    // Update exercise list
    updateExerciseList(dayData.exercise);

    // Update summary
    updateSummary(dayData, userData.settings);
}

function updateFoodList(foodEntries) {
    const foodList = document.getElementById('foodList');
    
    if (!foodEntries || foodEntries.length === 0) {
        foodList.innerHTML = '<div class="empty-state">No food entries for this day</div>';
        return;
    }

    foodList.innerHTML = foodEntries.map((food, index) => {
        const nutritionInfo = [];
        if (food.protein) nutritionInfo.push(`P: ${food.protein}g`);
        if (food.carbs) nutritionInfo.push(`C: ${food.carbs}g`);
        if (food.fat) nutritionInfo.push(`F: ${food.fat}g`);
        
        return `
            <div class="entry-item">
                <div class="entry-info" onclick="editFood(${index})">
                    <div class="entry-name">${food.name}</div>
                    ${nutritionInfo.length > 0 ? `<div class="entry-nutrition">${nutritionInfo.join(' • ')}</div>` : ''}
                    ${food.notes ? `<div class="entry-notes">${food.notes}</div>` : ''}
                </div>
                <div class="entry-calories">${food.calories} cal</div>
                <div class="entry-actions">
                    <button class="entry-edit" onclick="editFood(${index})">✎</button>
                    <button class="entry-delete" onclick="deleteFood(${index})">×</button>
                </div>
            </div>
        `;
    }).join('');
}

function updateExerciseList(exerciseEntries) {
    const exerciseList = document.getElementById('exerciseList');
    
    if (!exerciseEntries || exerciseEntries.length === 0) {
        exerciseList.innerHTML = '<div class="empty-state">No exercise entries for this day</div>';
        return;
    }

    exerciseList.innerHTML = exerciseEntries.map((exercise, index) => `
        <div class="entry-item">
            <div class="entry-info" onclick="editExercise(${index})">
                <div class="entry-name">${exercise.name}</div>
                ${exercise.notes ? `<div class="entry-notes">${exercise.notes}</div>` : ''}
            </div>
            <div class="entry-calories">${exercise.calories} cal</div>
            <div class="entry-actions">
                <button class="entry-edit" onclick="editExercise(${index})">✎</button>
                <button class="entry-delete" onclick="deleteExercise(${index})">×</button>
            </div>
        </div>
    `).join('');
}

async function updateSummary(dayData, settings) {
    const consumed = dayData.food ? dayData.food.reduce((sum, f) => sum + Number(f.calories), 0) : 0;
    const burned = dayData.exercise ? dayData.exercise.reduce((sum, e) => sum + Number(e.calories), 0) : 0;
    const remaining = settings.targetCalories - consumed + burned;
    const deficit = settings.maintenanceCalories - consumed + burned;

    // Calculate nutrition totals
    const totalProtein = dayData.food ? dayData.food.reduce((sum, f) => sum + Number(f.protein || 0), 0) : 0;
    const totalCarbs = dayData.food ? dayData.food.reduce((sum, f) => sum + Number(f.carbs || 0), 0) : 0;
    const totalFat = dayData.food ? dayData.food.reduce((sum, f) => sum + Number(f.fat || 0), 0) : 0;
    const totalFiber = dayData.food ? dayData.food.reduce((sum, f) => sum + Number(f.fiber || 0), 0) : 0;
    const totalSugar = dayData.food ? dayData.food.reduce((sum, f) => sum + Number(f.sugar || 0), 0) : 0;
    const totalWater = dayData.food ? dayData.food.reduce((sum, f) => sum + Number(f.water || 0), 0) : 0;

    // Update display
    document.getElementById('targetCalories').textContent = settings.targetCalories;
    document.getElementById('consumedCalories').textContent = consumed;
    document.getElementById('burnedCalories').textContent = burned;
    document.getElementById('remainingCalories').textContent = remaining;

    // Update nutrition summary
    document.getElementById('totalProtein').textContent = totalProtein.toFixed(1);
    document.getElementById('totalCarbs').textContent = totalCarbs.toFixed(1);
    document.getElementById('totalFat').textContent = totalFat.toFixed(1);
    document.getElementById('totalFiber').textContent = totalFiber.toFixed(1);
    document.getElementById('totalSugar').textContent = totalSugar.toFixed(1);
    document.getElementById('totalWater').textContent = totalWater;
}

// Modal Handlers
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    // Reset forms and edit state
    if (modalId === 'foodModal') {
        document.getElementById('foodForm').reset();
        document.querySelector('#foodModal .modal-header h2').textContent = 'Add Food';
        editingFoodIndex = null;
    } else if (modalId === 'exerciseModal') {
        document.getElementById('exerciseForm').reset();
        document.querySelector('#exerciseModal .modal-header h2').textContent = 'Add Exercise';
        editingExerciseIndex = null;
    }
}

// Food Handlers
let editingFoodIndex = null;

async function handleAddFood(e) {
    e.preventDefault();
    const dateKey = formatDate(currentDate);
    const userData = await getUserData();

    if (!userData.entries[dateKey]) {
        userData.entries[dateKey] = { food: [], exercise: [] };
    }

    const foodEntry = {
        name: document.getElementById('foodName').value,
        calories: Number(document.getElementById('foodCalories').value),
        protein: Number(document.getElementById('foodProtein').value) || 0,
        carbs: Number(document.getElementById('foodCarbs').value) || 0,
        fat: Number(document.getElementById('foodFat').value) || 0,
        fiber: Number(document.getElementById('foodFiber').value) || 0,
        sugar: Number(document.getElementById('foodSugar').value) || 0,
        water: Number(document.getElementById('foodWater').value) || 0,
        notes: document.getElementById('foodNotes').value,
        timestamp: new Date().toISOString()
    };

    if (editingFoodIndex !== null) {
        // Update existing entry
        userData.entries[dateKey].food[editingFoodIndex] = foodEntry;
        editingFoodIndex = null;
    } else {
        // Add new entry
        userData.entries[dateKey].food.push(foodEntry);
    }
    
    await saveUserData(userData);
    closeModal('foodModal');
    await updateTracker();
}

async function deleteFood(index) {
    if (confirm('Delete this food entry?')) {
        const dateKey = formatDate(currentDate);
        const userData = await getUserData();
        userData.entries[dateKey].food.splice(index, 1);
        await saveUserData(userData);
        await updateTracker();
    }
}

async function editFood(index) {
    const dateKey = formatDate(currentDate);
    const userData = await getUserData();
    const food = userData.entries[dateKey].food[index];
    
    // Fill form with existing data
    document.getElementById('foodName').value = food.name;
    document.getElementById('foodCalories').value = food.calories;
    document.getElementById('foodProtein').value = food.protein || '';
    document.getElementById('foodCarbs').value = food.carbs || '';
    document.getElementById('foodFat').value = food.fat || '';
    document.getElementById('foodFiber').value = food.fiber || '';
    document.getElementById('foodSugar').value = food.sugar || '';
    document.getElementById('foodWater').value = food.water || '';
    document.getElementById('foodNotes').value = food.notes || '';
    
    editingFoodIndex = index;
    
    // Change modal title
    document.querySelector('#foodModal .modal-header h2').textContent = 'Edit Food';
    openModal('foodModal');
}

// Exercise Handlers
let editingExerciseIndex = null;

async function handleAddExercise(e) {
    e.preventDefault();
    const dateKey = formatDate(currentDate);
    const userData = await getUserData();

    if (!userData.entries[dateKey]) {
        userData.entries[dateKey] = { food: [], exercise: [] };
    }

    const exerciseEntry = {
        name: document.getElementById('exerciseName').value,
        calories: Number(document.getElementById('exerciseCalories').value),
        notes: document.getElementById('exerciseNotes').value,
        timestamp: new Date().toISOString()
    };

    if (editingExerciseIndex !== null) {
        // Update existing entry
        userData.entries[dateKey].exercise[editingExerciseIndex] = exerciseEntry;
        editingExerciseIndex = null;
    } else {
        // Add new entry
        userData.entries[dateKey].exercise.push(exerciseEntry);
    }
    
    await saveUserData(userData);
    closeModal('exerciseModal');
    await updateTracker();
}

async function deleteExercise(index) {
    if (confirm('Delete this exercise entry?')) {
        const dateKey = formatDate(currentDate);
        const userData = await getUserData();
        userData.entries[dateKey].exercise.splice(index, 1);
        await saveUserData(userData);
        await updateTracker();
    }
}

async function editExercise(index) {
    const dateKey = formatDate(currentDate);
    const userData = await getUserData();
    const exercise = userData.entries[dateKey].exercise[index];
    
    // Fill form with existing data
    document.getElementById('exerciseName').value = exercise.name;
    document.getElementById('exerciseCalories').value = exercise.calories;
    document.getElementById('exerciseNotes').value = exercise.notes || '';
    
    editingExerciseIndex = index;
    
    // Change modal title
    document.querySelector('#exerciseModal .modal-header h2').textContent = 'Edit Exercise';
    openModal('exerciseModal');
}

// Settings Handlers
async function loadSettings() {
    const userData = await getUserData();
    document.getElementById('maintenanceCalories').value = userData.settings.maintenanceCalories;
    document.getElementById('targetCaloriesInput').value = userData.settings.targetCalories;
}

async function saveSettings() {
    const userData = await getUserData();
    userData.settings.maintenanceCalories = Number(document.getElementById('maintenanceCalories').value);
    userData.settings.targetCalories = Number(document.getElementById('targetCaloriesInput').value);
    await saveUserData(userData);
    
    const successMsg = document.getElementById('settingsSuccess');
    successMsg.textContent = 'Settings saved successfully!';
    setTimeout(() => {
        successMsg.textContent = '';
    }, 3000);

    await updateTracker();
}

// Reports Handlers
function handleFilterChange(e) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    currentFilter = e.target.dataset.filter;
}

async function updateReports() {    const startDate = new Date(document.getElementById('reportStartDate').value);    const endDate = new Date(document.getElementById('reportEndDate').value);    const userData = await getUserData();    let chartData;    if (currentFilter === 'daily') {        chartData = getDailyData(userData, startDate, endDate);    } else if (currentFilter === 'weekly') {        chartData = getWeeklyData(userData, startDate, endDate);    } else {        chartData = getMonthlyData(userData, startDate, endDate);    }    renderCharts(chartData);}function getDailyData(userData, startDate, endDate) {    const labels = [];    const consumed = [];    const burned = [];    const net = [];    const protein = [];    const carbs = [];    const fat = [];    let currentDay = new Date(startDate);    while (currentDay <= endDate) {        const dateKey = formatDate(currentDay);        const dayData = userData.entries[dateKey] || { food: [], exercise: [] };
        
        const consumedCal = dayData.food.reduce((sum, f) => sum + Number(f.calories), 0);
        const burnedCal = dayData.exercise.reduce((sum, e) => sum + Number(e.calories), 0);
        const dayProtein = dayData.food.reduce((sum, f) => sum + Number(f.protein || 0), 0);
        const dayCarbs = dayData.food.reduce((sum, f) => sum + Number(f.carbs || 0), 0);
        const dayFat = dayData.food.reduce((sum, f) => sum + Number(f.fat || 0), 0);
        
        labels.push(dateKey);
        consumed.push(consumedCal);
        burned.push(burnedCal);
        net.push(consumedCal - burnedCal);
        protein.push(dayProtein);
        carbs.push(dayCarbs);
        fat.push(dayFat);

        currentDay.setDate(currentDay.getDate() + 1);
    }

    return { labels, consumed, burned, net, protein, carbs, fat };
}

function getWeeklyData(userData, startDate, endDate) {
    const weeklyData = {};
    
    let currentDay = new Date(startDate);
    while (currentDay <= endDate) {
        const weekStart = getWeekStart(currentDay);
        const weekKey = formatDate(weekStart);
        
        if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = { consumed: 0, burned: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
        }
        
        const dateKey = formatDate(currentDay);
        const dayData = userData.entries[dateKey] || { food: [], exercise: [] };
        
        weeklyData[weekKey].consumed += dayData.food.reduce((sum, f) => sum + Number(f.calories), 0);
        weeklyData[weekKey].burned += dayData.exercise.reduce((sum, e) => sum + Number(e.calories), 0);
        weeklyData[weekKey].protein += dayData.food.reduce((sum, f) => sum + Number(f.protein || 0), 0);
        weeklyData[weekKey].carbs += dayData.food.reduce((sum, f) => sum + Number(f.carbs || 0), 0);
        weeklyData[weekKey].fat += dayData.food.reduce((sum, f) => sum + Number(f.fat || 0), 0);
        weeklyData[weekKey].count++;

        currentDay.setDate(currentDay.getDate() + 1);
    }

    const labels = Object.keys(weeklyData).map(key => `Week of ${key}`);
    const consumed = Object.values(weeklyData).map(w => Math.round(w.consumed / w.count));
    const burned = Object.values(weeklyData).map(w => Math.round(w.burned / w.count));
    const net = consumed.map((c, i) => c - burned[i]);
    const protein = Object.values(weeklyData).map(w => Math.round(w.protein / w.count));
    const carbs = Object.values(weeklyData).map(w => Math.round(w.carbs / w.count));
    const fat = Object.values(weeklyData).map(w => Math.round(w.fat / w.count));

    return { labels, consumed, burned, net, protein, carbs, fat };
}

function getMonthlyData(userData, startDate, endDate) {
    const monthlyData = {};
    
    let currentDay = new Date(startDate);
    while (currentDay <= endDate) {
        const monthKey = `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { consumed: 0, burned: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
        }
        
        const dateKey = formatDate(currentDay);
        const dayData = userData.entries[dateKey] || { food: [], exercise: [] };
        
        monthlyData[monthKey].consumed += dayData.food.reduce((sum, f) => sum + Number(f.calories), 0);
        monthlyData[monthKey].burned += dayData.exercise.reduce((sum, e) => sum + Number(e.calories), 0);
        monthlyData[monthKey].protein += dayData.food.reduce((sum, f) => sum + Number(f.protein || 0), 0);
        monthlyData[monthKey].carbs += dayData.food.reduce((sum, f) => sum + Number(f.carbs || 0), 0);
        monthlyData[monthKey].fat += dayData.food.reduce((sum, f) => sum + Number(f.fat || 0), 0);
        monthlyData[monthKey].count++;

        currentDay.setDate(currentDay.getDate() + 1);
    }

    const labels = Object.keys(monthlyData);
    const consumed = Object.values(monthlyData).map(m => Math.round(m.consumed / m.count));
    const burned = Object.values(monthlyData).map(m => Math.round(m.burned / m.count));
    const net = consumed.map((c, i) => c - burned[i]);
    const protein = Object.values(monthlyData).map(m => Math.round(m.protein / m.count));
    const carbs = Object.values(monthlyData).map(m => Math.round(m.carbs / m.count));
    const fat = Object.values(monthlyData).map(m => Math.round(m.fat / m.count));

    return { labels, consumed, burned, net, protein, carbs, fat };
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
}

function renderCharts(chartData) {
    // Determine if mobile
    const isMobile = window.innerWidth < 768;
    
    // Calories Chart
    const ctx1 = document.getElementById('caloriesChart').getContext('2d');
    if (caloriesChart) {
        caloriesChart.destroy();
    }
    caloriesChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Consumed',
                    data: chartData.consumed,
                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                    borderColor: 'rgb(239, 68, 68)',
                    borderWidth: 1
                },
                {
                    label: 'Burned',
                    data: chartData.burned,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: isMobile ? 1 : 2,
            plugins: {
                title: {
                    display: true,
                    text: 'Calories Consumed vs Burned',
                    font: { size: isMobile ? 14 : 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: isMobile ? 12 : 40,
                        padding: isMobile ? 10 : 15,
                        font: { size: isMobile ? 11 : 12 }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: { size: isMobile ? 10 : 12 },
                        maxRotation: isMobile ? 45 : 0,
                        minRotation: isMobile ? 45 : 0
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: !isMobile,
                        text: 'Calories',
                        font: { size: isMobile ? 10 : 12 }
                    },
                    ticks: {
                        font: { size: isMobile ? 10 : 12 }
                    }
                }
            }
        }
    });

    // Net Calories Chart
    const ctx2 = document.getElementById('netCaloriesChart').getContext('2d');
    if (netCaloriesChart) {
        netCaloriesChart.destroy();
    }
    netCaloriesChart = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Net Calories',
                data: chartData.net,
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderColor: 'rgb(37, 99, 235)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointRadius: isMobile ? 3 : 4,
                pointHoverRadius: isMobile ? 5 : 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: isMobile ? 1 : 2,
            plugins: {
                title: {
                    display: true,
                    text: 'Net Calories (Consumed - Burned)',
                    font: { size: isMobile ? 14 : 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: isMobile ? 12 : 40,
                        padding: isMobile ? 10 : 15,
                        font: { size: isMobile ? 11 : 12 }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: { size: isMobile ? 10 : 12 },
                        maxRotation: isMobile ? 45 : 0,
                        minRotation: isMobile ? 45 : 0
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: !isMobile,
                        text: 'Net Calories',
                        font: { size: isMobile ? 10 : 12 }
                    },
                    ticks: {
                        font: { size: isMobile ? 10 : 12 }
                    }
                }
            }
        }
    });

    // Nutrition Chart (Macros)
    const ctx3 = document.getElementById('nutritionChart').getContext('2d');
    if (nutritionChart) {
        nutritionChart.destroy();
    }
    nutritionChart = new Chart(ctx3, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Protein (g)',
                    data: chartData.protein,
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1
                },
                {
                    label: 'Carbs (g)',
                    data: chartData.carbs,
                    backgroundColor: 'rgba(251, 191, 36, 0.7)',
                    borderColor: 'rgb(251, 191, 36)',
                    borderWidth: 1
                },
                {
                    label: 'Fat (g)',
                    data: chartData.fat,
                    backgroundColor: 'rgba(236, 72, 153, 0.7)',
                    borderColor: 'rgb(236, 72, 153)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: isMobile ? 1 : 2,
            plugins: {
                title: {
                    display: true,
                    text: 'Macronutrients (Protein, Carbs, Fat)',
                    font: { size: isMobile ? 14 : 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: isMobile ? 12 : 40,
                        padding: isMobile ? 10 : 15,
                        font: { size: isMobile ? 11 : 12 }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: { size: isMobile ? 10 : 12 },
                        maxRotation: isMobile ? 45 : 0,
                        minRotation: isMobile ? 45 : 0
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: !isMobile,
                        text: 'Grams',
                        font: { size: isMobile ? 10 : 12 }
                    },
                    ticks: {
                        font: { size: isMobile ? 10 : 12 }
                    }
                }
            }
        }
    });
}

// Handle window resize for charts
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const currentPage = document.querySelector('.app-page.active').id;
        if (currentPage === 'reportsPage' && caloriesChart && netCaloriesChart && nutritionChart) {
            updateReports();
        }
    }, 250);
});
