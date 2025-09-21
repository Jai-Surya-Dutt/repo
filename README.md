# 🌱 Civil Sathi - Environmental Cleaning Platform

**"Cleaning with Earning"**

Civil Sathi is an innovative environmental platform that gamifies environmental cleaning activities. Users can record videos of their environmental actions, earn credits, and redeem them for rewards.

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v16 or higher)
- Python 3.x (for frontend server)
- Modern web browser with camera access

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd civil-sathi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the servers**

   **Option 1: Quick Start (Recommended)**
   ```bash
   # Terminal 1 - Backend Server
   npm run dev
   
   # Terminal 2 - Frontend Server  
   python -m http.server 8080
   ```

   **Option 2: Manual Start**
   ```bash
   # Terminal 1 - Backend Server
   npm start
   
   # Terminal 2 - Frontend Server
   python -m http.server 8080
   ```

4. **Access the application**
   - Open your browser and go to: `http://localhost:8080`
   - Backend API: `http://localhost:5000`

## 🎥 Features

### Video Recording System
- **Selfie Clean**: Record environmental cleanup actions
- **Daily Tasks**: Video recording for various environmental challenges
- **Credit System**: Earn credits for each video submission
- **Video Storage**: All videos stored securely on server

### Environmental Challenges
- ♻️ **Recycle Challenge**: 50 credits
- 🌱 **Plant a Tree**: 100 credits  
- 🧹 **Community Cleanup**: 75 credits
- ⚡ **Energy Saving**: 30 credits
- 📸 **Selfie Clean**: 10 credits

### User Management
- User registration and authentication
- JWT-based secure sessions
- User profiles and statistics
- Credit tracking and rewards

## 🛠️ Development

### Project Structure
```
civil-sathi/
├── routes/           # API endpoints
├── middleware/       # Authentication middleware
├── models/          # Data models
├── utils/           # Utility functions
├── uploads/         # File storage
│   ├── photos/      # Photo uploads
│   └── videos/      # Video uploads
├── data/            # JSON database
├── scripts/         # Setup scripts
└── public/          # Frontend files
```

### API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/videos/upload` - Video upload
- `GET /api/videos/user` - User's videos
- `GET /api/health` - Health check

### Environment Variables
Create a `.env` file:
```env
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
```

## 🎯 Usage Instructions

### For Users
1. **Register/Login**: Create an account or login
2. **Record Videos**: 
   - Go to "Selfie Clean" section
   - Click "Start Camera" to begin recording
   - Perform your environmental action
   - Click "Stop Recording" when done
   - Submit the video to earn credits
3. **Complete Tasks**: Use the "Daily Tasks" section for more challenges
4. **Redeem Rewards**: Use your credits in the "Rewards" section

### For Developers
1. **Backend Development**: 
   - Server runs on port 5000
   - Uses nodemon for auto-restart
   - File-based JSON database
2. **Frontend Development**:
   - Served on port 8080
   - Uses vanilla JavaScript
   - Camera API for video recording

## 🔧 Troubleshooting

### Common Issues

**Port 5000 already in use:**
```bash
# Find and kill the process
netstat -ano | findstr :5000
taskkill /PID <process-id> /F
```

**Camera not working:**
- Ensure browser has camera permissions
- Use HTTPS in production
- Check browser console for errors

**Video upload fails:**
- Check server logs
- Verify file size (max 100MB)
- Ensure user is authenticated

### Server Management

**Start servers:**
```bash
# Backend (Terminal 1)
npm run dev

# Frontend (Terminal 2)  
python -m http.server 8080
```

**Stop servers:**
- Press `Ctrl+C` in each terminal
- Or kill processes manually

**Reset database:**
```bash
# Clear all data
rm -rf data/*.json
npm run init-data
```

## 📱 Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

**Required Features:**
- Camera API support
- MediaRecorder API
- ES6+ JavaScript support

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- File upload validation
- CORS protection
- Rate limiting
- Input validation

## 📊 Database

The application uses a file-based JSON database:
- `data/users.json` - User accounts
- `data/videos.json` - Video records
- `data/tasks.json` - Task data
- `data/transactions.json` - Transaction history

## 🎨 Customization

### Logo
The logo is displayed in the navigation bar. To update:
1. Replace the logo in the HTML
2. Update the CSS styling
3. Ensure proper sizing and alignment

### Styling
- Main styles: `styles.css`
- Responsive design included
- Custom color scheme
- Modern UI components

## 📈 Performance

- File-based storage for simplicity
- Efficient video compression
- Optimized image handling
- Minimal dependencies

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Use a proper database (MongoDB/PostgreSQL)
3. Set up HTTPS
4. Configure proper file storage
5. Set up monitoring and logging

### Docker (Optional)
```dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review server logs
3. Check browser console
4. Create an issue on GitHub

---

**Civil Sathi** - Making environmental action rewarding! 🌱✨