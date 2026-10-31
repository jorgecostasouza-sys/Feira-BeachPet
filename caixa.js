const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// O segredo está aqui: liberando totalmente qualquer origem
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
    console.log('✅ Conectado ao banco MySQL para o Caixa!');
  }
});

// GET: Buscar produtos para o Caixa e Estoque
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
      p.quantidade_estoque
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

// POST: Registrar Venda no MySQL
app.post('/api/vendas', (req, res) => {
  const { formaPagamento, valorTotal, itens } = req.body;

  if (!itens || itens.length === 0) {
    return res.status(400).json({ erro: 'Carrinho vazio.' });
  }

  // Quantidade total de itens no carrinho
  const qtdItens = itens.reduce((acc, item) => acc + item.quantity, 0);

  // Insere a venda usando os nomes exatos da tabela Vendas do seu MySQL
  const sqlVenda = `
    INSERT INTO Vendas (horario_venda, valor_total_transacao, forma_pagamento, quantidade_itens) 
    VALUES (NOW(), ?, ?, ?)
  `;
  
  db.query(sqlVenda, [valorTotal, formaPagamento, qtdItens], (err, resultVenda) => {
    if (err) {
      console.error('❌ Erro detalhado do MySQL ao registrar venda:', err);
      return res.status(500).json({ erro: 'Erro ao registrar venda no banco.' });
    }

    const idVenda = resultVenda.insertId;

    // Atualiza o estoque no MySQL para cada produto vendido
    itens.forEach(item => {
      const idProd = item.product ? item.product.id : item.id;
      const sqlEstoque = 'UPDATE Produtos SET quantidade_estoque = quantidade_estoque - ? WHERE id_produto = ?';
      db.query(sqlEstoque, [item.quantity, idProd], (errEst) => {
        if (errEst) console.error(`❌ Erro ao atualizar estoque do produto ${idProd}:`, errEst);
      });
    });

    res.status(201).json({ mensagem: 'Venda registrada com sucesso!', idVenda });
  });
});

app.listen(3002, () => {
  console.log('🚀 Servidor rodando em http://127.0.0.1:3002');
});