const http = require('http');
const url = require('url');

const PORT = 3000;

// Usuários de teste
const users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'Administrador' },
  { id: 2, username: 'caixa', password: 'caixa123', role: 'operador', name: 'Operador de Caixa' }
];

const server = http.createServer((req, res) => {
  // Libera CORS (para o frontend conseguir chamar)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responde o preflight do navegador
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);

  // Rota de Login
  if (req.method === 'POST' && parsedUrl.pathname === '/login') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { username, password } = JSON.parse(body);

        if (!username || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Usuário e senha são obrigatórios' }));
          return;
        }

        const user = users.find(u => u.username === username && u.password === password);

        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Usuário ou senha inválidos' }));
          return;
        }

        // Login OK
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Login realizado com sucesso!',
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            name: user.name
          }
        }));

      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Dados inválidos' }));
      }
    });

    return;
  }

  // Rota inicial (só pra testar se o servidor está online)
  if (req.method === 'GET' && parsedUrl.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Beach Pet API rodando!');
    return;
  }

  // Qualquer outra rota
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Rota não encontrada');
});

server.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`\nUsuários de teste:`);
  console.log(`  admin / admin123`);
  console.log(`  caixa / caixa123\n`);
});
