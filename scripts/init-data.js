#!/usr/bin/env node

const fileStorage = require('../utils/fileStorage');
const bcrypt = require('bcryptjs');

async function initializeData() {
  try {
    console.log('🌱 Initializing Civil Sathi data files...');

    // Create sample vouchers
    console.log('🎁 Creating sample vouchers...');
    
    const sampleVouchers = [
      {
        code: 'CS12345678',
        name: 'Amazon Shopping Voucher',
        description: 'Get 30% off on any Amazon purchase',
        type: 'percentage',
        value: 30,
        cost: { credits: 100 },
        validity: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
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
        code: 'CS87654321',
        name: 'Premium Shopping Voucher',
        description: 'Get 40% off on any purchase',
        type: 'percentage',
        value: 40,
        cost: { credits: 200 },
        validity: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
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
        code: 'CS11111111',
        name: 'Elite Voucher',
        description: 'Get 50% off + Free Shipping',
        type: 'percentage',
        value: 50,
        cost: { credits: 500 },
        validity: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
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
      }
    ];

    // Clear existing vouchers and create new ones
    fileStorage.writeData('vouchers', []);
    sampleVouchers.forEach(voucher => {
      fileStorage.createVoucher(voucher);
    });
    console.log('✅ Sample vouchers created');

    // Create admin user if it doesn't exist
    console.log('👤 Creating admin user...');
    const adminExists = fileStorage.findUser({ email: 'admin@civilsathi.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('AdminPass123', 12);
      const adminUser = fileStorage.createUser({
        username: 'admin',
        email: 'admin@civilsathi.com',
        password: hashedPassword,
        profile: {
          firstName: 'Admin',
          lastName: 'User'
        },
        credits: 10000,
        stats: {
          totalCleanups: 0,
          tasksCompleted: 0,
          environmentalImpact: {
            co2Saved: 0,
            wasteRecycled: 0,
            treesPlanted: 0
          }
        },
        achievements: [],
        isActive: true,
        lastLogin: new Date().toISOString()
      });
      console.log('✅ Admin user created (email: admin@civilsathi.com, password: AdminPass123)');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    console.log('\n🎉 Data initialization completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Sample vouchers created');
    console.log('   - Admin user created');
    console.log('   - File-based storage ready for use');
    
  } catch (error) {
    console.error('❌ Data initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization
initializeData();
