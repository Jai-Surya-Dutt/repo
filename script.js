// Civil Sathi - Main Frontend Script

let userCredits = 0;
let cleanupCount = 0;
let tasksCompleted = 0;
let currentUser = null;

// Video recording variables
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let currentStream = null;

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🌱 Civil Sathi frontend loaded");

  // Wait for auth module to be available
  if (typeof auth !== 'undefined' && auth.isLoggedIn()) {
    currentUser = await auth.getUser();
    if (currentUser) {
      showUserInfo(currentUser);
      userCredits = currentUser.credits || 0;
      updateUI();
    } else {
      showAuthButtons();
    }
  } else {
    showAuthButtons();
  }

  setupUIListeners();
});

function showUserInfo(user) {
  document.getElementById("authButtons").style.display = "none";
  document.getElementById("userInfo").style.display = "flex";
  document.getElementById("userName").textContent =
    "Welcome, " + (user.username || "User") + "!";
}

function showAuthButtons() {
  document.getElementById("authButtons").style.display = "flex";
  document.getElementById("userInfo").style.display = "none";
}

function updateUI() {
  document.getElementById("currentCredits").textContent = userCredits;
  document.getElementById("cleanupCount").textContent = cleanupCount;
  document.getElementById("tasksCompleted").textContent = tasksCompleted;
}

function setupUIListeners() {
  document.getElementById("loginBtn").onclick = () => {
    document.getElementById("loginModal").style.display = "block";
  };
  document.getElementById("registerBtn").onclick = () => {
    document.getElementById("registerModal").style.display = "block";
  };
  document.getElementById("logoutBtn").onclick = async () => {
    await auth.logout();
    currentUser = null;
    showAuthButtons();
  };

  // Login
  document.getElementById("loginForm").onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    // Clear previous errors
    document.getElementById("loginError").style.display = "none";

    try {
      currentUser = await auth.login(email, password);
      userCredits = currentUser.credits || 0;
      document.getElementById("loginModal").style.display = "none";
      document.getElementById("loginForm").reset(); // Clear form
      showUserInfo(currentUser);
      updateUI();
    } catch (err) {
      document.getElementById("loginError").textContent = err.message;
      document.getElementById("loginError").style.display = "block";
    }
  };

  // Register
  document.getElementById("registerForm").onsubmit = async (e) => {
    e.preventDefault();
    const username = document.getElementById("registerUsername").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
    const firstName = document.getElementById("registerFirstName").value;
    const lastName = document.getElementById("registerLastName").value;

    // Clear previous errors
    document.getElementById("registerError").style.display = "none";

    try {
      currentUser = await auth.register({
        username,
        email,
        password,
        firstName,
        lastName,
      });
      userCredits = currentUser.credits || 0;
      document.getElementById("registerModal").style.display = "none";
      document.getElementById("registerForm").reset(); // Clear form
      showUserInfo(currentUser);
      updateUI();
    } catch (err) {
      document.getElementById("registerError").textContent = err.message;
      document.getElementById("registerError").style.display = "block";
    }
  };
}

// Video Recording Functions
async function startVideoRecording() {
  try {
    console.log('🎥 Starting video recording...');
    
    // Request camera and microphone access
    currentStream = await navigator.mediaDevices.getUserMedia({
      video: { 
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: true
    });

    console.log('📹 Camera access granted, setting up video element...');

    // Set up video element
    const video = document.getElementById('video');
    if (video) {
      video.srcObject = currentStream;
      video.muted = true; // Mute to avoid feedback
      video.playsInline = true; // For mobile compatibility
      video.style.display = 'block'; // Make sure video is visible
      
      // Wait for video to load
      video.onloadedmetadata = () => {
        console.log('📺 Video metadata loaded, starting playback...');
        video.play().catch(e => console.error('Video play error:', e));
      };
      
      console.log('✅ Video element configured');
    } else {
      console.error('❌ Video element not found!');
    }

    // Set up MediaRecorder
    mediaRecorder = new MediaRecorder(currentStream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    recordedChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      
      // Show video preview
      const preview = document.getElementById('videoPreview');
      if (preview) {
        preview.style.display = 'block';
        const videoElement = preview.querySelector('video');
        if (videoElement) {
          videoElement.src = url;
          videoElement.controls = true;
        }
      }

      // Enable submit button
      const submitBtn = document.getElementById('submitVideo');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Video for Credits';
      }
    };

    // Start recording
    mediaRecorder.start();
    isRecording = true;

    // Update UI
    const startBtn = document.getElementById('startCamera');
    const stopBtn = document.getElementById('stopRecording');
    
    if (startBtn) startBtn.textContent = 'Recording...';
    if (startBtn) startBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;
    if (stopBtn) stopBtn.style.display = 'inline-block';

    console.log('🎥 Video recording started');

  } catch (error) {
    console.error('Error starting video recording:', error);
    alert('Error accessing camera. Please check permissions and try again.');
  }
}

function stopVideoRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;

    // Stop all tracks
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    // Update UI
    const startBtn = document.getElementById('startCamera');
    const stopBtn = document.getElementById('stopRecording');
    
    if (startBtn) {
      startBtn.textContent = 'Start Camera';
      startBtn.disabled = false;
    }
    if (stopBtn) {
      stopBtn.disabled = true;
      stopBtn.style.display = 'none';
    }

    console.log('🛑 Video recording stopped');
  }
}

async function submitVideo(actionType = 'selfie-clean', description = '') {
  if (recordedChunks.length === 0) {
    alert('No video recorded. Please record a video first.');
    return;
  }

  try {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    console.log('Video blob size:', blob.size, 'bytes');
    
    if (blob.size === 0) {
      throw new Error('No video data recorded. Please record a video first.');
    }
    
    const formData = new FormData();
    formData.append('video', blob, `video-${Date.now()}.webm`);
    formData.append('actionType', actionType);
    formData.append('description', description);
    
    console.log('FormData prepared, submitting video...');
    console.log('Action type:', actionType);
    console.log('Description:', description);

    const submitBtn = document.getElementById('submitVideo');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    const response = await auth.authenticatedRequest('/api/videos/upload', {
      method: 'POST',
      body: formData
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error response:', errorText);
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    if (!responseText) {
      throw new Error('Empty response from server');
    }
    
    const data = JSON.parse(responseText);
    console.log('Parsed response data:', data);

    // Update user credits
    userCredits = data.data.user.credits;
    updateUI();

    // Show success message
    alert(`🎉 Video submitted successfully! You earned ${data.data.video.creditsEarned} credits!`);
    
    // Reset video recording
    resetVideoRecording();
    
    // Update user info if available
    if (currentUser) {
      currentUser.credits = userCredits;
      currentUser.stats = data.data.user.stats;
    }

  } catch (error) {
    console.error('Error submitting video:', error);
    alert('Error submitting video: ' + error.message);
    
    const submitBtn = document.getElementById('submitVideo');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Video for Credits';
    }
  }
}

function resetVideoRecording() {
  console.log('🔄 Resetting video recording...');
  
  // Clear recorded chunks (this only clears local recording, not server storage)
  recordedChunks = [];
  
  // Reset UI
  const preview = document.getElementById('videoPreview');
  if (preview) {
    preview.style.display = 'none';
  }

  const submitBtn = document.getElementById('submitVideo');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submit Video for Credits';
  }

  const startBtn = document.getElementById('startCamera');
  if (startBtn) {
    startBtn.textContent = 'Start Camera';
    startBtn.disabled = false;
  }

  const stopBtn = document.getElementById('stopRecording');
  if (stopBtn) {
    stopBtn.disabled = true;
    stopBtn.style.display = 'none';
  }

  // Stop camera stream but don't clear video element immediately
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }

  // Clear video element after a short delay
  setTimeout(() => {
    const video = document.getElementById('video');
    if (video) {
      video.srcObject = null;
      video.style.display = 'none';
    }
  }, 1000);

  console.log('✅ Video recording reset (video stored on server)');
}

// Task-specific video recording functions
async function startTaskVideoRecording(taskType) {
  try {
    // Request camera and microphone access
    currentStream = await navigator.mediaDevices.getUserMedia({
      video: { 
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'environment' // Use back camera for tasks
      },
      audio: true
    });

    // Set up MediaRecorder
    mediaRecorder = new MediaRecorder(currentStream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    recordedChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      
      // Show video preview in task modal
      showTaskVideoPreview(taskType, url);
    };

    // Start recording
    mediaRecorder.start();
    isRecording = true;

    // Update task UI
    updateTaskRecordingUI(taskType, true);

    console.log(`🎥 Task video recording started for: ${taskType}`);

  } catch (error) {
    console.error('Error starting task video recording:', error);
    alert('Error accessing camera. Please check permissions and try again.');
  }
}

