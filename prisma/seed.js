// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    // 1) Demo user (Credentials login)
    const email = 'demo@corevai.app';
    const password = 'demo1234'; // <-- login with this
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name: 'Demo User',
            passwordHash,
            plan: 'free',
        },
    });

    // 2) One demo project
    const project = await prisma.project.create({
        data: {
            name: 'Demo Project',
            ownerId: user.id,
        },
    });

    // 3) One demo conversation owned by the user and linked to project
    const convo = await prisma.conversation.create({
        data: {
            title: 'Welcome to CoreVAI',
            ownerId: user.id,
            projectId: project.id,
            pinned: false,
        },
    });

    // 4) A couple of messages
    await prisma.message.createMany({
        data: [
            {
                conversationId: convo.id,
                role: 'assistant',
                content: 'Hi! I’m CoreVAI. Ask me anything to get started.',
            },
            {
                conversationId: convo.id,
                role: 'user',
                content: 'Great — just seeded the DB!',
            },
        ],
    });

    console.log('✅ Seeded: user=%s / pass=%s', email, password);
    console.log('   Project=%s', project.name);
    console.log('   Conversation=%s', convo.title);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });