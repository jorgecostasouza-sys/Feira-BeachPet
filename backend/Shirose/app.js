// --- SIMULAÇÃO DE BANCO DE DADOS NO NAVEGADOR (sem Node/instalação) ---

// Estoque inicial simulado
let produtosBD = JSON.parse(localStorage.getItem('produtosBD')) || [
    { id: 1, nome: "Água de coco", preco: 8.00, estoque: 20 },
    { id: 2, nome: "Suco de Melancia", preco: 10.00, estoque: 15 },
    { id: 3, nome: "Caipirinha Tropical", preco: 15.00, estoque: 10 },
    { id: 4, nome: "Sorvete de Manga", preco: 7.00, estoque: 20 },
    { id: 5, nome: "Açaí na Tigela", preco: 18.00, estoque: 15 },
    { id: 6, nome: "Espetinho de Frango", preco: 12.00, estoque: 12 },
    { id: 7, nome: "Chips de Mandioca", preco: 9.00, estoque: 25 },
    { id: 8, nome: "Boné Praiano", preco: 35.00, estoque: 8 },
    { id: 9, nome: "Imã de Geladeira", preco: 10.00, estoque: 30 },
    { id: 10, nome: "Biscoito Pet", preco: 6.50, estoque: 15 },
    { id: 11, nome: "Picolé de Fruta Pet", preco: 8.00, estoque: 10 },
    { id: 12, nome: "Petisco Congelado Pet", preco: 10.00, estoque: 10 }
];

let vendasBD = JSON.parse(localStorage.getItem('vendasBD')) || [];
let carrinho = [];
let formaPagamento = null;

// Salvar no localStorage
function salvarBD() {
    localStorage.setItem('produtosBD', JSON.stringify(produtosBD));
    localStorage.setItem('vendasBD', JSON.stringify(vendasBD));
}

// Seleção de produtos do carrinho
document.querySelectorAll('.btn-produto').forEach(button => {
    button.addEventListener('click', () => {
        const id = parseInt(button.getAttribute('data-id'));
        const produto = produtosBD.find(p => p.id === id);

        if (!produto) return alert("Produto não encontrado!");

        const itemCarrinho = carrinho.find(item => item.id === id);
        if (itemCarrinho) {
            itemCarrinho.quantidade += 1;
        } else {
            carrinho.push({ id: produto.id, nome: produto.nome, preco: produto.preco, quantidade: 1 });
        }
        atualizarCarrinho();
    });
});

// Selecionar forma de pagamento
document.querySelectorAll('.btn-pagamento').forEach(button => {
    button.addEventListener('click', () => {
        formaPagamento = button.getAttribute('data-metodo');
        document.getElementById('forma-selecionada').innerText = formaPagamento.toUpperCase();
    });
});

function atualizarCarrinho() {
    const tbody = document.getElementById('itens-carrinho');
    tbody.innerHTML = '';
    let subtotal = 0;

    carrinho.forEach((item, index) => {
        const itemSubtotal = item.preco * item.quantidade;
        subtotal += itemSubtotal;

        const tr = document.createElement('tr');
        tr.innerHTML = `
${item.nome}

${item.quantidade}

R$ ${item.preco.toFixed(2)}

R$ ${itemSubtotal.toFixed(2)}

❌
`;
tbody.appendChild(tr);
});

const desconto = parseFloat(document.getElementById('discount').value) || 0;
const total = Math.max(0, subtotal - desconto);

document.getElementById('valor-subtotal').innerText = subtotal.toFixed(2);
document.getElementById('valor-total').innerText = total.toFixed(2);
}

function removerItem(index) {
carrinho.splice(index, 1);
atualizarCarrinho();
}

// SIMULAÇÃO DA REGRA DE NEGÓCIO E BAIXA NO ESTOQUE (Requisito 2.2)
document.getElementById('btn-finalizar-venda').addEventListener('click', () => {
if (carrinho.length === 0) return alert('O carrinho está vazio!');
if (!formaPagamento) return alert('Selecione uma forma de pagamento!');

// 1. Validação de Restrição Operacional (Verificação de Estoque)
for (const item of carrinho) {
    const prod = produtosBD.find(p => p.id === item.id);
    if (item.quantidade > prod.estoque) {
        return alert(`Estoque insuficiente para "\({prod.nome}". Disponível:\){prod.estoque}, Solicitado: ${item.quantidade}`);
    }
}

// 2. Processar venda e dar baixa automática no estoque
carrinho.forEach(item => {
    const prod = produtosBD.find(p => p.id === item.id);
    prod.estoque -= item.quantidade; // Baixa automática
});

// 3. Salvar registro da venda
const novaVenda = {
    id: vendasBD.length + 1,
    data: new Date().toISOString(),
    formaPagamento: formaPagamento,
    total: parseFloat(document.getElementById('valor-total').innerText),
    itens: [...carrinho]
};

vendasBD.push(novaVenda);
salvarBD();

alert('Venda realizada com sucesso! Estoque atualizado.');
carrinho = [];
formaPagamento = null;
document.getElementById('forma-selecionada').innerText = 'Nenhuma';
atualizarCarrinho();
});