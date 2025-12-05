const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { extractCourseDataFromPDF } = require('../controllers/pdfProcessingController');
const slugify = require('slugify');

const prisma = new PrismaClient();
const router = express.Router();

// Configuração do Multer (Upload)
const uploadDir = path.join(__dirname, '../../uploads/pdfs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Rota POST /api/upload/pdf
router.post('/pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
    }

    // 1. Processar com IA
    console.log(`📄 Processando PDF: ${req.file.originalname}`);
    const extraction = await extractCourseDataFromPDF(req.file.path);

    if (!extraction.success) {
      return res.status(500).json({ success: false, message: 'Falha na leitura da IA.', error: extraction.error });
    }

    const data = extraction.data;

    // 2. Gerar Slug Único
    let baseSlug = slugify(data.titulo || 'curso-sem-titulo', { lower: true, strict: true });
    let slug = baseSlug;
    let count = 1;
    while (await prisma.course.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }

    // 3. Salvar no Banco (Mapeamento Direto)
    // Aqui usamos os campos novos que criamos na migration
    const newCourse = await prisma.course.create({
      data: {
        titulo: data.titulo || "Curso Importado (Sem Título)",
        slug: slug,
        empresa: data.empresa || "JML",
        tipo: data.tipo || "Aberto",
        categoria: "Geral", // Valor padrão, segmento é mais importante
        segmento: data.segmentos?.[0] || "Geral",
        segmentos_adicionais: data.segmentos || [],
        modalidade: data.modalidade || [],
        
        // Textos
        summary: data.summary || "",
        apresentacao: data.apresentacao || "",
        description: data.description || "",
        
        // Listas (Campos Novos!)
        objetivos: data.objetivos || [],
        publico_alvo: data.publico_alvo || [],
        vantagens: data.vantagens || [],
        vantagens_ead: data.vantagens_ead || [],
        deliverables: data.deliverables || [],
        
        // Dados Técnicos
        carga_horaria: Number(data.carga_horaria) || 0,
        data_inicio: data.data_inicio ? new Date(data.data_inicio) : null,
        data_fim: data.data_fim ? new Date(data.data_fim) : null,
        local: data.local,
        
        // Preços (Separados)
        preco_online: data.preco_online ? Number(data.preco_online) : null,
        preco_presencial: data.preco_presencial ? Number(data.preco_presencial) : null,
        preco_incompany: data.preco_incompany ? Number(data.preco_incompany) : null,
        preco_resumido: data.preco_resumido,
        investimento: {}, // JSON vazio para compatibilidade se necessário
        
        // Palestrantes (JSON)
        palestrantes: data.palestrantes || [],
        
        // Arquivo
        pdf_original: req.file.filename,
        pdf_url: `/uploads/pdfs/${req.file.filename}`,
        
        // Meta
        status: 'draft', // Sempre Rascunho para revisão
        destaque: false,
        novo: true
      }
    });

    console.log(`✅ Curso criado com sucesso: ${newCourse.titulo} (ID: ${newCourse.id})`);

    // Retorna sucesso para o Frontend
    res.json({
      success: true,
      processingSuccess: true,
      message: 'Curso importado com sucesso!',
      courseId: newCourse.id,
      createdCourseId: newCourse.id,
      extractedData: data,
      file: {
        filename: req.file.filename,
        url: `/uploads/pdfs/${req.file.filename}`
      },
      storedInDatabase: true
    });

  } catch (error) {
    console.error('Erro crítico no upload:', error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor.', error: error.message });
  }
});

module.exports = router;