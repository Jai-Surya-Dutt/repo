# 🌱 Frontend Integration Guide

This guide explains how to integrate the Civil Sathi frontend with the backend API.

## 🔗 API Base URL

```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

## 🔐 Authentication

### Register User
```javascript
async function registerUser(userData) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  });
  
  const data = await response.json();
  
  if (data.status === 'success') {
    // Store token in localStorage
    localStorage.setItem('token', data.data.token);
    return data.data.user;
  } else {
    throw new Error(data.message);
  }
}
```

### Login User
```javascript
async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (data.status === 'success') {
    localStorage.setItem('token', data.data.token);
    return data.data.user;
  } else {
    throw new Error(data.message);
  }
}
```

### Get Auth Headers
```javascript
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}
```

## 👤 User Management

### Get User Profile
```javascript
async function getUserProfile() {
  const response = await fetch(`${API_BASE_URL}/users/profile`, {
    headers: getAuthHeaders()
  });
  
  const data = await response.json();
  return data.data.user;
}
```

### Update User Profile
```javascript
async function updateUserProfile(profileData) {
  const response = await fetch(`${API_BASE_URL}/users/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ profile: profileData })
  });
  
  const data = await response.json();
  return data.data.user;
}
```

### Get User Statistics
```javascript
async function getUserStats() {
  const response = await fetch(`${API_BASE_URL}/users/stats`, {
    headers: getAuthHeaders()
  });
  
  const data = await response.json();
  return data.data;
}
```

## 📋 Task Management

### Get User Tasks
```javascript
async function getUserTasks(status = 'active', limit = 20) {
  const response = await fetch(`${API_BASE_URL}/tasks?status=${status}&limit=${limit}`, {
    headers: getAuthHeaders()
  });
  
  const data = await response.json();
  return data.data.tasks;
}
```

### Create Task
```javascript
async function createTask(taskData) {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData)
  });
  
  const data = await response.json();
  return data.data.task;
}
```

### Update Task Progress
```javascript
async function updateTaskProgress(taskId, increment = 1) {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/progress`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ increment })
  });
  
  const data = await response.json();
  return data.data;
}
```

## 📸 Photo Upload

### Upload Photo
```javascript
async function uploadPhoto(photoFile, photoData) {
  const formData = new FormData();
  formData.append('photo', photoFile);
  formData.append('category', photoData.category);
  formData.append('description', photoData.description || '');
  formData.append('isPublic', photoData.isPublic || false);
  
  if (photoData.location) {
    formData.append('location[latitude]', photoData.location.latitude);
    formData.append('location[longitude]', photoData.location.longitude);
  }
  
  const response = await fetch(`${API_BASE_URL}/photos/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: formData
  });
  
  const data = await response.json();
  return data.data.photo;
}
```

### Get User Photos
```javascript
async function getUserPhotos(category = null, limit = 20) {
  let url = `${API_BASE_URL}/photos?limit=${limit}`;
  if (category) url += `&category=${category}`;
  
  const response = await fetch(url, {
    headers: getAuthHeaders()
  });
  
  const data = await response.json();
  return data.data.photos;
}
```

## 💰 Transactions

### Get Transaction History
```javascript
async function getTransactionHistory(limit = 20, offset = 0) {
  const response = await fetch(`${API_BASE_URL}/transactions?limit=${limit}&offset=${offset}`, {
    headers: getAuthHeaders()
  });
  
  const data = await response.json();
  return data.data.transactions;
}
```

### Create Selfie Cleanup Transaction
```javascript
async function createSelfieCleanupTransaction(photoId, location) {
  const response = await fetch(`${API_BASE_URL}/transactions/selfie-cleanup`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      photoId,
      location,
      description: 'Selfie cleanup verification'
    })
  });
  
  const data = await response.json();
  return data.data;
}
```

## 🎁 Rewards

### Get Available Vouchers
```javascript
async function getAvailableVouchers(category = null, maxCredits = null) {
  let url = `${API_BASE_URL}/rewards/vouchers`;
  const params = new URLSearchParams();
  
  if (category) params.append('category', category);
  if (maxCredits) params.append('maxCredits', maxCredits);
  
  if (params.toString()) url += `?${params.toString()}`;
  
  const response = await fetch(url);
  const data = await response.json();
  return data.data.vouchers;
}
```

### Redeem Voucher
```javascript
async function redeemVoucher(voucherId, purchaseAmount = 0) {
  const response = await fetch(`${API_BASE_URL}/rewards/vouchers/${voucherId}/redeem`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ purchaseAmount })
  });
  
  const data = await response.json();
  return data.data;
}
```

## 🏆 Leaderboard

### Get Leaderboard
```javascript
async function getLeaderboard(type = 'credits', limit = 10) {
  const response = await fetch(`${API_BASE_URL}/users/leaderboard?type=${type}&limit=${limit}`);
  const data = await response.json();
  return data.data.leaderboard;
}
```

## 🔄 Error Handling

### API Error Handler
```javascript
function handleApiError(error, response) {
  if (response && response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  
  if (response && response.status === 403) {
    // Forbidden
    throw new Error('Access denied');
  }
  
  if (response && response.status >= 500) {
    // Server error
    throw new Error('Server error. Please try again later.');
  }
  
  throw new Error(error.message || 'An error occurred');
}
```

### API Request Wrapper
```javascript
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    
    return data;
  } catch (error) {
    handleApiError(error, response);
  }
}
```

## 🎯 Complete Integration Example

### Update Frontend Script
```javascript
// Replace the existing script.js with this enhanced version

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Global variables
let userCredits = 0;
let cleanupCount = 0;
let tasksCompleted = 0;
let currentUser = null;
let currentStream = null;
let capturedPhoto = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  checkAuthStatus();
  initializeApp();
  setupEventListeners();
  loadUserData();
  updateUI();
});

// Check if user is authenticated
async function checkAuthStatus() {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        currentUser = data.data.user;
        userCredits = currentUser.credits;
        cleanupCount = currentUser.stats.totalCleanups;
        tasksCompleted = currentUser.stats.tasksCompleted;
      }
    } catch (error) {
      console.error('Auth verification failed:', error);
      localStorage.removeItem('token');
    }
  }
}

// Enhanced submit photo function
async function submitPhoto() {
  if (!capturedPhoto) return;
  
  try {
    // Upload photo first
    const photoBlob = await dataURLToBlob(capturedPhoto);
    const photoData = {
      category: 'selfie_cleanup',
      description: 'Environmental cleanup verification',
      isPublic: true
    };
    
    const photo = await uploadPhoto(photoBlob, photoData);
    
    // Create transaction
    const transactionData = await createSelfieCleanupTransaction(photo._id, {
      latitude: 0, // You can get this from geolocation API
      longitude: 0
    });
    
    // Update local state
    userCredits += transactionData.creditsEarned;
    cleanupCount++;
    
    // Update UI
    updateUI();
    showNotification(`Great job! You earned ${transactionData.creditsEarned} credits!`, 'success');
    
    // Reset camera
    resetCamera();
    
  } catch (error) {
    console.error('Error submitting photo:', error);
    showNotification('Error submitting photo. Please try again.', 'error');
  }
}

// Enhanced task update function
async function updateTask(taskType) {
  try {
    // Get user's active tasks
    const tasks = await getUserTasks('active');
    const task = tasks.find(t => t.type === taskType);
    
    if (!task) {
      showNotification('Task not found', 'error');
      return;
    }
    
    if (task.status !== 'active') {
      showNotification('This task is already completed!', 'info');
      return;
    }
    
    // Update task progress
    const result = await updateTaskProgress(task._id, 1);
    
    if (result.wasCompleted) {
      userCredits += task.reward.credits;
      tasksCompleted++;
      showNotification(`Task completed! You earned ${task.reward.credits} credits!`, 'success');
    }
    
    updateUI();
    
  } catch (error) {
    console.error('Error updating task:', error);
    showNotification('Error updating task. Please try again.', 'error');
  }
}

// Enhanced voucher redemption
async function redeemVoucher(cost, discount) {
  try {
    if (userCredits < cost) {
      showNotification(`You need ${cost} credits to redeem this voucher. You currently have ${userCredits} credits.`, 'error');
      return;
    }
    
    // Get available vouchers
    const vouchers = await getAvailableVouchers();
    const voucher = vouchers.find(v => v.cost.credits === cost);
    
    if (!voucher) {
      showNotification('Voucher not available', 'error');
      return;
    }
    
    // Redeem voucher
    const result = await redeemVoucher(voucher._id, 100); // Example purchase amount
    
    userCredits -= cost;
    addRedeemedVoucher(discount, cost);
    updateUI();
    showNotification(`Voucher redeemed! You now have ${userCredits} credits remaining.`, 'success');
    
  } catch (error) {
    console.error('Error redeeming voucher:', error);
    showNotification('Error redeeming voucher. Please try again.', 'error');
  }
}

// Helper function to convert data URL to blob
function dataURLToBlob(dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// ... rest of your existing functions remain the same
```

## 🚀 Getting Started

1. **Start the backend server**:
   ```bash
   cd civil-sathi-backend
   npm install
   npm run setup
   ```

2. **Update your frontend**:
   - Replace the API calls in your `script.js` with the functions above
   - Update the API base URL to match your backend server
   - Add authentication flow to your HTML

3. **Test the integration**:
   - Register a new user
   - Login and verify authentication
   - Upload photos and complete tasks
   - Check transaction history and redeem vouchers

## 📝 Notes

- Make sure CORS is properly configured in your backend
- Handle authentication errors gracefully
- Implement proper loading states for API calls
- Add error boundaries for better user experience
- Consider implementing offline functionality with local storage fallback
