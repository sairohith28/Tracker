// Application State
let currentUser = null;
let currentDate = new Date();
let currentFilter = 'daily';
let caloriesChart = null;
let netCaloriesChart = null;
let isFirebaseReady = false;

// Data Structure
const defaultData = {
    users: {
        'admin': 'admin123' // Default username and password
    },
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
            window.addEventListener('firebase-ready', () => {
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
    
    // Wait for Firebase
    await waitForFirebase();
    
    await initializeData();
    checkAuth();
    setupEventListeners();
    
    // Hide loading state
    hideLoadingState();
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
    if (!data.users || !data.settings || !data.entries) {
        await saveData(defaultData);
    }
}

// Authentication
function checkAuth() {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (loggedInUser) {
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
    // Login
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

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
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const data = await getData();

    if (data.users[username] && data.users[username] === password) {
        currentUser = username;
        sessionStorage.setItem('loggedInUser', username);
        document.getElementById('loginError').textContent = '';
        showMainApp();
    } else {
        document.getElementById('loginError').textContent = 'Invalid username or password';
    }
}

// Logout Handler
function handleLogout() {
    sessionStorage.removeItem('loggedInUser');
    currentUser = null;
    showLoginPage();
    document.getElementById('loginForm').reset();
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
    const data = await getData();
    const dayData = data.entries[dateKey] || { food: [], exercise: [] };

    // Update food list
    updateFoodList(dayData.food);
    
    // Update exercise list
    updateExerciseList(dayData.exercise);

    // Update summary
    updateSummary(dayData);
}

function updateFoodList(foodEntries) {
    const foodList = document.getElementById('foodList');
    
    if (!foodEntries || foodEntries.length === 0) {
        foodList.innerHTML = '<div class="empty-state">No food entries for this day</div>';
        return;
    }

    foodList.innerHTML = foodEntries.map((food, index) => `
        <div class="entry-item">
            <div class="entry-info">
                <div class="entry-name">${food.name}</div>
                ${food.notes ? `<div class="entry-notes">${food.notes}</div>` : ''}
            </div>
            <div class="entry-calories">${food.calories} cal</div>
            <button class="entry-delete" onclick="deleteFood(${index})">×</button>
        </div>
    `).join('');
}

function updateExerciseList(exerciseEntries) {
    const exerciseList = document.getElementById('exerciseList');
    
    if (!exerciseEntries || exerciseEntries.length === 0) {
        exerciseList.innerHTML = '<div class="empty-state">No exercise entries for this day</div>';
        return;
    }

    exerciseList.innerHTML = exerciseEntries.map((exercise, index) => `
        <div class="entry-item">
            <div class="entry-info">
                <div class="entry-name">${exercise.name}</div>
                ${exercise.notes ? `<div class="entry-notes">${exercise.notes}</div>` : ''}
            </div>
            <div class="entry-calories">${exercise.calories} cal</div>
            <button class="entry-delete" onclick="deleteExercise(${index})">×</button>
        </div>
    `).join('');
}

async function updateSummary(dayData) {
    const data = await getData();
    const settings = data.settings;
    
    const consumed = dayData.food ? dayData.food.reduce((sum, f) => sum + Number(f.calories), 0) : 0;
    const burned = dayData.exercise ? dayData.exercise.reduce((sum, e) => sum + Number(e.calories), 0) : 0;
    const remaining = settings.targetCalories - consumed + burned;
    const deficit = settings.maintenanceCalories - consumed + burned;

    // Update display
    document.getElementById('targetCalories').textContent = settings.targetCalories;
    document.getElementById('consumedCalories').textContent = consumed;
    document.getElementById('burnedCalories').textContent = burned;
    document.getElementById('remainingCalories').textContent = remaining;

    // Update status banner
    const statusBanner = document.getElementById('statusBanner');
    const statusText = document.getElementById('statusText');
    
    if (deficit > 0) {
        statusBanner.className = 'status-banner success';
        statusText.textContent = `${settings.maintenanceCalories} - ${consumed} + ${burned} = ${deficit} calories deficit today`;
    } else if (deficit === 0) {
        statusBanner.className = 'status-banner warning';
        statusText.textContent = `${settings.maintenanceCalories} - ${consumed} + ${burned} = Maintenance calories achieved`;
    } else {
        statusBanner.className = 'status-banner danger';
        statusText.textContent = `${settings.maintenanceCalories} - ${consumed} + ${burned} = ${Math.abs(deficit)} calories surplus today`;
    }
}

// Modal Handlers
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    // Reset forms
    if (modalId === 'foodModal') {
        document.getElementById('foodForm').reset();
    } else if (modalId === 'exerciseModal') {
        document.getElementById('exerciseForm').reset();
    }
}

// Food Handlers
async function handleAddFood(e) {
    e.preventDefault();
    const dateKey = formatDate(currentDate);
    const data = await getData();

    if (!data.entries[dateKey]) {
        data.entries[dateKey] = { food: [], exercise: [] };
    }

    const foodEntry = {
        name: document.getElementById('foodName').value,
        calories: Number(document.getElementById('foodCalories').value),
        notes: document.getElementById('foodNotes').value,
        timestamp: new Date().toISOString()
    };

    data.entries[dateKey].food.push(foodEntry);
    await saveData(data);
    closeModal('foodModal');
    await updateTracker();
}

async function deleteFood(index) {
    if (confirm('Delete this food entry?')) {
        const dateKey = formatDate(currentDate);
        const data = await getData();
        data.entries[dateKey].food.splice(index, 1);
        await saveData(data);
        await updateTracker();
    }
}

// Exercise Handlers
async function handleAddExercise(e) {
    e.preventDefault();
    const dateKey = formatDate(currentDate);
    const data = await getData();

    if (!data.entries[dateKey]) {
        data.entries[dateKey] = { food: [], exercise: [] };
    }

    const exerciseEntry = {
        name: document.getElementById('exerciseName').value,
        calories: Number(document.getElementById('exerciseCalories').value),
        notes: document.getElementById('exerciseNotes').value,
        timestamp: new Date().toISOString()
    };

    data.entries[dateKey].exercise.push(exerciseEntry);
    await saveData(data);
    closeModal('exerciseModal');
    await updateTracker();
}

async function deleteExercise(index) {
    if (confirm('Delete this exercise entry?')) {
        const dateKey = formatDate(currentDate);
        const data = await getData();
        data.entries[dateKey].exercise.splice(index, 1);
        await saveData(data);
        await updateTracker();
    }
}

// Settings Handlers
async function loadSettings() {
    const data = await getData();
    document.getElementById('maintenanceCalories').value = data.settings.maintenanceCalories;
    document.getElementById('targetCaloriesInput').value = data.settings.targetCalories;
}

async function saveSettings() {
    const data = await getData();
    data.settings.maintenanceCalories = Number(document.getElementById('maintenanceCalories').value);
    data.settings.targetCalories = Number(document.getElementById('targetCaloriesInput').value);
    await saveData(data);
    
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

async function updateReports() {
    const startDate = new Date(document.getElementById('reportStartDate').value);
    const endDate = new Date(document.getElementById('reportEndDate').value);
    const data = await getData();

    let chartData;
    if (currentFilter === 'daily') {
        chartData = getDailyData(data, startDate, endDate);
    } else if (currentFilter === 'weekly') {
        chartData = getWeeklyData(data, startDate, endDate);
    } else {
        chartData = getMonthlyData(data, startDate, endDate);
    }

    renderCharts(chartData);
}

function getDailyData(data, startDate, endDate) {
    const labels = [];
    const consumed = [];
    const burned = [];
    const net = [];

    let currentDay = new Date(startDate);
    while (currentDay <= endDate) {
        const dateKey = formatDate(currentDay);
        const dayData = data.entries[dateKey] || { food: [], exercise: [] };
        
        const consumedCal = dayData.food.reduce((sum, f) => sum + Number(f.calories), 0);
        const burnedCal = dayData.exercise.reduce((sum, e) => sum + Number(e.calories), 0);
        
        labels.push(dateKey);
        consumed.push(consumedCal);
        burned.push(burnedCal);
        net.push(consumedCal - burnedCal);

        currentDay.setDate(currentDay.getDate() + 1);
    }

    return { labels, consumed, burned, net };
}

function getWeeklyData(data, startDate, endDate) {
    const weeklyData = {};
    
    let currentDay = new Date(startDate);
    while (currentDay <= endDate) {
        const weekStart = getWeekStart(currentDay);
        const weekKey = formatDate(weekStart);
        
        if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = { consumed: 0, burned: 0, count: 0 };
        }
        
        const dateKey = formatDate(currentDay);
        const dayData = data.entries[dateKey] || { food: [], exercise: [] };
        
        weeklyData[weekKey].consumed += dayData.food.reduce((sum, f) => sum + Number(f.calories), 0);
        weeklyData[weekKey].burned += dayData.exercise.reduce((sum, e) => sum + Number(e.calories), 0);
        weeklyData[weekKey].count++;

        currentDay.setDate(currentDay.getDate() + 1);
    }

    const labels = Object.keys(weeklyData).map(key => `Week of ${key}`);
    const consumed = Object.values(weeklyData).map(w => Math.round(w.consumed / w.count));
    const burned = Object.values(weeklyData).map(w => Math.round(w.burned / w.count));
    const net = consumed.map((c, i) => c - burned[i]);

    return { labels, consumed, burned, net };
}

function getMonthlyData(data, startDate, endDate) {
    const monthlyData = {};
    
    let currentDay = new Date(startDate);
    while (currentDay <= endDate) {
        const monthKey = `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { consumed: 0, burned: 0, count: 0 };
        }
        
        const dateKey = formatDate(currentDay);
        const dayData = data.entries[dateKey] || { food: [], exercise: [] };
        
        monthlyData[monthKey].consumed += dayData.food.reduce((sum, f) => sum + Number(f.calories), 0);
        monthlyData[monthKey].burned += dayData.exercise.reduce((sum, e) => sum + Number(e.calories), 0);
        monthlyData[monthKey].count++;

        currentDay.setDate(currentDay.getDate() + 1);
    }

    const labels = Object.keys(monthlyData);
    const consumed = Object.values(monthlyData).map(m => Math.round(m.consumed / m.count));
    const burned = Object.values(monthlyData).map(m => Math.round(m.burned / m.count));
    const net = consumed.map((c, i) => c - burned[i]);

    return { labels, consumed, burned, net };
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
}

// Handle window resize for charts
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const currentPage = document.querySelector('.app-page.active').id;
        if (currentPage === 'reportsPage' && caloriesChart && netCaloriesChart) {
            updateReports();
        }
    }, 250);
});
