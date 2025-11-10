const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const courses = await prisma.course.count();
    const users = await prisma.user.count();
    const uploads = await prisma.upload.count();
    const analytics = await prisma.analytics.count();
    const config = await prisma.config.count();

    console.log('=== DADOS NO BANCO ===');
    console.log('Cursos:', courses);
    console.log('Usuários:', users);
    console.log('Uploads:', uploads);
    console.log('Analytics:', analytics);
    console.log('Config:', config);
    console.log('=====================');

    if (courses > 0) {
      console.log('\nPrimeiros 3 cursos:');
      const sampleCourses = await prisma.course.findMany({
        take: 3,
        select: {
          id: true,
          titulo: true,
          empresa: true,
          tipo: true,
          segmento: true,
          status: true
        }
      });
      console.log(JSON.stringify(sampleCourses, null, 2));
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