function stopTaskVideoRecording(taskType) {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;

    // Stop all tracks
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    // Update task UI
    updateTaskRecordingUI(taskType, false);

    console.log(`🛑 Task video recording stopped for: ${taskType}`);
  }
}

function updateTaskRecordingUI(taskType, isRecording) {
  const taskCard = document.querySelector(`[data-task="${taskType}"]`);
  if (!taskCard) return;

  const startBtn = taskCard.querySelector('.btn-start-recording');
  const stopBtn = taskCard.querySelector('.btn-stop-recording');
  const submitBtn = taskCard.querySelector('.btn-submit-video');

  if (isRecording) {
    if (startBtn) {
      startBtn.textContent = 'Recording...';
      startBtn.disabled = true;
    }
    if (stopBtn) {
      stopBtn.style.display = 'inline-block';
      stopBtn.disabled = false;
    }
  } else {
    if (startBtn) {
      startBtn.textContent = 'Start Recording';
      startBtn.disabled = false;
    }
    if (stopBtn) {
      stopBtn.style.display = 'none';
      stopBtn.disabled = true;
    }
    if (submitBtn) {
      submitBtn.style.display = 'inline-block';
      submitBtn.disabled = false;
    }
  }
}

function showTaskVideoPreview(taskType, videoUrl) {
  // Create or update video preview modal
  let previewModal = document.getElementById('taskVideoPreview');
  if (!previewModal) {
    previewModal = document.createElement('div');
    previewModal.id = 'taskVideoPreview';
    previewModal.className = 'modal';
    previewModal.innerHTML = `
      <div class="modal-content">
        <span class="close" onclick="closeTaskVideoPreview()">&times;</span>
        <h2>📹 Task Video Preview</h2>
        <video controls style="width: 100%; max-width: 500px;">
          <source src="${videoUrl}" type="video/webm">
        </video>
        <div style="margin-top: 20px;">
          <button class="btn btn-primary" onclick="submitTaskVideo('${taskType}')">Submit Video</button>
          <button class="btn btn-secondary" onclick="closeTaskVideoPreview()">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(previewModal);
  } else {
    const video = previewModal.querySelector('video');
    if (video) {
      video.src = videoUrl;
    }
  }
  
  previewModal.style.display = 'block';
}

function closeTaskVideoPreview() {
  const previewModal = document.getElementById('taskVideoPreview');
  if (previewModal) {
    previewModal.style.display = 'none';
  }
}

async function submitTaskVideo(taskType) {
  if (recordedChunks.length === 0) {
    alert('No video recorded. Please record a video first.');
    return;
  }

  try {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const formData = new FormData();
    formData.append('video', blob, `task-${taskType}-${Date.now()}.webm`);
    formData.append('actionType', taskType);
    formData.append('description', `Completed ${taskType} task`);

    const response = await auth.authenticatedRequest('/api/videos/upload', {
      method: 'POST',
      body: formData
    });

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Update user credits
    userCredits = data.data.user.credits;
    updateUI();

    // Show success message
    alert(`🎉 Task video submitted successfully! You earned ${data.data.video.creditsEarned} credits!`);
    
    // Close preview modal
    closeTaskVideoPreview();
    
    // Reset task recording
    resetTaskRecording(taskType);
    
    // Update user info
    if (currentUser) {
      currentUser.credits = userCredits;
      currentUser.stats = data.data.user.stats;
    }

  } catch (error) {
    console.error('Error submitting task video:', error);
    alert('Error submitting task video: ' + error.message);
  }
}

function resetTaskRecording(taskType) {
  // Clear recorded chunks
  recordedChunks = [];
  
  // Reset task UI
  const taskCard = document.querySelector(`[data-task="${taskType}"]`);
  if (taskCard) {
    const startBtn = taskCard.querySelector('.btn-start-recording');
    const stopBtn = taskCard.querySelector('.btn-stop-recording');
    const submitBtn = taskCard.querySelector('.btn-submit-video');

    if (startBtn) {
      startBtn.textContent = 'Start Recording';
      startBtn.disabled = false;
    }
    if (stopBtn) {
      stopBtn.style.display = 'none';
      stopBtn.disabled = true;
    }
    if (submitBtn) {
      submitBtn.style.display = 'none';
      submitBtn.disabled = true;
    }
  }

  console.log(`🔄 Task recording reset for: ${taskType}`);
}
