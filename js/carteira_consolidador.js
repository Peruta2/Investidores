// ============================================================================
// 1. ESCOPO GLOBAL E AUXILIARES DE ESTILIZAÇÃO E RENDERIZAÇÃO
// ============================================================================

window.alternarBloco = function(prefixoId, indexBloco) {
    const linhasFilhas = document.querySelectorAll(`.${prefixoId}-filhas-bloco-${indexBloco}`);
    const linhaSubmenu = document.getElementById(`${prefixoId}-submenu-bloco-${indexBloco}`);
    const linhaMestre = document.getElementById(`${prefixoId}-mestre-bloco-${indexBloco}`);
    
    if (!linhasFilhas || linhasFilhas.length === 0) return;

    let estaEscondido = linhasFilhas.item(0).classList.contains('row-hidden');

    linhasFilhas.forEach(linha => {
        if (estaEscondido) {
            linha.classList.remove('row-hidden');
        } else {
            linha.classList.add('row-hidden');
        }
    });

    if (linhaSubmenu) {
        if (estaEscondido) {
            linhaSubmenu.classList.remove('row-hidden');
        } else {
            linhaSubmenu.classList.add('row-hidden');
        }
    }

    if (linhaMestre) {
        if (estaEscondido) {
            linhaMestre.classList.remove('collapsed');
        } else {
            linhaMestre.classList.add('collapsed');
        }
    }
};

window.converterParaNumero = function(valorOriginal) {
    if (!valorOriginal) return 0;
    let texto = String(valorOriginal);
    let limpo = texto.replace('R$', '').replace('%', '').replace(/\s/g, '').trim();
    if (limpo.includes(',') && limpo.includes('.')) limpo = limpo.replace(/\./g, '').replace(',', '.');
    else if (limpo.includes(',')) limpo = limpo.replace(',', '.');
    return parseFloat(limpo) || 0;
};

