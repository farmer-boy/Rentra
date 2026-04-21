const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const totalMessages = await prisma.contactMessage.count();
  console.log('Total Messages:', totalMessages);

  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  console.log('Recent Messages:', JSON.stringify(messages, null, 2));

  const allMessages = await prisma.contactMessage.findMany();
  console.log('All Messages:', JSON.stringify(allMessages, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.\();
  });
