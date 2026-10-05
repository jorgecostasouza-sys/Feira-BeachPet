const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.json());
app.use(express.static('.')); // Serve os arquivos HTML/JS estáticos

const db = new sqlite3.Database(':memory:'); // Em produção, usar arquivo .db

// Criação das tabelas
db.serialize(() => {
    db.run(`CREATE TABLE produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        preco REAL NOT NULL,
        estoque INTEGER NOT NULL
    )`);

    db.run(`CREATE TABLE vendas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
        operador_id INTEGER,
        forma_pagamento TEXT,
        valor_total REAL
    )`);

    db.run(`CREATE TABLE itens_venda (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venda_id INTEGER,
        produto_id INTEGER,
        quantidade INTEGER,
        preco_unitario REAL,
        FOREIGN KEY(venda_id) REFERENCES vendas(id),
        FOREIGN KEY(produto_id) REFERENCES produtos(id)
    )`);

    // Dados de teste iniciais
    db.run(`INSERT INTO produtos (nome, preco, estoque) VALUES ('Água de Coco', 8.00, 20)`);
    db.run(`INSERT INTO produtos (nome, preco, estoque) VALUES ('Suco de Melancia', 10.00, 5)`);
    db.run(`INSERT INTO produtos (nome, preco, estoque) VALUES ('Biscoito Pet', 6.50, 2)`);
});

// --- REQUISITO 2.1: CRUD DE ESTOQUE E VALIDAÇÕES ---

// Inserção / Cadastro de Produto
app.post('/api/produtos', (req, res) => {
    const { nome, preco, estoque } = req.body;

    // Validações de entrada
    if (!nome || nome.trim() === '') {
        return res.status(400).json({ erro: 'O nome do produto é obrigatório.' });
    }
    if (preco < 0) {
        return res.status(400).json({ erro: 'O preço não pode ser negativo.' });
    }
    if (estoque < 0) {
        return res.status(400).json({ erro: 'O estoque não pode ser negativo.' });
    }

    db.run(`INSERT INTO produtos (nome, preco, estoque) VALUES (?, ?, ?)`, 
        [nome, preco, estoque], 
        function (err) {
            if (err) return res.status(500).json({ erro: err.message });
            res.status(201).json({ id: this.lastID, nome, preco, estoque });
        }
    );
});

// Listagem de Produtos
app.get('/api/produtos', (req, res) => {
    db.all(`SELECT * FROM produtos`, [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

// --- REQUISITO 2.2: LÓGICA COMERCIAL DE VENDAS (PDV) ---

app.post('/api/vendas', (req, res) => {
    const { operadorId, formaPagamento, valorTotal, itens } = req.body;

    if (!itens || itens.length === 0) {
        return res.status(400).json({ erro: 'A venda deve conter ao menos um item.' });
    }

    // Validação da Restrição Operacional de Estoque
    db.all(`SELECT id, nome, estoque FROM produtos WHERE id IN (${itens.map(i => i.produtoId).join(',')})`, (err, produtos) => {
        if (err) return res.status(500).json({ erro: err.message });

        for (const item of itens) {
            const produtoDb = produtos.find(p => p.id === item.produtoId);
            if (!produtoDb) {
                return res.status(400).json({ erro: `Produto ID ${item.produtoId} não encontrado.` });
            }
            if (item.quantidade > produtoDb.estoque) {
                return res.status(400).json({ 
                    erro: `Estoque insuficiente para o produto "\({produtoDb.nome}". Disponível:\){produtoDb.estoque}, Solicitado: ${item.quantidade}` 
                });
            }
        }

        // Gravação Transacional da Venda
        db.serialize(() => {
            db.run(`BEGIN TRANSACTION`);

            // 1. Grava o cabeçalho da venda
            db.run(
                `INSERT INTO vendas (operador_id, forma_pagamento, valor_total) VALUES (?, ?, ?)`,
                [operadorId, formaPagamento, valorTotal],
                function (err) {
                    if (err) {
                        db.run(`ROLLBACK`);
                        return res.status(500).json({ erro: 'Erro ao gravar venda.' });
                    }

                    const vendaId = this.lastID;

                    // 2. Grava os itens e atualiza (baixa) o estoque
                    const stmtItem = db.prepare(`INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)`);
                    const stmtEstoque = db.prepare(`UPDATE produtos SET estoque = estoque - ? WHERE id = ?`);

                    for (const item of itens) {
                        stmtItem.run(vendaId, item.produtoId, item.quantidade, item.precoUnitario);
                        stmtEstoque.run(item.quantidade, item.produtoId);
                    }

                    stmtItem.finalize();
                    stmtEstoque.finalize();

                    db.run(`COMMIT`);
                    res.status(201).json({ mensagem: 'Venda finalizada com sucesso!', vendaId });
                }
            );
        });
    });
});

app.listen(3000, () => {
    console.log('Servidor executando na porta 3000');
});