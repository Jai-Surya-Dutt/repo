# 🌱 Civil Sathi - Complete Setup Guide

This guide will help you set up both the frontend and backend for the Civil Sathi environmental cleaning platform.

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- A modern web browser

## 🚀 Quick Start

### Step 1: Set up the Backend

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your settings:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/civil-sathi
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads
   ```

3. **Start MongoDB**:
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

4. **Initialize database**:
   ```bash
   npm run init-db
   ```

5. **Start the backend server**:
   ```bash
   npm start
   ```

   The backend will be running on `http://localhost:5000`

### Step 2: Set up the Frontend

1. **Open the frontend**:
   - Simply open `index.html` in your web browser
   - Or use a local server like Live Server in VS Code

2. **Test the connection**:
   - Open the browser's developer console (F12)
   - You should see "Civil Sathi JavaScript with Backend Integration loaded successfully!"
   - If the backend is running, you should see API calls in the Network tab

## 🔧 Configuration

### Backend Configuration

The backend is configured through the `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/civil-sathi |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `MAX_FILE_SIZE` | Max upload file size (bytes) | 5242880 (5MB) |
| `UPLOAD_PATH` | File upload directory | ./uploads |

### Frontend Configuration

The frontend API URL is configured in `script.js`:

```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

If your backend is running on a different port or host, update this URL.

## 🎯 Features Available

### ✅ Working Features

1. **User Authentication**:
   - User registration and login
   - JWT token-based authentication
   - Automatic token verification

2. **Photo Upload**:
   - Camera access for selfie capture
   - Photo upload to backend
   - Image processing and thumbnails

3. **Task Management**:
   - Create and track environmental tasks
   - Progress tracking with API sync
   - Credit rewards for task completion

4. **Blockchain Transactions**:
   - Real transaction hashes and block numbers
   - Credit tracking with backend sync
   - Transaction history

5. **Voucher System**:
   - Real voucher data from backend
   - Credit-based redemption
   - Voucher validation

6. **Environmental Impact**:
   - CO₂ savings tracking
   - Waste recycled tracking
   - Trees planted tracking

7. **Achievements**:
   - Automatic achievement unlocking
   - Progress-based badges

## 🧪 Testing the Integration

### Test User Registration

1. Click "Register" in the navigation
2. Fill out the registration form
3. Check the browser console for success messages
4. Verify the user appears in the database

### Test Photo Upload

1. Login with a registered user
2. Go to "Selfie Clean" section
3. Click "Start Camera" and allow camera access
4. Capture a photo and submit
5. Check for credit earning and transaction creation

### Test Task Completion

1. Go to "Daily Tasks" section
2. Click "Mark Complete" on any task
3. Verify credits are earned
4. Check task progress updates

### Test Voucher Redemption

1. Go to "Rewards" section
2. Click "Redeem" on any voucher
3. Verify credits are deducted
4. Check redeemed voucher appears

## 🔍 Troubleshooting

### Common Issues

1. **Backend not starting**:
   - Check if MongoDB is running
   - Verify the `.env` file is configured correctly
   - Check if port 5000 is available

2. **Frontend not connecting to backend**:
   - Verify the backend is running on `http://localhost:5000`
   - Check browser console for CORS errors
   - Ensure the API_BASE_URL is correct

3. **Photo upload failing**:
   - Check if the uploads directory exists
   - Verify file size limits
   - Check browser permissions for camera access

4. **Authentication issues**:
   - Clear browser localStorage
   - Check JWT_SECRET in .env file
   - Verify token expiration settings

### Debug Mode

Enable debug logging by opening browser console (F12) and looking for:
- API request/response logs
- Error messages
- Authentication status

## 📊 Database Management

### View Data

Connect to MongoDB and explore the data:

```bash
# Connect to MongoDB
mongo

# Use the database
use civil-sathi

# View collections
show collections

# View users
db.users.find().pretty()

# View tasks
db.tasks.find().pretty()

# View transactions
db.transactions.find().pretty()
```

### Reset Database

To reset the database:

```bash
# Drop the database
mongo civil-sathi --eval "db.dropDatabase()"

# Reinitialize
npm run init-db
```

## 🚀 Deployment

### Backend Deployment

1. **Set production environment variables**:
   ```env
   NODE_ENV=production
   MONGODB_URI=mongodb://your-production-mongodb-uri
   JWT_SECRET=your-production-secret
   ```

2. **Start with PM2**:
   ```bash
   npm install -g pm2
   pm2 start server.js --name civil-sathi-api
   pm2 save
   pm2 startup
   ```

### Frontend Deployment

1. **Update API URL** in `script.js`:
   ```javascript
   const API_BASE_URL = 'https://your-backend-domain.com/api';
   ```

2. **Deploy to any static hosting**:
   - GitHub Pages
   - Netlify
   - Vercel
   - AWS S3

## 📱 Mobile Support

The frontend is fully responsive and works on:
- Desktop browsers
- Mobile browsers
- Tablet browsers

Camera functionality requires HTTPS in production.

## 🔒 Security Notes

- Always use HTTPS in production
- Keep JWT secrets secure
- Validate all user inputs
- Implement rate limiting
- Use environment variables for sensitive data

## 🆘 Support

If you encounter issues:

1. Check the browser console for errors
2. Verify backend logs
3. Check database connectivity
4. Review the API documentation in `BACKEND_README.md`

## 🎉 Success!

Once everything is set up, you should have:

- ✅ A fully functional environmental cleaning platform
- ✅ User authentication and management
- ✅ Photo upload and verification
- ✅ Task tracking and completion
- ✅ Credit system with blockchain-style transactions
- ✅ Voucher redemption system
- ✅ Environmental impact tracking
- ✅ Achievement system

Enjoy using Civil Sathi! 🌱
