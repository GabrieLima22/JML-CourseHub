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
const taxonomyRoutes = require('./routes/taxonomies');

const app = express();
const PORT = process.env.PORT || 3001;

// Security & performance middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(compression());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // maximo 1000 requests por IP (aumentado para desenvolvimento)
  message: {
    success: false,
    message: 'Muitas requisicoes. Tente novamente em 15 minutos.',
    error: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // nao conta requisicoes bem-sucedidas
  skip: (req) =>
    req.path.startsWith('/api/upload') || req.path.startsWith('/api/admin')
});

app.use(limiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files (PDFs, uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/pdfs', express.static(path.join(__dirname, '../uploads/pdfs')));

// Custom middleware for consistent API responses
app.use((req, res, next) => {
  // Helper para respostas consistentes
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

  // Helper para erros padronizados
  res.apiError = (message = 'Internal Server Error', statusCode = 500, errorCode = null) => {
    res.status(statusCode).json({
      success: false,
      message,
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

// Routes
app.use('/api/courses', coursesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin/taxonomies', taxonomyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.apiResponse({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  }, 'Servidor funcionando perfeitamente');
});

// API info endpoint
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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Rota '${req.originalUrl}' nao encontrada`,
      code: 'ROUTE_NOT_FOUND',
      status: 404,
      suggestion: 'Verifique a documentacao da API em /api'
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);

  const sendStructuredError = (message, statusCode, errorCode) => {
    if (typeof res.apiError === 'function') {
      return res.apiError(message, statusCode, errorCode);
    }
    return res.status(statusCode).json({
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

  if (err.code === 'P2002') {
    return sendStructuredError('Registro ja existe', 409, 'DUPLICATE_ENTRY');
  }

  if (err.code === 'P2025') {
    return sendStructuredError('Registro nao encontrado', 404, 'NOT_FOUND');
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendStructuredError('Arquivo muito grande (maximo 10MB)', 413, 'FILE_TOO_LARGE');
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return sendStructuredError('Muitos arquivos enviados', 413, 'TOO_MANY_FILES');
  }

  if (err.name === 'JsonWebTokenError') {
    return sendStructuredError('Token invalido', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return sendStructuredError('Token expirado', 401, 'TOKEN_EXPIRED');
  }

  if (err.name === 'ValidationError') {
    return sendStructuredError(`Erro de validacao: ${err.message}`, 400, 'VALIDATION_ERROR');
  }

  return sendStructuredError(
    process.env.NODE_ENV === 'development' ? err.message : 'Erro interno do servidor',
    500,
    'INTERNAL_SERVER_ERROR'
  );
});

// Start server
app.listen(PORT, () => {
  console.log('JML CourseHub API');
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log('Health: /api/health');
  console.log('Docs: /api');
});

module.exports = app;
