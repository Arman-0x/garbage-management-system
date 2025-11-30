const API_URL = "https://garbage-management-system-zw6z.onrender.com/api";
let token = localStorage.getItem('token');
let currentUser = null;

// Check if user is logged in on page load
if (token) {
  checkAuth();
}

// Show/Hide forms
function showLogin() {
  document.getElementById('loginForm').classList.add('active');
  document.getElementById('registerForm').classList.remove('active');
}

function showRegister() {
  document.getElementById('registerForm').classList.add('active');
  document.getElementById('loginForm').classList.remove('active');
}

// Handle Register
async function handleRegister(e) {
  e.preventDefault();
  
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      token = data.token;
      localStorage.setItem('token', token);
      currentUser = data.user;
      showDashboard();
    } else {
      alert(data.error);
    }
  } catch (error) {
    alert('Registration failed');
  }
}

// Handle Login
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      token = data.token;
      localStorage.setItem('token', token);
      currentUser = data.user;
      showDashboard();
    } else {
      alert(data.error);
    }
  } catch (error) {
    alert('Login failed');
  }
}

// Check Authentication
async function checkAuth() {
  try {
    const response = await fetch(`${API_URL}/user`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      showDashboard();
    } else {
      logout();
    }
  } catch (error) {
    logout();
  }
}

// Show Dashboard
function showDashboard() {
  document.getElementById('authSection').style.display = 'none';
  document.getElementById('dashboardSection').style.display = 'block';
  document.getElementById('userName').textContent = currentUser.name;
  loadReports();
}

// Logout
function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  document.getElementById('authSection').style.display = 'flex';
  document.getElementById('dashboardSection').style.display = 'none';
  showLogin();
}

// Tab Navigation
function showTab(tabName) {
  const tabs = document.querySelectorAll('.tab-content');
  const buttons = document.querySelectorAll('.tab-btn');
  
  tabs.forEach(tab => tab.classList.remove('active'));
  buttons.forEach(btn => btn.classList.remove('active'));
  
  document.getElementById(`${tabName}Tab`).classList.add('active');
  event.target.classList.add('active');
  
  if (tabName === 'reports' || tabName === 'history') {
    loadReports();
  }
}

// Load Reports
async function loadReports() {
  try {
    const response = await fetch(`${API_URL}/detections`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const detections = await response.json();
    
    // Display in reports grid
    const reportsGrid = document.getElementById('reportsGrid');
    reportsGrid.innerHTML = detections.slice(0, 6).map(d => createReportCard(d)).join('');
    
    // Display in history
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = detections.map(d => createHistoryItem(d)).join('');
  } catch (error) {
    console.error('Failed to load reports');
  }
}

// Create Report Card
function createReportCard(detection) {
  const severityClass = `severity-${detection.severity.toLowerCase()}`;
  const statusClass = `status-${detection.status.toLowerCase().replace(' ', '-')}`;
  
  return `
    <div class="report-card">
      <div class="report-header">
        <div class="report-type">${detection.garbageType}</div>
        <span class="severity-badge ${severityClass}">${detection.severity}</span>
      </div>
      <div class="report-info">📍 ${detection.location}</div>
      <div class="report-info">📅 ${new Date(detection.createdAt).toLocaleDateString()}</div>
      <div class="report-info">👤 ${detection.reportedBy?.name || 'Unknown'}</div>
      ${detection.description ? `<p style="margin-top:10px;color:#666;font-size:14px;">${detection.description}</p>` : ''}
      <span class="status-badge ${statusClass}">${detection.status}</span>
      <div class="report-actions">
        ${detection.status !== 'Resolved' ? `<button class="btn-small btn-resolve" onclick="updateStatus('${detection._id}', 'Resolved')">Mark Resolved</button>` : ''}
        <button class="btn-small btn-delete" onclick="deleteReport('${detection._id}')">Delete</button>
      </div>
    </div>
  `;
}

// Create History Item
function createHistoryItem(detection) {
  const statusClass = `status-${detection.status.toLowerCase().replace(' ', '-')}`;
  
  return `
    <div class="history-item">
      <div>
        <strong>${detection.garbageType}</strong> - ${detection.location}
        <br>
        <small style="color:#666;">${new Date(detection.createdAt).toLocaleString()}</small>
      </div>
      <span class="status-badge ${statusClass}">${detection.status}</span>
    </div>
  `;
}

// Add Report
async function handleAddReport(e) {
  e.preventDefault();
  
  const location = document.getElementById('location').value;
  const garbageType = document.getElementById('garbageType').value;
  const severity = document.getElementById('severity').value;
  const description = document.getElementById('description').value;
  
  try {
    const response = await fetch(`${API_URL}/detections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ location, garbageType, severity, description })
    });
    
    if (response.ok) {
      alert('Report submitted successfully!');
      e.target.reset();
      showTab('reports');
      loadReports();
    }
  } catch (error) {
    alert('Failed to submit report');
  }
}

// Update Status
async function updateStatus(id, status) {
  try {
    await fetch(`${API_URL}/detections/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    loadReports();
  } catch (error) {
    alert('Failed to update status');
  }
}

// Delete Report
async function deleteReport(id) {
  if (!confirm('Are you sure you want to delete this report?')) return;
  
  try {
    await fetch(`${API_URL}/detections/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    loadReports();
  } catch (error) {
    alert('Failed to delete report');
  }
}