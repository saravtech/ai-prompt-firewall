const { PrismaClient } = require('../lib/prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking database connection...');
    const policies = await prisma.policy.findMany();
    console.log(`✓ Database connected. Found ${policies.length} policies.`);
    
    const logs = await prisma.log.findMany();
    console.log(`✓ Found ${logs.length} logs.`);
    
    console.log('✓ Database is properly initialized!');
  } catch (error) {
    console.error('✗ Database error:', error.message);
    console.error('Error code:', error.code);
    if (error.message.includes('does not exist') || error.message.includes('no such table')) {
      console.error('\nPlease run: npm run db:push');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

