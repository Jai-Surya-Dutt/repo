#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Voucher = require('../models/Voucher');

async function initializeDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civil-sathi', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Create sample vouchers
    console.log('🎁 Creating sample vouchers...');
    
    const sampleVouchers = [
      {
        name: 'Amazon Shopping Voucher',
        description: 'Get 30% off on any Amazon purchase',
        type: 'percentage',
        value: 30,
        cost: { credits: 100 },
        validity: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          isActive: true
        },
        usage: {
          limit: { total: 1000, perUser: 3, used: 0 }
        },
        partner: {
          name: 'Amazon',
          website: 'https://amazon.com',
          description: 'World\'s largest online marketplace'
        },
        metadata: {
          category: 'shopping',
          featured: true,
          priority: 10
        }
      },
      {
        name: 'Premium Shopping Voucher',
        description: 'Get 40% off on any purchase',
        type: 'percentage',
        value: 40,
        cost: { credits: 200 },
        validity: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          isActive: true
        },
        usage: {
          limit: { total: 500, perUser: 2, used: 0 }
        },
        partner: {
          name: 'Premium Partners',
          website: 'https://premium-partners.com',
          description: 'Premium shopping experience'
        },
        metadata: {
          category: 'shopping',
          featured: true,
          priority: 8
        }
      },
      {
        name: 'Elite Voucher',
        description: 'Get 50% off + Free Shipping',
        type: 'percentage',
        value: 50,
        cost: { credits: 500 },
        validity: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          isActive: true
        },
        usage: {
          limit: { total: 100, perUser: 1, used: 0 }
        },
        partner: {
          name: 'Elite Partners',
          website: 'https://elite-partners.com',
          description: 'Exclusive elite shopping'
        },
        metadata: {
          category: 'shopping',
          featured: true,
          priority: 5
        }
      },
      {
        name: 'Food Delivery Voucher',
        description: 'Get 25% off on food delivery',
        type: 'percentage',
        value: 25,
        cost: { credits: 75 },
        validity: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
          isActive: true
        },
        usage: {
          limit: { total: 2000, perUser: 5, used: 0 }
        },
        partner: {
          name: 'Food Delivery Co',
          website: 'https://fooddelivery.com',
          description: 'Fast and fresh food delivery'
        },
        metadata: {
          category: 'food',
          featured: false,
          priority: 7
        }
      },
      {
        name: 'Travel Voucher',
        description: 'Get $50 off on travel bookings',
        type: 'fixed_amount',
        value: 50,
        cost: { credits: 300 },
        validity: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          isActive: true
        },
        usage: {
          limit: { total: 300, perUser: 2, used: 0 }
        },
        partner: {
          name: 'Travel Agency',
          website: 'https://travelagency.com',
          description: 'Your trusted travel partner'
        },
        metadata: {
          category: 'travel',
          featured: true,
          priority: 6
        }
      }
    ];

    // Clear existing vouchers and create new ones
    await Voucher.deleteMany({});
    await Voucher.insertMany(sampleVouchers);
    console.log('✅ Sample vouchers created');

    // Create admin user if it doesn't exist
    console.log('👤 Creating admin user...');
    const adminExists = await User.findOne({ email: 'admin@civilsathi.com' });
    if (!adminExists) {
      const adminUser = new User({
        username: 'admin',
        email: 'admin@civilsathi.com',
        password: 'AdminPass123',
        profile: {
          firstName: 'Admin',
          lastName: 'User'
        },
        credits: 10000,
        isActive: true
      });
      await adminUser.save();
      console.log('✅ Admin user created (email: admin@civilsathi.com, password: AdminPass123)');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Sample vouchers created');
    console.log('   - Admin user created');
    console.log('   - Database ready for use');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run initialization
initializeDatabase();
