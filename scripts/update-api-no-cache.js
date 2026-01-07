const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'app', 'api');

// Função para atualizar um arquivo
function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Adicionar import se não existir
  if (content.includes('NextResponse') && !content.includes('jsonResponse')) {
    const importLine = content.match(/import.*from ['"]next\/server['"]/);
    if (importLine) {
      const newImport = `import { jsonResponse } from '../../../../lib/api-helpers';`;
      // Verificar se já tem imports de lib
      if (!content.includes("from '../../../../lib/api-helpers'") && !content.includes("from '../../../lib/api-helpers'")) {
        const lines = content.split('\n');
        const importIndex = lines.findIndex(line => line.includes('from') && line.includes('lib'));
        if (importIndex >= 0) {
          lines.splice(importIndex + 1, 0, newImport);
        } else {
          const nextResponseIndex = lines.findIndex(line => line.includes('NextResponse'));
          if (nextResponseIndex >= 0) {
            lines.splice(nextResponseIndex + 1, 0, newImport);
          }
        }
        content = lines.join('\n');
        modified = true;
      }
    }
  }

  // Substituir NextResponse.json por jsonResponse
  if (content.includes('NextResponse.json')) {
    content = content.replace(/NextResponse\.json\(/g, 'jsonResponse(');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated: ${filePath}`);
    return true;
  }
  return false;
}

// Função recursiva para encontrar todos os route.ts
function findRouteFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findRouteFiles(fullPath));
    } else if (item === 'route.ts') {
      files.push(fullPath);
    }
  }

  return files;
}

// Executar
console.log('🔄 Atualizando rotas da API para desabilitar cache...\n');
const routeFiles = findRouteFiles(apiDir);
let updated = 0;

routeFiles.forEach(file => {
  if (updateFile(file)) {
    updated++;
  }
});

console.log(`\n✅ Concluído! ${updated} arquivo(s) atualizado(s) de ${routeFiles.length} total.`);

