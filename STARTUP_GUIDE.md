# 🚀 Civil Sathi - Quick Startup Guide

## 📋 Prerequisites
- ✅ Node.js (v16 or higher)
- ✅ Python 3.x
- ✅ Modern web browser

## 🎯 Quick Start (3 Methods)

### Method 1: Windows Batch File (Easiest)
```bash
# Double-click the file or run:
start-servers.bat
```

### Method 2: Manual Start
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend  
python -m http.server 8080
```

### Method 3: Using Package Scripts
```bash
# Install concurrently first (one-time)
npm install -g concurrently

# Then start both servers
npm run start-all
```

## 🌐 Access Your Application
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 🎥 Test Video Recording
1. Open http://localhost:8080
2. Register/Login
3. Go to "Selfie Clean" section
4. Click "Start Camera"
5. Record a video
6. Submit and earn credits!

## 🛑 Stop Servers
- **Windows**: Close terminal windows or press `Ctrl+C`
- **Linux/Mac**: Press `Ctrl+C` in terminal
- **Batch file**: Close the opened terminal windows

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Find and kill process
netstat -ano | findstr :5000
taskkill /PID <process-id> /F
```

### Camera Not Working
- Allow camera permissions in browser
- Use HTTPS in production
- Check browser console for errors

### Video Upload Issues
- Check server logs
- Verify file size (max 100MB)
- Ensure user is authenticated

## 📁 Project Structure
```
civil-sathi/
├── start-servers.bat     # Windows startup script
├── start-servers.sh      # Linux/Mac startup script
├── README.md             # Full documentation
├── STARTUP_GUIDE.md      # This file
├── server.js             # Backend server
├── index.html            # Frontend
├── auth.js               # Authentication
├── script.js             # Frontend logic
└── uploads/videos/       # Video storage
```

## 🎉 You're Ready!
Your Civil Sathi environmental platform is now running with:
- ✅ Video recording system
- ✅ Credit rewards
- ✅ User authentication
- ✅ Beautiful Civil Sathi logo
- ✅ Environmental challenges

**Happy cleaning and earning! 🌱✨**
