const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class FileStorage {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.ensureDataDir();
    }

    ensureDataDir() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    getFilePath(collection) {
        return path.join(this.dataDir, `${collection}.json`);
    }

    readData(collection) {
        try {
            const filePath = this.getFilePath(collection);
            if (!fs.existsSync(filePath)) {
                return [];
            }
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading ${collection}:`, error);
            return [];
        }
    }

    writeData(collection, data) {
        try {
            const filePath = this.getFilePath(collection);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`Error writing ${collection}:`, error);
            return false;
        }
    }

    generateId() {
        return crypto.randomBytes(16).toString('hex');
    }

    // User operations
    createUser(userData) {
        const users = this.readData('users');
        const user = {
            _id: this.generateId(),
            ...userData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        users.push(user);
        this.writeData('users', users);
        return user;
    }

    findUser(query) {
        const users = this.readData('users');
        return users.find(user => {
            if (query._id) return user._id === query._id;
            if (query.email) return user.email === query.email;
            if (query.username) return user.username === query.username;
            return false;
        });
    }

    updateUser(userId, updateData) {
        const users = this.readData('users');
        const userIndex = users.findIndex(user => user._id === userId);
        if (userIndex !== -1) {
            users[userIndex] = {
                ...users[userIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            this.writeData('users', users);
            return users[userIndex];
        }
        return null;
    }

    // Task operations
    createTask(taskData) {
        const tasks = this.readData('tasks');
        const task = {
            _id: this.generateId(),
            ...taskData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        tasks.push(task);
        this.writeData('tasks', tasks);
        return task;
    }

    findTasks(query = {}) {
        const tasks = this.readData('tasks');
        return tasks.filter(task => {
            if (query.user && task.user !== query.user) return false;
            if (query.status && task.status !== query.status) return false;
            if (query.type && task.type !== query.type) return false;
            return true;
        });
    }

    updateTask(taskId, updateData) {
        const tasks = this.readData('tasks');
        const taskIndex = tasks.findIndex(task => task._id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            this.writeData('tasks', tasks);
            return tasks[taskIndex];
        }
        return null;
    }

    // Transaction operations
    createTransaction(transactionData) {
        const transactions = this.readData('transactions');
        const transaction = {
            _id: this.generateId(),
            ...transactionData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        transactions.push(transaction);
        this.writeData('transactions', transactions);
        return transaction;
    }

    findTransactions(query = {}) {
        const transactions = this.readData('transactions');
        return transactions.filter(transaction => {
            if (query.user && transaction.user !== query.user) return false;
            if (query.type && transaction.type !== query.type) return false;
            if (query.status && transaction.status !== query.status) return false;
            return true;
        });
    }

    // Photo operations
    createPhoto(photoData) {
        const photos = this.readData('photos');
        const photo = {
            _id: this.generateId(),
            ...photoData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        photos.push(photo);
        this.writeData('photos', photos);
        return photo;
    }

    findPhotos(query = {}) {
        const photos = this.readData('photos');
        return photos.filter(photo => {
            if (query.user && photo.user !== query.user) return false;
            if (query.category && photo.category !== query.category) return false;
            if (query.status && photo.status !== query.status) return false;
            return true;
        });
    }

    updatePhoto(photoId, updateData) {
        const photos = this.readData('photos');
        const photoIndex = photos.findIndex(photo => photo._id === photoId);
        if (photoIndex !== -1) {
            photos[photoIndex] = {
                ...photos[photoIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            this.writeData('photos', photos);
            return photos[photoIndex];
        }
        return null;
    }

    // Voucher operations
    createVoucher(voucherData) {
        const vouchers = this.readData('vouchers');
        const voucher = {
            _id: this.generateId(),
            ...voucherData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        vouchers.push(voucher);
        this.writeData('vouchers', vouchers);
        return voucher;
    }

    findVouchers(query = {}) {
        const vouchers = this.readData('vouchers');
        return vouchers.filter(voucher => {
            if (query.category && voucher.metadata?.category !== query.category) return false;
            if (query.maxCredits && voucher.cost?.credits > query.maxCredits) return false;
            if (query.featured !== undefined && voucher.metadata?.featured !== query.featured) return false;
            return true;
        });
    }

    updateVoucher(voucherId, updateData) {
        const vouchers = this.readData('vouchers');
        const voucherIndex = vouchers.findIndex(voucher => voucher._id === voucherId);
        if (voucherIndex !== -1) {
            vouchers[voucherIndex] = {
                ...vouchers[voucherIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            this.writeData('vouchers', vouchers);
            return vouchers[voucherIndex];
        }
        return null;
    }

    // Video operations
    createVideo(videoData) {
        const videos = this.readData('videos');
        const video = {
            _id: this.generateId(),
            ...videoData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        videos.push(video);
        this.writeData('videos', videos);
        return video;
    }

    getVideos() {
        return this.readData('videos');
    }

    saveVideos(videos) {
        this.writeData('videos', videos);
    }

    findVideos(query = {}) {
        const videos = this.readData('videos');
        return videos.filter(video => {
            if (query.userId && video.userId !== query.userId) return false;
            if (query.actionType && video.actionType !== query.actionType) return false;
            if (query.status && video.status !== query.status) return false;
            return true;
        });
    }

    updateVideo(videoId, updateData) {
        const videos = this.readData('videos');
        const videoIndex = videos.findIndex(video => video._id === videoId);
        if (videoIndex !== -1) {
            videos[videoIndex] = {
                ...videos[videoIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            this.writeData('videos', videos);
            return videos[videoIndex];
        }
        return null;
    }

    // Statistics
    getUserStats(userId) {
        const transactions = this.findTransactions({ user: userId });
        const totalTransactions = transactions.length;
        const totalEarned = transactions
            .filter(t => t.category === 'earning')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalSpent = transactions
            .filter(t => t.category === 'spending')
            .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
        const avgTransactionAmount = totalTransactions > 0 ? 
            transactions.reduce((sum, t) => sum + (t.amount || 0), 0) / totalTransactions : 0;
        const lastTransactionDate = totalTransactions > 0 ? 
            transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt : null;

        return {
            totalTransactions,
            totalEarned,
            totalSpent,
            avgTransactionAmount,
            lastTransactionDate
        };
    }
}

module.exports = new FileStorage();
