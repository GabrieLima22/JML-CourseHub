const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkImports() {
  const importedCourses = await prisma.course.findMany({
    where: { created_by: 'pdf-script' },
    take: 5,
    select: {
      titulo: true,
      empresa: true,
      segmento: true,
      nivel: true,
      carga_horaria: true,
      modalidade: true,
      tipo: true
    }
  });

  console.log('=== CURSOS IMPORTADOS DOS PDFs ===\n');
  importedCourses.forEach((course, index) => {
    console.log(`${index + 1}. ${course.titulo}`);
    console.log(`   Empresa: ${course.empresa} | Tipo: ${course.tipo}`);
    console.log(`   Segmento: ${course.segmento} | Nível: ${course.nivel}`);
    console.log(`   Carga horária: ${course.carga_horaria}h`);
    console.log(`   Modalidade: ${course.modalidade.join(', ')}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkImports().catch(console.error);
