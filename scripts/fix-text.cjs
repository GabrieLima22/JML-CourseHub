// Quick fixer for mojibake in PT-BR texts across the repo
// Usage: node scripts/fix-text.cjs

const fs = require('fs');
const path = require('path');

const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md']);

const REPLACEMENTS = [
  // Latin1 -> UTF-8 common sequences
  ['Ã§', 'ç'],
  ['Ã£', 'ã'],
  ['Ã¡', 'á'],
  ['Ã©', 'é'],
  ['Ãª', 'ê'],
  ['Ã³', 'ó'],
  ['Ã´', 'ô'],
  ['Ãº', 'ú'],
  ['Ã�', 'Á'],
  ['Ã‰', 'É'],
  ['ÃŠ', 'Ê'],
  ['Ã“', 'Ó'],
  ['Ã”', 'Ô'],
  ['Ãš', 'Ú'],
  ['Ã‡', 'Ç'],
  ['Ã', 'Ã'], // noop safeguard
  // Specific mojibake seen in repo
  ['Intermediǭrio', 'Intermediário'],
  ['Avan��ado', 'Avançado'],
  ['Bǭsico', 'Básico'],
  ['Descri��ǜo', 'Descrição'],
  ['descri��ǜo', 'descrição'],
  ['Resumo nǜo', 'Resumo não'],
  ['nǜo', 'não'],
  ['pǧblico', 'público'],
  ['pǧblicos', 'públicos'],
  ['pǧblica', 'pública'],
  ['pǧblicas', 'públicas'],
  ['capacita��ǜo', 'capacitação'],
  ['Precisǜo', 'Precisão'],
  ['Sugest��es', 'Sugestões'],
  ['Estat��sticas', 'Estatísticas'],
  ['L��deres', 'Líderes'],
  ['h��brido', 'híbrido'],
  ['H��brido', 'Híbrido'],
  ['M��dulos', 'Módulos'],
  ['M��dulo', 'Módulo'],
  ['Licita����es', 'Licitações'],
  ['educa��ǜo', 'educação'],
  ['gestǜo', 'gestão'],
  ['Administra��ǜo', 'Administração'],
  ['administra��ǜo', 'administração'],
  ['apresenta��ǜo', 'apresentação'],
  ['programa��ǜo', 'programação'],
  ['conteǧdo', 'conteúdo'],
  ['p��gina', 'página'],
  ['ju��za', 'juíza'],
  ['justi��a', 'justiça'],
  ['lei anticorrup��ǜo', 'lei anticorrupção'],
  ['transparǦncia', 'transparência'],
  ['dura��ǜo', 'duração'],
  ['N��vel', 'Nível'],
  ['Conclu��do', 'Concluído'],
  ['Notifica����es', 'Notificações'],
  ['Relat��rios', 'Relatórios'],
  ['Revisǜo', 'Revisão'],
  ['publica��ǜo', 'publicação'],
];

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function* walk(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    if (it.name === 'node_modules' || it.name === '.git' || it.name === '.next') continue;
    const full = path.join(dir, it.name);
    if (it.isDirectory()) {
      yield* walk(full);
    } else {
      if (exts.has(path.extname(it.name))) yield full;
    }
  }
}

const root = process.cwd();
let changedFiles = 0;
let totalReplacements = 0;

for (const file of walk(root)) {
  let text = fs.readFileSync(file, 'utf8');
  let original = text;
  for (const [bad, good] of REPLACEMENTS) {
    if (!text.includes(bad)) continue;
    const regex = new RegExp(escapeRegex(bad), 'g');
    const matches = text.match(regex);
    text = text.replace(regex, good);
    if (matches) totalReplacements += matches.length;
  }
  if (text !== original) {
    fs.writeFileSync(file, text, 'utf8');
    changedFiles++;
    console.log(`✔ Fixed: ${file.replace(process.cwd()+path.sep, '')}`);
  }
}

console.log(`\nDone. Files changed: ${changedFiles}, total replacements: ${totalReplacements}`);