// ============================================================================
// 2. MOTOR CORE DE PROCESSAMENTO DO DASHBOARD INTEGRADO (MODULO 2)
// ============================================================================
async function inicializarModuloConsolidador() {
    const cardsContainer = document.getElementById('kpi-cards-real-container');
    const containerId20 = document.getElementById('container-id20-tabela');
    const containerId40 = document.getElementById('container-id40-tabela');
    
    try {
        const resposta = await fetch('../csv/carteira_consolidador.csv?v=' + Math.random());
        if (!resposta.ok) throw new Error('Falha ao ler carteira_consolidador.csv');

        const buffer = await resposta.arrayBuffer();
        const decodificador = new TextDecoder('windows-1252');
        
        const textoPuro = decodificador.decode(buffer).replace(/\r/g, '');
        const lines = textoPuro.split('\n');

        let htmlId20 = '<table class="db-table tabela-classes-real">';
        let htmlId40 = '<table class="db-table tabela-ativos-real">';
        
        let id0Linha1Titulos = null;
        let id0Linha1AtivosClass = null;
        
        let labelsGrafico = [];
        let valoresGrafico = [];

        // Inicialização limpa das variáveis dos cards de topo
        let kpiPatrimonioReal = "R$ 0,00", kpiAtivosReal = "0", kpiGanhoNominal = "R$ 0,00", pctGanho = "0,00%", pctPatrimonioCard1 = "0,00%";
        let valRV = "-", pctRV = "-", valRF = "-", pctRF = "-";

        let idEscopoAtual = 70; 
        let blocoId20Cont = 0;
        let blocoId40Cont = 0;

        let herancaVacanteReal = "";
        let herancaVacanteAtivoReal = "";

        // Contadores numéricos puramente abstratos de alternância de linhas (Linha 1 títulos, Linha 2 dados)
        let linhasCabecalho70 = 0;
        let linhasCabecalho20 = 0;
        let linhasCabecalho40 = 0;

        for (let i = 0; i < lines.length; i++) {
            const linhaLimpa = lines[i].trim();
            if (!linhaLimpa || linhaLimpa === '"') continue;

            const campos = linhaLimpa.split(';').map(c => c.trim());
            const idRow = parseInt(campos); // Captura o ID de controle na coluna 0
            if (isNaN(idRow)) continue;

            // Roteador de Escopo Rígido por bloco físico do CSV
            if (idRow === 70 || idRow === 20 || idRow === 40) {
                idEscopoAtual = idRow;
                linhasCabecalho20 = 0;
                linhasCabecalho40 = 0;
                continue; 
            }

            // 2.1 PROCESSAMENTO DO ID 70
            if (idEscopoAtual === 70) {
                if (idRow === 0) {
                    if (linhasCabecalho70 === 0) {
                        linhasCabecalho70++;
                        continue;
                    }
                    kpiAtivosReal = campos[5] || "0";       
                    kpiPatrimonioReal = campos[7] || "R$ 0,00";  
                    pctPatrimonioCard1 = campos[8] || "0,00%"; 
                    kpiGanhoNominal = campos[11] || "R$ 0,00";    
                    pctGanho = campos[12] || "0,00%";            
                }
                continue;
            }

            // 2.2 PROCESSAMENTO DO ID 20 (CONSOLIDAÇÃO POR CLASSES REAIS)
            else if (idEscopoAtual === 20) {
                let dadosCorte20 = campos.slice(1, 13);
                while (dadosCorte20.length < 12) dadosCorte20.push('');

                if (idRow === 0) {
                    if (linhasCabecalho20 === 0) { // Linha 1: Cabeçalho estrutural de títulos
                        id0Linha1Titulos = [...dadosCorte20];
                        linhasCabecalho20++;
                        continue;
                    }
                    
                    // Linha 2: Valores Consolidados Legítimos (Menu Mestre)
                    blocoId20Cont++;
                    
                    // ➔ RESOLUÇÃO DO CONFLITO DE ÍNDICES: Captura as células exatas (Saldo = índice 6 | Porcentagem = índice 2)
                    if (blocoId20Cont === 1) {
                        valRV = dadosCorte20[6] || "-"; 
                        pctRV = dadosCorte20[2] || "-"; 
                    } else if (blocoId20Cont === 2) {
                        valRF = dadosCorte20[6] || "-"; 
                        pctRF = dadosCorte20[2] || "-"; 
                    }

                    let htmlStr = `<tr id="real-cl-mestre-${blocoId20Cont}" class="id0-row-clickable collapsed" onclick="alternarBloco('real-cl', ${blocoId20Cont})">`;
                    dadosCorte20.forEach((conteudo, i) => {
                        let titulo = id0Linha1Titulos ? id0Linha1Titulos[i] : '';
                        let icone = i === 0 ? `<span class="toggle-icon" style="color: var(--azul-claro-brilhoso); margin-right:6px;">▼</span>` : '';
                        htmlStr += `<td class="linha-id0" style="border-bottom: 1px solid rgba(197, 168, 128, 0.2); padding: 8px 10px;">
                            <div style="font-size: 10px; color: var(--cinza-claro-azulado); font-weight: normal; margin-bottom: 2px;">${titulo}</div>
                            <div style="font-size: 13px; font-weight: bold; display: flex; align-items: center; color: var(--branco);">${icone}${conteudo}</div>
                        </td>`;
                    });
                    htmlStr += '</tr>';
                    htmlId20 += htmlStr;
                    
                    linhasCabecalho20 = 0; 
                    continue; 
                }
                if (idRow === 12) {
                    let htmlStr = `<tr id="real-cl-submenu-bloco-${blocoId20Cont}" class="linha-id1-row row-hidden">`;
                    dadosCorte20.forEach(campo => {
                        htmlStr += `<td style="font-size: 11px; color: var(--cinza-claro-azulado); font-weight: normal; padding: 12px 10px 4px 10px; border-bottom: 1px solid rgba(255,255,255,0.05); background: transparent !important;">${campo}</td>`;
                    });
                    htmlStr += '</tr>';
                    htmlId20 += htmlStr;
                    continue;
                }
                if (idRow >= 2 && idRow <= 5) {
                    let htmlStr = `<tr class="linha-dados real-cl-filhas-bloco-${blocoId20Cont} row-hidden">`;
                    dadosCorte20.forEach((valor, idx) => {
                        if (idx === 1) {
                            if (valor === '') htmlStr += `<td class="campo-herdado-nulo">${herancaVacanteReal}</td>`;
                            else { herancaVacanteReal = valor; htmlStr += `<td>${valor}</td>`; }
                        } else {
                            htmlStr += `<td>${valor}</td>`;
                        }
                    });
                    htmlStr += '</tr>';
                    htmlId20 += htmlStr;

                    // Lógica de soma recursiva do gráfico por subcategoria (% real na carteira = índice 3 do corte)
                    let classeMacro = dadosCorte20[0]; 
                    let percentualTexto = dadosCorte20[3]; 

                    if (classeMacro && percentualTexto !== undefined && percentualTexto !== "") {
                        let valorNumerico = window.converterParaNumero(percentualTexto);
                        let indexExistente = labelsGrafico.indexOf(classeMacro);
                        if (indexExistente !== -1) {
                            valoresGrafico[indexExistente] += valorNumerico;
                        } else {
                            labelsGrafico.push(classeMacro);
                            valoresGrafico.push(valorNumerico);
                        }
                    }
                    continue;
                }
            }

            // 2.3 PROCESSAMENTO DO ID 40
            else if (idEscopoAtual === 40) {
                let dadosRealAtivos = campos.slice(1, 13);
                while (dadosRealAtivos.length < 12) dadosRealAtivos.push('');

                if (idRow === 0) {
                    if (linhasCabecalho40 === 0) { // Linha 1: Títulos de Ativos Reais
                        id0Linha1AtivosClass = [...dadosRealAtivos];
                        linhasCabecalho40++;
                        continue;
                    }
                    
                    // Linha 2: Valores legítimos do Menu Mestre de Ativos Reais
                    blocoId40Cont++;
                    let htmlStr = `<tr id="real-at-mestre-bloco-${blocoId40Cont}" class="id0-row-clickable collapsed" onclick="alternarBloco('real-at', ${blocoId40Cont})">`;
                    dadosRealAtivos.forEach((conteudo, i) => {
                        let titulo = id0Linha1AtivosClass ? id0Linha1AtivosClass[i] : '';
                        let icone = i === 0 ? `<span class="toggle-icon" style="color: var(--azul-claro-brilhoso); margin-right:6px;">▼</span>` : '';
                        htmlStr += `<td class="linha-id0" style="border-bottom: 1px solid rgba(197, 168, 128, 0.2); padding: 8px 10px;">
                            <div style="font-size: 10px; color: var(--cinza-claro-azulado); font-weight: normal; margin-bottom: 2px;">${titulo}</div>
                            <div style="font-size: 13px; font-weight: bold; display: flex; align-items: center; color: var(--branco);">${icone}${conteudo}</div>
                        </td>`;
                    });
                    htmlStr += '</tr>';
                    htmlId40 += htmlStr;
                    
                    linhasCabecalho40 = 0; 
                    continue; 
                }
                if (idRow === 11) {
                    let htmlStr = `<tr id="real-at-submenu-bloco-${blocoId40Cont}" class="linha-id1-row row-hidden">`;
                    dadosRealAtivos.forEach(campo => {
                        htmlStr += `<td style="font-size: 11px; color: var(--cinza-claro-azulado); font-weight: normal; padding: 12px 10px 4px 10px; border-bottom: 1px solid rgba(255,255,255,0.05); background: transparent !important;">${campo}</td>`;
                    });
                    htmlStr += '</tr>';
                    htmlId40 += htmlStr;
                    continue; 
                }
                if (idRow >= 2 && idRow <= 5) {
                    let htmlStr = `<tr class="linha-dados real-at-filhas-bloco-${blocoId40Cont} row-hidden">`;
                    dadosRealAtivos.forEach((valor, idx) => {
                        if (idx === 1) {
                            if (valor === '') {
                                htmlStr += `<td class="campo-herdado-nulo">${herancaVacanteAtivoReal}</td>`;
                            } else {
                                herancaVacanteAtivoReal = valor;
                                htmlStr += `<td>${valor}</td>`;
                            }
                        } else {
                            htmlStr += `<td>${valor}</td>`;
                        }
                    });
                    htmlStr += '</tr>';
                    htmlId40 += htmlStr;
                    continue; 
                }
            }
        } // Fechamento do laço estrutural 'for'

        containerId20.innerHTML = htmlId20 + '</table>';
        containerId40.innerHTML = htmlId40 + '</table>';

        const coresOficiais = ['#38BDF8', '#E5C495', '#A78BFA', '#F43F5E', '#10B981'];

        let htmlLegendaStr = `<div class="chart-legenda-container">`;
        labelsGrafico.forEach((classe, index) => {
            let corItem = coresOficiais[index] || '#94A3B8';
            let valorFormatado = valoresGrafico[index].toFixed(2).replace('.', ',') + '%';
            
            htmlLegendaStr += `
                <div class="legenda-item">
                    <div class="legenda-classe-flex">
                        <div class="legenda-cor-quadrado" style="background-color: ${corItem};"></div>
                        <span>${classe}</span>
                    </div>
                    <span>${valorFormatado}</span>
                </div>`;
        });
        htmlLegendaStr += `</div>`;

        // Cores condicionais dinâmicas para o percentual do Card 1
        let corPercentualPatrimonio = "#10B981"; 
        if (pctPatrimonioCard1.includes("-")) {
            corPercentualPatrimonio = "#EF4444"; 
        }

        // MONTAGEM DO PAINEL DE 5 BLOCOS INDIVIDUAIS COM OS ÍNDICES RECALIBRADOS 13 CAMPOS
        let htmlPainelCompleto = "";
        
        // Card 1: Patrimônio com percentual à direita colorido
        htmlPainelCompleto += `
            <div class="kpi-card">
                <div class="card-titulo">Patrimônio Real Consolidado</div>
                <div class="card-valor" style="color: var(--branco); font-size: 20px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                    <span>${kpiPatrimonioReal}</span>
                    <span style="font-size: 13px; color: ${corPercentualPatrimonio}; font-weight: bold;">(${pctPatrimonioCard1})</span>
                </div>
                <div class="card-sub">Ativos em Carteira: ${kpiAtivosReal}</div>
            </div>`;
            
        // Card 2: Ganho de Capital nominal e percentual
        htmlPainelCompleto += `
            <div class="kpi-card">
                <div class="card-titulo">Ganho de Capital Acumulado</div>
                <div class="card-valor" style="color: #10B981;">${kpiGanhoNominal}</div>
                <div class="card-sub">Rentabilidade Global: ${pctGanho}</div>
            </div>`;
            
        // Card 3: Renda Variável com os índices exatos resolvidos de fatiamento
        htmlPainelCompleto += `
            <div class="kpi-card">
                <div class="card-titulo">Alocação Renda Variável</div>
                <div class="card-valor">${valRV}</div>
                <div class="card-sub">Alocado Real: ${pctRV}</div>
            </div>`;

        // Card 4: Renda Fixa com os índices exatos resolvidos de fatiamento
        htmlPainelCompleto += `
            <div class="kpi-card">
                <div class="card-titulo">Alocação Renda Fixa</div>
                <div class="card-valor">${valRF}</div>
                <div class="card-sub">Alocado Real: ${pctRF}</div>
            </div>`;
            
        // Card 5: O Gráfico Real + Legenda Lateral (Ocupando a quinta posição estável)
        htmlPainelCompleto += `
            <div class="chart-box-card">
                <div style="width: 90px; height: 90px; flex-shrink: 0; display: flex; justify-content: center; align-items: center;">
                    <canvas id="chartAlocacaoReal"></canvas>
                </div>
                ${htmlLegendaStr}
            </div>`;
        
        cardsContainer.innerHTML = htmlPainelCompleto.trim();

        if (typeof Chart !== 'undefined' && valoresGrafico.length > 0) {
            const ctx = document.getElementById('chartAlocacaoReal').getContext('2d');
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labelsGrafico,
                    datasets: [{
                        data: valoresGrafico,
                        backgroundColor: coresOficiais,
                        borderWidth: 1,
                        borderColor: '#0A192F'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            enabled: true,
                            backgroundColor: 'transparent',
                            borderColor: 'transparent',
                            borderWidth: 0,
                            shadowColor: 'transparent',
                            displayColors: true,
                            boxWidth: 6,
                            boxHeight: 6,
                            boxPadding: 4,
                            padding: 2,
                            bodyFont: { size: 12, weight: '600', family: "'Segoe UI', sans-serif" },
                            bodyColor: '#FFFFFF',
                            callbacks: {
                                title: function() { return ''; },
                                label: function(context) { return ' ' + context.label; }
                            }
                        }
                    },
                    cutout: '70%'
                }
            });
        }

    } catch (erro) {
        cardsContainer.innerHTML = `<div style="grid-column: span 5; background: rgba(239, 68, 68, 0.15); border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; font-weight: bold; color: #ef4444; font-size:14px; font-family: sans-serif;">⚠️ ERRO NO CONSOLIDADOR: ${erro.message}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', inicializarModuloConsolidador);
