const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// Permite requisições de arquivos locais e qualquer porta
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'ManuellamySQL11',
  database: 'beachpet'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Erro de conexão com MySQL:', err.message);
  } else {
    console.log('✅ Conectado ao banco MySQL da BeachPet!');
  }
});

// GET: Buscar todos os produtos (funciona tanto para Caixa quanto para Estoque)
app.get('/produtos', (req, res) => {
  const query = `
    SELECT 
      p.id_produto AS id,
      p.id_produto,
      p.nome AS name,
      p.nome,
      COALESCE(c.nome, 'Geral') AS category,
      COALESCE(c.nome, 'Geral') AS categoria,
      p.preco_venda AS price,
      p.preco_venda,
      p.quantidade_estoque AS stock,
      p.quantidade_estoque,
      p.status_estoque
    FROM Produtos p
    LEFT JOIN Categorias c ON p.id_categoria = c.id_categoria
    ORDER BY p.id_produto;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar produtos:', err);
      return res.status(500).json({ erro: 'Erro ao buscar produtos' });
    }
    res.json(results || []);
  });
});

// POST: Cadastrar produto
app.post('/produtos', (req, res) => {
  const { id_produto, nome, id_categoria, preco_venda, quantidade_estoque } = req.body;
  const status_estoque = quantidade_estoque < 15 ? 'Baixo' : 'OK';

  const query = `
    INSERT INTO Produtos (id_produto, nome, id_categoria, preco_venda, quantidade_estoque, status_estoque)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [id_produto, nome, id_categoria, preco_venda, quantidade_estoque, status_estoque], (err, result) => {
    if (err) {
      console.error('❌ Erro ao inserir produto:', err);
      return res.status(500).json({ erro: 'Erro ao cadastrar produto.' });
    }
    res.status(201).json({ mensagem: 'Produto cadastrado com sucesso!' });
  });
});

// DELETE: Apagar produto
app.delete('/produtos/:id', (req, res) => {
  const { id } = req.params;

  const sqlVendas = 'DELETE FROM itens_venda WHERE id_produto = ?';
  db.query(sqlVendas, [id], (err) => {
    if (err) {
      console.error('❌ Erro ao apagar histórico de vendas:', err);
      return res.status(500).json({ erro: 'Erro ao limpar histórico do produto' });
    }

    const sqlProduto = 'DELETE FROM Produtos WHERE id_produto = ?';
    db.query(sqlProduto, [id], (err, result) => {
      if (err) {
        console.error('❌ Erro ao apagar produto:', err);
        return res.status(500).json({ erro: 'Erro ao deletar produto' });
      }

      res.json({ mensagem: 'Produto excluído com sucesso!' });
    });
  });
});

app.listen(3001, () => {
  console.log('🚀 Servidor rodando em http://127.0.0.1:3001');
});
