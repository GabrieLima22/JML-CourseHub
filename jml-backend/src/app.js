// src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Routes
const coursesRoutes = require('./routes/courses');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3001;

// 🛡️ Security & Performance Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(compression());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// 🚦 Rate Limiting (Design: Elegant error responses)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em 15 minutos.',
    error: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// 📦 Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 📁 Static files (PDFs, uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/pdfs', express.static(path.join(__dirname, '../uploads/pdfs')));

// 🎨 Custom middleware for consistent API responses
app.use((req, res, next) => {
  // Função helper para respostas consistentes
  res.apiResponse = (data, message = 'Success', success = true, statusCode = 200) => {
    res.status(statusCode).json({
      success,
      data,
      message,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
  };

  // Função helper para erros
  res.apiError = (message = 'Internal Server Error', statusCode = 500, errorCode = null) => {
    res.status(statusCode).json({
      success: false,
      error: {
        message,
        code: errorCode,
        status: statusCode
      },
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
  };

  next();
});

// 🛣️ Routes
app.use('/api/courses', coursesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// 🏠 Health check endpoint
app.get('/api/health', (req, res) => {
  res.apiResponse({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  }, 'Servidor funcionando perfeitamente');
});

// 📊 API Info endpoint (Design: Useful for frontend)
app.get('/api', (req, res) => {
  res.apiResponse({
    name: 'JML CourseHub API',
    version: '1.0.0',
    description: 'API para gerenciamento de cursos com processamento de PDFs',
    endpoints: {
      courses: '/api/courses',
      admin: '/api/admin',
      upload: '/api/upload',
      health: '/api/health'
    },
    documentation: '/api/docs'
  }, 'API JML CourseHub v1.0');
});

// 🚫 404 Handler (Design: Helpful error messages)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Rota '${req.originalUrl}' não encontrada`,
      code: 'ROUTE_NOT_FOUND',
      status: 404,
      suggestion: 'Verifique a documentação da API em /api'
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

// 🚨 Global Error Handler (Design: User-friendly errors)
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.apiError('Registro já existe', 409, 'DUPLICATE_ENTRY');
  }

  if (err.code === 'P2025') {
    return res.apiError('Registro não encontrado', 404, 'NOT_FOUND');
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.apiError('Arquivo muito grande (máximo 10MB)', 413, 'FILE_TOO_LARGE');
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.apiError('Muitos arquivos enviados', 413, 'TOO_MANY_FILES');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.apiError('Token inválido', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return res.apiError('Token expirado', 401, 'TOKEN_EXPIRED');
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.apiError(`Erro de validação: ${err.message}`, 400, 'VALIDATION_ERROR');
  }

  // Default error
  res.apiError(
    process.env.NODE_ENV === 'development' ? err.message : 'Erro interno do servidor',
    500,
    'INTERNAL_SERVER_ERROR'
  );
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`
    🚀 JML CourseHub API
    ┌─────────────────────────────────────┐
    │  🌟 Servidor rodando na porta ${PORT}    │
    │  🌍 Environment: ${process.env.NODE_ENV || 'development'}        │
    │  📡 URL: http://localhost:${PORT}     │
    │  📚 Health: /api/health             │
    │  📋 Docs: /api                      │
    └─────────────────────────────────────┘
  `);
});

module.exports = app;