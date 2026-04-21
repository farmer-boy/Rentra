"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
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
        console.log('✅ Users created:');
        console.log(`   - ${user1.fullName} (${user1.email})`);
        console.log(`   - ${user2.fullName} (${user2.email})`);
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
    }
    catch (error) {
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
