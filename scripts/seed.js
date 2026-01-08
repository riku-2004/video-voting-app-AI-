const { nanoid } = require('nanoid');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

async function seed() {
    const adminPassword = await bcrypt.hash('admin', 10);
    const userPassword = await bcrypt.hash('password', 10);

    const users = [
        {
            id: nanoid(),
            name: 'Admin',
            passwordHash: adminPassword,
            role: 'admin',
            createdAt: new Date().toISOString(),
        },
        {
            id: nanoid(),
            name: 'User1',
            passwordHash: userPassword,
            role: 'user',
            createdAt: new Date().toISOString(),
        },
        {
            id: nanoid(),
            name: 'User2',
            passwordHash: userPassword,
            role: 'user',
            createdAt: new Date().toISOString(),
        },
        {
            id: nanoid(),
            name: 'User3',
            passwordHash: userPassword,
            role: 'user',
            createdAt: new Date().toISOString(),
        },
    ];

    const videos = [
        {
            id: nanoid(),
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            title: 'Rick Roll',
            description: 'Never gonna give you up',
            isActive: true,
            createdAt: new Date().toISOString(),
        },
        {
            id: nanoid(),
            url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
            title: 'PSY - GANGNAM STYLE',
            description: 'Oppan Gangnam Style',
            isActive: true,
            createdAt: new Date().toISOString(),
        },
        {
            id: nanoid(),
            url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
            title: 'Me at the zoo',
            description: 'First video on YouTube',
            isActive: true,
            createdAt: new Date().toISOString(),
        },
    ];

    // Cast: User1 is in Rick Roll, so User1 cannot vote on Rick Roll.
    const videoCast = [
        {
            videoId: videos[0].id,
            userId: users[1].id
        }
    ];

    const data = {
        users,
        videos,
        videoCast,
        votes: [],
        comments: [],
    };

    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    console.log('Database seeded!');
}

seed();
