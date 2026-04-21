import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  try {
    // Check if data already exists
    const userCount = await prisma.user.count();
    console.log(`📊 Current users in database: ${userCount}`);

    if (userCount > 0) {
      console.log('✅ Data already exists! Skipping seed.');
      return;
    }

    // Create test users only if database is empty
    const hashedPassword = await bcrypt.hash('password123', 10);

    const user1 = await prisma.user.create({
      data: {
        email: 'landlord@test.com',
        phone: '+923001234567',
        fullName: 'Ahmed Khan',
        password: hashedPassword,
        cnic: '12345-6789012-3',
        role: 'LANDLORD',
        trustScore: 95,
        isVerified: true,
      },
    });

    const user2 = await prisma.user.create({
      data: {
        email: 'tenant@test.com',
        phone: '+923009876543',
        fullName: 'Fatima Ali',
        password: hashedPassword,
        cnic: '98765-4321098-7',
        role: 'TENANT',
        trustScore: 85,
        isVerified: true,
      },
    });

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@rentra.com',
        phone: '+923005555555',
        fullName: 'Rentra Admin',
        password: hashedPassword,
        cnic: '11111-1111111-1',
        role: 'ADMIN',
        trustScore: 100,
        isVerified: true,
      },
    });

    console.log('✅ Users created:');
    console.log(`   - ${user1.fullName} (${user1.email})`);
    console.log(`   - ${user2.fullName} (${user2.email})`);
    console.log(`   - ${adminUser.fullName} (${adminUser.email})`);

    // Create test listing
    const listing = await prisma.listing.create({
      data: {
        title: 'Beautiful Flat in Karachi',
        description: 'Modern flat with excellent facilities',
        address: '123 Main Street, Karachi',
        city: 'Karachi',
        rent: 50000,
        deposit: 100000,
        bedrooms: 2,
        bathrooms: 1,
        sqft: 1200,
        area: '1200 sq ft',
        type: 'FLAT',
        landlordId: user1.id,
        photos: ['https://example.com/image1.jpg'],
      },
    });

    console.log('✅ Listing created:');
    console.log(`   - ${listing.title} (Rs. ${listing.rent}/month)`);

    // Create test agreement
    const agreement = await prisma.agreement.create({
      data: {
        listingId: listing.id,
        landlordId: user1.id,
        tenantId: user2.id,
        rent: listing.rent,
        deposit: listing.deposit,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
      },
    });

    console.log('✅ Agreement created:');
    console.log(`   - Status: ${agreement.status}`);

    console.log('\n✨ Database seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('   Landlord: landlord@test.com / password123');
    console.log('   Tenant: tenant@test.com / password123');
    console.log('   Admin: admin@rentra.com / password123');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




