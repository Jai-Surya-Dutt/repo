// Civil Sathi - Main Frontend Script

let userCredits = 0;
let cleanupCount = 0;
let tasksCompleted = 0;
let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🌱 Civil Sathi frontend loaded");

  if (auth.isLoggedIn()) {
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

    try {
      currentUser = await auth.login(email, password);
      userCredits = currentUser.credits || 0;
      document.getElementById("loginModal").style.display = "none";
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
      showUserInfo(currentUser);
      updateUI();
    } catch (err) {
      document.getElementById("registerError").textContent = err.message;
      document.getElementById("registerError").style.display = "block";
    }
  };
}
