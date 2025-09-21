# 🌱 Civil Sathi Backend API

A comprehensive Node.js backend server for the Civil Sathi environmental cleaning platform, featuring MongoDB database, JWT authentication, and blockchain-style transaction tracking.

## 🚀 Features

- **User Authentication**: JWT-based registration, login, and profile management
- **Task Management**: Create, track, and complete environmental tasks
- **Photo Upload**: Selfie verification system with image processing
- **Blockchain Transactions**: Credit tracking with transaction hashes and block numbers
- **Rewards System**: Voucher redemption and management
- **Environmental Impact**: Track CO₂ savings, waste recycled, and trees planted
- **Achievement System**: Unlock badges for environmental actions
- **Leaderboards**: Community rankings and statistics

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd civil-sathi-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/civil-sathi
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### Verify Token
```http
POST /api/auth/verify
Authorization: Bearer <jwt-token>
```

### User Endpoints

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <jwt-token>
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Environmental enthusiast"
  }
}
```

#### Get User Statistics
```http
GET /api/users/stats
Authorization: Bearer <jwt-token>
```

#### Get Leaderboard
```http
GET /api/users/leaderboard?type=credits&limit=10
```

### Task Endpoints

#### Get User Tasks
```http
GET /api/tasks?status=active&limit=20&offset=0
Authorization: Bearer <jwt-token>
```

#### Create Task
```http
POST /api/tasks
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "type": "recycle",
  "title": "Recycle 5 plastic bottles",
  "description": "Collect and recycle 5 plastic bottles",
  "target": 5,
  "reward": {
    "credits": 50
  },
  "priority": "medium",
  "category": "environmental"
}
```

#### Update Task Progress
```http
POST /api/tasks/:id/progress
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "increment": 1
}
```

### Photo Endpoints

#### Upload Photo
```http
POST /api/photos/upload
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data

photo: <file>
category: "selfie_cleanup"
description: "Cleaning up the park"
location: {
  "latitude": 40.7128,
  "longitude": -74.0060
}
tags: ["cleanup", "environment"]
isPublic: true
```

#### Get User Photos
```http
GET /api/photos?category=selfie_cleanup&limit=20
Authorization: Bearer <jwt-token>
```

#### Get Public Photos
```http
GET /api/photos/public?category=environmental_action&limit=20
```

### Transaction Endpoints

#### Get Transaction History
```http
GET /api/transactions?limit=20&offset=0&type=selfie_cleanup
Authorization: Bearer <jwt-token>
```

#### Get Transaction Statistics
```http
GET /api/transactions/stats
Authorization: Bearer <jwt-token>
```

#### Create Selfie Cleanup Transaction
```http
POST /api/transactions/selfie-cleanup
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "photoId": "photo_id_here",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "description": "Selfie cleanup verification"
}
```

### Rewards Endpoints

#### Get Available Vouchers
```http
GET /api/rewards/vouchers?category=shopping&maxCredits=500&limit=20
```

#### Redeem Voucher
```http
POST /api/rewards/vouchers/:id/redeem
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "purchaseAmount": 100.00
}
```

#### Validate Voucher Code
```http
GET /api/rewards/vouchers/validate/CS12345678
```

## 🗄️ Database Schema

### User Model
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    bio: String
  },
  credits: Number (default: 0),
  stats: {
    totalCleanups: Number,
    tasksCompleted: Number,
    environmentalImpact: {
      co2Saved: Number,
      wasteRecycled: Number,
      treesPlanted: Number
    }
  },
  achievements: [Achievement],
  isActive: Boolean,
  lastLogin: Date
}
```

### Task Model
```javascript
{
  user: ObjectId (ref: User),
  type: String (recycle, plant, cleanup, energy, custom),
  title: String,
  description: String,
  target: Number,
  current: Number,
  reward: {
    credits: Number,
    experience: Number
  },
  status: String (active, completed, expired, cancelled),
  priority: String (low, medium, high, urgent),
  category: String (environmental, social, educational, health, community),
  dueDate: Date,
  verification: {
    required: Boolean,
    method: String,
    evidence: [Evidence]
  }
}
```

### Transaction Model
```javascript
{
  user: ObjectId (ref: User),
  hash: String (unique),
  type: String (selfie_cleanup, task_completion, voucher_redemption, etc.),
  category: String (earning, spending, bonus, penalty),
  amount: Number,
  description: String,
  status: String (pending, confirmed, failed, cancelled),
  blockNumber: Number,
  metadata: {
    taskId: ObjectId,
    photoId: ObjectId,
    voucherId: ObjectId,
    location: Location,
    environmentalImpact: EnvironmentalImpact
  }
}
```

### Photo Model
```javascript
{
  user: ObjectId (ref: User),
  filename: String,
  originalName: String,
  url: String,
  thumbnailUrl: String,
  mimeType: String,
  size: Number,
  dimensions: {
    width: Number,
    height: Number
  },
  category: String (selfie_cleanup, task_verification, environmental_action, etc.),
  status: String (pending, verified, rejected, processing),
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  verification: {
    isVerified: Boolean,
    verifiedAt: Date,
    verifiedBy: ObjectId,
    confidence: Number
  }
}
```

### Voucher Model
```javascript
{
  code: String (unique),
  name: String,
  description: String,
  type: String (percentage, fixed_amount, free_shipping, etc.),
  value: Number,
  cost: {
    credits: Number,
    cash: Number
  },
  validity: {
    startDate: Date,
    endDate: Date,
    isActive: Boolean
  },
  usage: {
    limit: {
      total: Number,
      perUser: Number,
      used: Number
    }
  },
  partner: {
    name: String,
    logo: String,
    website: String
  }
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment mode | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/civil-sathi |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `MAX_FILE_SIZE` | Max upload file size (bytes) | 5242880 (5MB) |
| `UPLOAD_PATH` | File upload directory | ./uploads |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `CORS_ORIGIN` | Allowed CORS origins | http://localhost:3000,http://127.0.0.1:5500 |

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📁 Project Structure

```
civil-sathi-backend/
├── models/                 # Database models
│   ├── User.js
│   ├── Task.js
│   ├── Transaction.js
│   ├── Photo.js
│   └── Voucher.js
├── routes/                 # API routes
│   ├── auth.js
│   ├── users.js
│   ├── tasks.js
│   ├── transactions.js
│   ├── photos.js
│   └── rewards.js
├── middleware/             # Custom middleware
│   └── auth.js
├── uploads/               # File uploads directory
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── env.example           # Environment variables template
└── BACKEND_README.md     # This file
```

## 🚀 Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start server.js --name civil-sathi-api
pm2 save
pm2 startup
```

### Using Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Setup
1. Set up MongoDB Atlas or local MongoDB instance
2. Configure environment variables
3. Set up file storage (local or cloud)
4. Configure reverse proxy (nginx)
5. Set up SSL certificates
6. Configure monitoring and logging

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet.js security headers
- Input validation and sanitization
- File upload restrictions
- SQL injection prevention (MongoDB)

## 📊 Monitoring

- Health check endpoint: `GET /api/health`
- Request logging
- Error tracking
- Performance monitoring
- Database query optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**Civil Sathi Backend** - Powering environmental change through technology! 🌱
