import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
        where: { name: 'Admin' }
    });

    if (existingAdmin) {
        console.log('Admin already exists, skipping seed.');
        return;
    }

    const adminPassword = await bcrypt.hash('admin', 10);

    await prisma.user.create({
        data: {
            name: 'Admin',
            passwordHash: adminPassword,
            role: 'admin',
        }
    });

    console.log('Created admin user (password: admin)');
    console.log('Database seeded!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
