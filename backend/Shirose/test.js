// SIMULAÇÃO DO BANCO DE DADOS / ESTADO DA APLICAÇÃO
const estoque = [
  { id: 1, nome: "Água de coco", preco: 8.00, saldo: 15 },
  { id: 2, nome: "Suco de Melancia", preco: 10.00, saldo: 5 },
  { id: 3, nome: "Açaí na Tigela", preco: 18.00, saldo: 2 }
];

const vendas = []; // Tabela de Registro de Vendas (Cabeçalho + Itens)

/**
 * Função responsável por processar o fluxo completo de registro de venda
 */
function processarVenda({ operador, formaPagamento, carrinho, desconto = 0 }) {
  
  // 1. REGRA DE RESTRIÇÃO OPERACIONAL (Validação do Estoque)
  for (const item of carrinho) {
    const produtoEstoque = estoque.find(p => p.id === item.produtoId);

    if (!produtoEstoque) {
      return { 
        sucesso: false, 
        erro: `Produto com ID ${item.produtoId} não encontrado no sistema.` 
      };
    }

    if (item.quantidade > produtoEstoque.saldo) {
      return {
        sucesso: false,
        erro: `Venda bloqueada: Estoque insuficiente para "\({produtoEstoque.nome}". Solicitado:\){item.quantidade} | Disponível: ${produtoEstoque.saldo}`
      };
    }
  }

  // 2. INCLUSÃO DOS ITENS E BAIXA AUTOMÁTICA NO ESTOQUE
  let valorSubtotal = 0;
  const itensVenda = [];

  for (const item of carrinho) {
    const produtoEstoque = estoque.find(p => p.id === item.produtoId);

    // Baixa Automática no Estoque
    produtoEstoque.saldo -= item.quantidade;

    const valorItem = produtoEstoque.preco * item.quantidade;
    valorSubtotal += valorItem;

    // Tabela associativa de itens da venda
    itensVenda.push({
      produtoId: produtoEstoque.id,
      nomeProduto: produtoEstoque.nome,
      quantidade: item.quantidade,
      precoUnitario: produtoEstoque.preco,
      subtotal: valorItem
    });
  }

  // 3. ABERTURA E REGISTRO DA VENDA (Gravação do Cabeçalho)
  const valorTotalFinal = Math.max(0, valorSubtotal - desconto);

  const cabecalhoVenda = {
    idVenda: vendas.length + 1,
    dataHora: new Date().toLocaleString("pt-BR"),
    operadorResponsavel: operador,
    formaPagamento: formaPagamento,
    desconto: desconto,
    valorTotal: valorTotalFinal,
    itens: itensVenda // Associativa
  };

  vendas.push(cabecalhoVenda);

  return {
    sucesso: true,
    mensagem: "Venda registrada e estoque atualizado com sucesso!",
    transacao: cabecalhoVenda
  };
}

// --- EXEMPLOS DE USO ---

// Pedido 1: Tentativa de venda normal (Deve passar)
const carrinhoValido = [
  { produtoId: 1, quantidade: 2 }, // 2x Água de coco
  { produtoId: 2, quantidade: 1 }  // 1x Suco de Melancia
];

console.log(processarVenda({
  operador: "Maria",
  formaPagamento: "Pix",
  carrinho: carrinhoValido,
  desconto: 2.00
}));

// Pedido 2: Tentativa de venda acima do estoque disponível (Deve ser barrada)
const carrinhoInvalido = [
  { produtoId: 3, quantidade: 5 } // Solicitando 5x Açaí (Saldo é apenas 2)
];

console.log(processarVenda({
  operador: "João",
  formaPagamento: "Cartão de Crédito",
  carrinho: carrinhoInvalido
}));