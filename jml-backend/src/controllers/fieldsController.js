const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CONFIG_KEY = 'custom_course_fields';

const ensureConfigExists = async () => {
  const existing = await prisma.config.findUnique({ where: { key: CONFIG_KEY } });
  if (existing) return existing;
  return prisma.config.create({
    data: {
      key: CONFIG_KEY,
      value: [],
      description: 'Campos personalizados para cursos',
    },
  });
};

const getFields = async (req, res) => {
  try {
    const config = await ensureConfigExists();
    const fields = Array.isArray(config.value) ? config.value : [];
    return res.apiResponse(fields, 'Campos personalizados carregados');
  } catch (error) {
    console.error('Erro ao buscar campos personalizados', error);
    return res.apiError('Erro ao buscar campos personalizados', 500, 'FIELDS_FETCH_FAILED');
  }
};

const updateFields = async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [];
    const updated = await prisma.config.upsert({
      where: { key: CONFIG_KEY },
      create: {
        key: CONFIG_KEY,
        value: payload,
        description: 'Campos personalizados para cursos',
      },
      update: {
        value: payload,
      },
    });
    return res.apiResponse(updated.value, 'Campos personalizados atualizados');
  } catch (error) {
    console.error('Erro ao atualizar campos personalizados', error);
    return res.apiError('Erro ao atualizar campos personalizados', 500, 'FIELDS_UPDATE_FAILED');
  }
};

module.exports = {
  getFields,
  updateFields,
};
