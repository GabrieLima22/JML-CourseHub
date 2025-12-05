// Test script for AI search
const http = require('http');

const testQueries = ['contratos', 'inteligência artificial', 'gestão de pessoas'];

async function testSearch(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ q: query });

    const options = {
      hostname: 'localhost',
      port: 54112, // Porta atual do backend
      path: '/api/courses/ai-search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🤖 Testando busca inteligente com IA\n');

  for (const query of testQueries) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📍 Buscando: "${query}"`);
    console.log('='.repeat(60));

    try {
      const result = await testSearch(query);
      const data = result.data;

      console.log(`\n✨ Query expandida:`);
      console.log(`   Original: ${data.query.original}`);
      console.log(`   Intenção: ${data.query.intent}`);
      console.log(`   Termos expandidos (${data.query.expanded.length}):`);
      data.query.expanded.slice(0, 8).forEach(term => console.log(`     • ${term}`));

      console.log(`\n📊 Resultados: ${data.results.length} cursos encontrados`);
      console.log(`   Total pesquisado: ${data.meta.totalSearched}`);
      console.log(`   Score médio: ${data.meta.avgScore.toFixed(2)}`);
      console.log(`   Alta relevância: ${data.meta.hasHighRelevance ? 'Sim' : 'Não'}`);

      if (data.results.length > 0) {
        console.log(`\n🎯 Top 5 cursos mais relevantes:`);
        data.results.slice(0, 5).forEach((course, i) => {
          console.log(`\n   ${i + 1}. ${course.titulo}`);
          console.log(`      Score: ${course._aiScore.toFixed(1)}`);
          console.log(`      Termos encontrados: ${course._matchedTerms.slice(0, 3).join(', ')}`);
          console.log(`      Empresa: ${course.empresa} | Tipo: ${course.tipo}`);
        });
      } else {
        console.log('\n❌ Nenhum curso relevante encontrado');
      }

    } catch (error) {
      console.error(`\n❌ Erro na busca: ${error.message}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ Testes concluídos!');
  console.log('='.repeat(60));
}

runTests().catch(console.error);
