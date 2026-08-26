// Banco de dados em memória para registrar os aportes simulados ativos pelo usuário
if (typeof window.simulacoesUsuario === 'undefined') {
    window.simulacoesUsuario = {};
}

// ➔ MOTOR MATEMÁTICO CORE: Recomputa a linha inteira em tempo real à medida que você digita!
window.computarSimulacaoAporte = function(inputElement, ticker, pmReal, paReal, adquiridoReal, ptReal) {
    const qtdSimulada = parseInt(inputElement.value) || 0;
    
    // Registra a quantidade na memória global do ecossistema
    window.simulacoesUsuario[ticker] = qtdSimulada;

    // Resgata os ponteiros das células que serão atualizadas dinamicamente na linha
    const celulaCusto = document.getElementById(`custo-${ticker}`);
    const celulaNovoPM = document.getElementById(`novopm-${ticker}`);
    const celulaNovaVar = document.getElementById(`novavar-${ticker}`);
    const celulaNovoUpside = document.getElementById(`novoupside-${ticker}`);

    // FÓRMULA 1: Investi/o (Custo do Aporte) = Quantidade Simulada x Preço Atual
    let subtotalCusto = qtdSimulada * paReal;
    
    if (subtotalCusto > 0) {
        celulaCusto.innerText = "R$ " + subtotalCusto.toFixed(2).replace('.', ',');
        celulaCusto.style.fontWeight = "bold";
    } else {
        celulaCusto.innerText = "R$ 0,00";
        celulaCusto.style.fontWeight = "normal";
    }

    // FÓRMULA 2: Novo Preço Médio Ponderado (Média Ponderada Realidade + Simulação)
    if (qtdSimulada > 0) {
        let totalQtdNova = adquiridoReal + qtdSimulada;
        let novoPMPonderado = ((adquiridoReal * pmReal) + (qtdSimulada * paReal)) / totalQtdNova;
        celulaNovoPM.innerText = "R$ " + novoPMPonderado.toFixed(2).replace('.', ',');

        // FÓRMULA 3: Nova Variação Patrimonial Projetada = ((Preço Atual - Novo PM) / Novo PM) * 100
        let novaVariacao = ((paReal - novoPMPonderado) / novoPMPonderado) * 100;
        celulaNovaVar.innerText = novaVariacao.toFixed(2).replace('.', ',') + "%";
        celulaNovaVar.style.color = novaVariacao >= 0 ? "#10B981" : "#EF4444"; // Verde se positivo, vermelho se negativo

        // FÓRMULA 4: Novo Upside / Margem de Segurança = ((Preço Teto - Novo PM) / Preço Teto) * 100
        if (ptReal > 0) {
            let novoUpside = ((ptReal - novoPMPonderado) / ptReal) * 100;
            celulaNovoUpside.innerText = novoUpside.toFixed(2).replace('.', ',') + "%";
            celulaNovoUpside.style.color = novoUpside >= 0 ? "#10B981" : "#EF4444";
        }
    } else {
        // RESET OPERACIONAL: Se o usuário apagar ou zerar o input, a linha volta instantaneamente aos valores reais
        celulaNovoPM.innerText = "R$ " + pmReal.toFixed(2).replace('.', ',');
        
        let varOriginal = pmReal > 0 ? (((paReal - pmReal) / pmReal) * 100) : 0;
        celulaNovaVar.innerText = varOriginal.toFixed(2).replace('.', ',') + "%";
        celulaNovaVar.style.color = varOriginal >= 0 ? "#10B981" : "#EF4444";

        if (ptReal > 0) {
            let upsideOrig = ((ptReal - pmReal) / ptReal) * 100;
            celulaNovoUpside.innerText = upsideOrig.toFixed(2).replace('.', ',') + "%";
            celulaNovoUpside.style.color = upsideOrig >= 0 ? "#10B981" : "#EF4444";
        }
    }

    // FÓRMULA AGREGADA: Atualiza o macro acumulador de aportes do topo
    window.recalcularCardAporteGlobal();
};

// ➔ ACUMULADOR AGREGADO DO RADAR: Soma o custo de todas as simulações e joga no topo
window.recalcularCardAporteGlobal = function() {
    let totalAcumuladoGeral = 0;
    
    for (let ticker in window.simulacoesUsuario) {
        const celulaPreco = document.getElementById(`preco-atual-val-${ticker}`);
        if (celulaPreco && window.simulacoesUsuario[ticker] > 0) {
            let precoAt = window.converterParaNumero(celulaPreco.innerText);
            totalAcumuladoGeral += (window.simulacoesUsuario[ticker] * precoAt);
        }
    }

    const cardAporteElement = document.getElementById('card-valor-aporte-simulado');
    if (cardAporteElement) {
        if (totalAcumuladoGeral > 0) {
            cardAporteElement.innerText = "R$ " + totalAcumuladoGeral.toFixed(2).replace('.', ',');
            cardAporteElement.style.color = "var(--laranja-claro-dourado)";
        } else {
            cardAporteElement.innerText = "R$ 0,00";
            cardAporteElement.style.color = "var(--branco)";
        }
    }
};
