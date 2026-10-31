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
    console.error('❌ Erro ao conectar ao MySQL:', err.message);
  } else {
    console.log('✅ Conectado ao MySQL (Banco: beachpet) para o Painel');
  }
});

// Endpoint 1: Métricas gerais
app.get('/api/metricas', (req, res) => {
  const queryMetricas = `
    SELECT 
      COALESCE(SUM(valor_total_transacao), 0) AS total_hoje,
      COUNT(id_venda) AS qtd_vendas,
      COALESCE(AVG(valor_total_transacao), 0) AS ticket_medio,
      COALESCE(SUM(valor_total_transacao) * 0.05, 0) AS doacao_hoje
    FROM Vendas 
    WHERE DATE(horario_venda) = CURDATE()
  `;

  const queryEstoque = `
    SELECT 
      COALESCE(SUM(quantidade_estoque), 0) AS total_itens, 
      COUNT(id_produto) AS total_produtos 
    FROM Produtos
  `;

  db.query(queryMetricas, (err, resMetricas) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query(queryEstoque, (err, resEstoque) => {
      if (err) return res.status(500).json({ error: err.message });

      const metricas = resMetricas[0] || {};
      const estoque = resEstoque[0] || {};

      res.json({
        vendasHoje: Number(metricas.total_hoje || 0),
        transacoes: Number(metricas.qtd_vendas || 0),
        ticketMedio: Number(metricas.ticket_medio || 0),
        doacaoHoje: Number(metricas.doacao_hoje || 0),
        totalItensEstoque: Number(estoque.total_itens || 0),
        totalProdutosEstoque: Number(estoque.total_produtos || 0)
      });
    });
  });
});

// Endpoint 2: Vendas Recentes
app.get('/api/vendas-recentes', (req, res) => {
  const query = `
    SELECT 
      id_venda, 
      valor_total_transacao AS total, 
      forma_pagamento, 
      DATE_FORMAT(horario_venda, '%H:%i') as hora, 
      quantidade_itens
    FROM Vendas 
    WHERE DATE(horario_venda) = CURDATE()
    ORDER BY horario_venda DESC 
    LIMIT 6
  `;
  
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results || []);
  });
});

// Endpoint 3: Alerta de Estoque Baixo
app.get('/api/estoque-baixo', (req, res) => {
  const query = `
    SELECT nome, quantidade_estoque AS quantidade 
    FROM Produtos 
    WHERE quantidade_estoque < 15 
    ORDER BY quantidade_estoque ASC 
    LIMIT 5
  `;
  
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results || []);
  });
});

app.listen(3001, () => {
  console.log('🚀 API do Painel BeachPet rodando em http://localhost:3001');
});