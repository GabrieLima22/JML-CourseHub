const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mime = require('mime-types');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

const uploadsRoot = path.join(__dirname, '../../uploads');
const pdfDir = path.join(uploadsRoot, 'pdfs');

fs.mkdirSync(pdfDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, pdfDir),
  filename: (_req, file, cb) => {
    const unique = crypto.randomUUID();
    const ext = mime.extension(file.mimetype) || 'bin';
    cb(null, `${unique}.${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Somente PDFs são permitidos'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get('/', async (_req, res, next) => {
  try {
    const uploads = await prisma.upload.findMany({
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    res.apiResponse({ uploads }, 'Uploads recentes carregados');
  } catch (error) {
    next(error);
  }
});

router.post('/pdf', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.apiError('Arquivo não encontrado no payload', 400, 'UPLOAD_MISSING_FILE');
    }

    const { courseId } = req.body;
    let savedUpload = null;

    if (courseId) {
      savedUpload = await prisma.upload.create({
        data: {
          course_id: courseId,
          filename: req.file.filename,
          original_name: req.file.originalname,
          path: path.relative(path.join(__dirname, '..', '..'), req.file.path),
          size: req.file.size,
          mimetype: req.file.mimetype,
          status: 'completed',
          progress: 100,
        },
      });
    }

    res.apiResponse(
      {
        file: {
          id: savedUpload?.id ?? null,
          name: req.file.originalname,
          filename: req.file.filename,
          size: req.file.size,
          url: `/uploads/pdfs/${req.file.filename}`,
        },
        courseId: courseId || null,
        storedInDatabase: Boolean(savedUpload),
      },
      'Upload finalizado'
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;
