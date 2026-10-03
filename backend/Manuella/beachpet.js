const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'ManuellamySQL11',
  database: 'beachpet'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Erro de conexão com MySQL:', err.message);
  } else {
    console.log('✅ Conectado ao banco de dados MySQL da BeachPet!');
  }
});

// GET: Buscar todos os produtos
app.get('/produtos', (req, res) => {
  const query = `
    SELECT p.id_produto, p.nome, c.nome AS categoria,
           p.preco_venda, p.quantidade_estoque, p.status_estoque
    FROM Produtos AS p
    LEFT JOIN Categorias AS c ON c.id_categoria = p.id_categoria
    ORDER BY p.id_produto;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro no GET /produtos:', err);
      return res.status(500).json({ erro: 'Erro ao buscar produtos' });
    }
    return res.json(results);
  });
});

// POST: Cadastrar novo produto
app.post('/produtos', (req, res) => {
  const { id_produto, nome, id_categoria, preco_venda, quantidade_estoque } = req.body;
  const status_estoque = quantidade_estoque < 15 ? 'Baixo' : 'OK';

  const query = `
    INSERT INTO Produtos (id_produto, nome, id_categoria, preco_venda, quantidade_estoque, status_estoque)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [id_produto, nome, id_categoria, preco_venda, quantidade_estoque, status_estoque], (err, result) => {
    if (err) {
      console.error('Erro ao inserir produto:', err);
      return res.status(500).json({ erro: 'Erro ao cadastrar produto.' });
    }
    res.status(201).json({ mensagem: 'Produto cadastrado com sucesso!' });
  });
});

// DELETE: Apagar produto tratando a chave estrangeira em itens_venda
app.delete('/produtos/:id', (req, res) => {
  const { id } = req.params;

  const sqlVendas = 'DELETE FROM itens_venda WHERE id_produto = ?';
  db.query(sqlVendas, [id], (err) => {
    if (err) {
      console.error('Erro ao apagar histórico de vendas:', err);
      return res.status(500).json({ erro: 'Erro ao limpar histórico do produto' });
    }

    const sqlProduto = 'DELETE FROM Produtos WHERE id_produto = ?';
    db.query(sqlProduto, [id], (err, result) => {
      if (err) {
        console.error('Erro ao apagar produto:', err);
        return res.status(500).json({ erro: 'Erro ao deletar produto' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ mensagem: 'Produto não encontrado' });
      }

      res.json({ mensagem: 'Produto excluído com sucesso!' });
    });
  });
});

app.listen(3000, () => {
  console.log('🚀 Servidor rodando em http://localhost:3000');
});