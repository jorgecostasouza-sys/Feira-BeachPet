const http = require('http');
const url = require('url');
const mysql = require('mysql2');

const PORT = 3000;

// Configuração da conexão com o MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'ManuellamySQL11', // ⚠️ COLOQUE A SUA SENHA DO MYSQL AQUI
  database: 'beachpet'
});

// Testar conexão com o banco
db.connect((err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao MySQL:', err.message);
  } else {
    console.log('✅ Conectado com sucesso ao MySQL (Banco: beachpet)');
  }
});

const server = http.createServer((req, res) => {
  // Configuração do CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

        // Consulta direta na tabela Usuarios do MySQL
        const query = 'SELECT * FROM Usuarios WHERE nome = ?';

        db.query(query, [username], (err, results) => {
          if (err) {
            console.error('Erro na consulta ao banco:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Erro interno no banco de dados' }));
            return;
          }

          if (results.length > 0) {
            const user = results[0];

            // Verifica se a senha confere
            if (user.senha === password) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                message: 'Login realizado com sucesso!',
                user: {
                  id: user.id_usuario,
                  name: user.nome,
                  role: user.funcao // 'Administrador' ou 'Operador'
                }
              }));
              return;
            }
          }

          // Se não achar o usuário ou a senha estiver incorreta
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Usuário ou senha inválidos' }));
        });

      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Dados inválidos' }));
      }
    });

    return;
  }

  // Rota de teste
  if (req.method === 'GET' && parsedUrl.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Beach Pet API + MySQL rodando!');
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Rota não encontrada');
});

server.listen(PORT, () => {
  console.log(`\n🚀 Servidor BeachPet rodando em http://localhost:${PORT}`);
});