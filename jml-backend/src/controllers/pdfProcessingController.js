const fs = require('fs/promises');
const path = require('path');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configuração da API do Google
const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "dummy_key");

// --- FUNÇÃO AUXILIAR: Buscar Taxonomias do Banco ---
async function getSystemTaxonomies() {
  try {
    const config = await prisma.config.findUnique({
      where: { key: 'catalog_taxonomies' }
    });

    if (!config || !config.value) {
      // Fallback seguro se ainda não tiver nada configurado
      return {
        companies: ['JML', 'Conecta'],
        courseTypes: ['Aberto', 'In Company', 'EAD', 'Híbrido'],
        segments: ['Estatais', 'Judiciário', 'Sistema S', 'Municípios', 'Administração Pública', 'Empresas Privadas']
      };
    }

    // Extrai apenas os labels das opções salvas
    const tax = config.value;
    return {
      companies: tax.companies?.map(c => c.label) || ['JML', 'Conecta'],
      courseTypes: tax.courseTypes?.map(t => t.label) || ['Aberto', 'EAD'],
      segments: tax.segments?.map(s => s.label) || ['Geral']
    };
  } catch (error) {
    console.error('Erro ao buscar taxonomias:', error);
    return {
      companies: ['JML', 'Conecta'],
      courseTypes: ['Aberto', 'EAD'],
      segments: ['Geral']
    };
  }
}

// --- FUNÇÃO PRINCIPAL ---
async function extractCourseDataFromPDF(filePath) {
  try {
    // 1. Ler o texto do PDF
    const absolutePath = path.resolve(filePath);
    const dataBuffer = await fs.readFile(absolutePath);
    const pdfData = await pdfParse(dataBuffer);
    const pdfText = pdfData.text.slice(0, 30000); // Limita tamanho para não estourar token à toa

    // 2. Buscar as regras do negócio (Taxonomias Reais)
    const taxonomies = await getSystemTaxonomies();

    // 3. Montar o Prompt Inteligente
   // Usar 'gemini-2.0-flash-exp' (modelo mais recente disponível)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `
      Você é um assistente especializado em cadastrar cursos da JML no sistema.
      Sua tarefa é analisar o texto de um PDF e extrair os dados para preencher o formulário de cadastro.

      DIRETRIZES DE CLASSIFICAÇÃO (Use ESTRITAMENTE estes valores):
      - Empresas Válidas: ${JSON.stringify(taxonomies.companies)}
      - Tipos Válidos: ${JSON.stringify(taxonomies.courseTypes)}
      - Segmentos Válidos: ${JSON.stringify(taxonomies.segments)}
      
      Regras de Negócio:
      1. Se o PDF mencionar "Online", "Ao Vivo" ou "Zoom", o tipo é "EAD" (ou similar na lista).
      2. Se mencionar "Curitiba", "Hotel" ou local físico, o tipo é "Presencial" ou "Híbrido".
      3. Extraia datas no formato ISO (YYYY-MM-DD).
      4. Separe preços: "preco_online" (para EAD) e "preco_presencial" (para presencial).
      5. Se não houver lista explícita de "Vantagens", crie 3 ou 4 baseadas no texto de apresentação.
      6. Extraia "Objetivos" e "Público-Alvo" como listas de texto.

      Retorne APENAS um JSON com esta estrutura exata:
      {
        "titulo": "Título do curso",
        "empresa": "Uma das Empresas Válidas",
        "tipo": "Um dos Tipos Válidos",
        "segmentos": ["Um ou mais Segmentos Válidos"],
        "modalidade": ["Lista de modalidades identificadas ex: EAD, Presencial"],
        "carga_horaria": 20, (apenas numeros)
        "summary": "Resumo curto para o card (máx 150 caracteres)",
        "apresentacao": "Texto completo de apresentação",
        "description": "Conteúdo programático completo",
        "objetivos": ["Objetivo 1", "Objetivo 2"],
        "publico_alvo": ["Perfil 1", "Perfil 2"],
        "vantagens": ["Vantagem 1", "Vantagem 2"],
        "vantagens_ead": ["Vantagem da plataforma 1"],
        "palestrantes": [
          { "nome": "Nome do Professor", "curriculo": "Resumo bio" }
        ],
        "data_inicio": "2026-01-01T00:00:00.000Z", (ou null)
        "data_fim": "2026-01-03T00:00:00.000Z", (ou null)
        "local": "Cidade - UF" (ou "Online"),
        "preco_online": 1000.00, (ou null)
        "preco_presencial": 2000.00, (ou null)
        "preco_resumido": "Texto livre de preço (ex: A partir de R$ 1.000)",
        "deliverables": ["Certificado", "Material de Apoio"]
      }

      Texto do PDF:
      ${pdfText}
    `;

    // 4. Chamar a IA
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // 5. Limpar e Parsear JSON
    const jsonString = response.replace(/```json/g, '').replace(/```/g, '').trim();
    const extractedData = JSON.parse(jsonString);

    return {
      success: true,
      data: extractedData
    };

  } catch (error) {
    console.error('Erro no processamento do PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  extractCourseDataFromPDF
};