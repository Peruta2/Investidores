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
// 2. MOTOR CORE DE PROCESSAMENTO DO DASHBOARD INTEGRADO
// ============================================================================
async function inicializarModuloBalanceamento() {
    const cardsContainer = document.getElementById('kpi-cards-container');
    const containerId10 = document.getElementById('container-id10-tabela');
    const containerId30 = document.getElementById('container-id30-tabela');
    
    try {
        const resposta = await fetch('../csv/carteira_balanceamento.csv?v=' + Math.random());
        if (!resposta.ok) throw new Error('Falha ao ler carteira_balanceamento.csv');

        const buffer = await resposta.arrayBuffer();
        const decodificador = new TextDecoder('windows-1252');
        
        const textoPuro = decodificador.decode(buffer).replace(/\r/g, '');
        const lines = textoPuro.split('\n');

        let htmlId10 = '<table class="db-table tabela-classes">';
        let htmlId30 = '<table class="db-table tabela-ativos">';
        
        let id0Linha1Titulos = null;
        let id0Linha1AtivosClass = null;
        
        let labelsGrafico = [];
        let valoresGrafico = [];

        let kpiPatrimonio = "R$ 0,00", kpiAtivos = "0", kpiRV = "-", kpiRF = "-", pctRV = "-", pctRF = "-";

        let idEscopoAtual = 60; 
        let blocoId10Cont = 0;
        let blocoId30Cont = 0;

        let herancaVacanteDes = "";
        let herancaVacanteAtivo = "";

        // Contadores numéricos puramente abstratos de alternância de linhas (Linha 1 títulos, Linha 2 dados)
        let linhasCabecalho60 = 0;
        let linhasCabecalho10 = 0;
        let linhasCabecalho30 = 0;

        for (let i = 0; i < lines.length; i++) {
            const linhaLimpa = lines[i].trim();
            if (!linhaLimpa || linhaLimpa === '"') continue;

            const campos = linhaLimpa.split(';').map(c => c.trim());
            const idRow = parseInt(campos);
            if (isNaN(idRow)) continue;

            // Roteador de Escopo Rígido por bloco físico do CSV
            if (idRow === 60 || idRow === 10 || idRow === 30) {
                idEscopoAtual = idRow;
                linhasCabecalho10 = 0; 
                linhasCabecalho30 = 0;
                continue; 
            }

            // 2.1 PROCESSAMENTO DO ID 60
            if (idEscopoAtual === 60) {
                if (idRow === 0) {
                    if (linhasCabecalho60 === 0) {
                        linhasCabecalho60++;
                        continue;
                    }
                    kpiAtivos = campos[5] || "0";       // Coluna 5 (Ativos Total)
                    kpiPatrimonio = campos[7] || "R$ 0,00"; // Coluna 7 (Patrimônio Total)
                }
                continue;
            }

            // 2.2 PROCESSAMENTO DO ID 10 (MACRO CLASSES DE INVESTIMENTO)
            else if (idEscopoAtual === 10) {
                let dadosCorte10 = campos.slice(1, 9);
                while (dadosCorte10.length < 8) dadosCorte10.push('');

                if (idRow === 0) {
                    if (linhasCabecalho10 === 0) { // Linha 1: Cabeçalho estrutural de títulos
                        id0Linha1Titulos = [...dadosCorte10];
                        linhasCabecalho10++;
                        continue;
                    }
                    
                    // Linha 2: Dados Consolidados Legítimos (DESEJADO)
                    blocoId10Cont++;
                    
                    // ➔ ALINHAMENTO SEQUENCIAL RÍGIDO: Se for o primeiro bloco mestre, alimenta RV. Se for o segundo, alimenta RF.
                    if (blocoId10Cont === 1) {
                        kpiRV = campos[7] || "-"; // Saldo Renda Variável (Coluna 7)
                        pctRV = campos[3] || "-"; // % RV Planejado (Coluna 3)
                    } else if (blocoId10Cont === 2) {
                        kpiRF = campos[7] || "-"; // Saldo Renda Fixa (Coluna 7)
                        pctRF = campos[3] || "-"; // % RF Planejado (Coluna 3)
                    }

                    let htmlStr = `<tr id="bal-cl-mestre-${blocoId10Cont}" class="id0-row-clickable collapsed" onclick="alternarBloco('bal-cl', ${blocoId10Cont})">`;
                    dadosCorte10.forEach((conteudo, i) => {
                        let titulo = id0Linha1Titulos ? id0Linha1Titulos[i] : '';
                        let icone = i === 0 ? `<span class="toggle-icon" style="color: var(--azul-claro-brilhoso); margin-right:6px;">▼</span>` : '';
                        htmlStr += `<td class="linha-id0" style="border-bottom: 1px solid rgba(197, 168, 128, 0.2); padding: 8px 10px;">
                            <div style="font-size: 10px; color: var(--cinza-claro-azulado); font-weight: normal; margin-bottom: 2px;">${titulo}</div>
                            <div style="font-size: 13px; font-weight: bold; display: flex; align-items: center; color: var(--branco);">${icone}${conteudo}</div>
                        </td>`;
                    });
                    htmlStr += '</tr>';
                    htmlId10 += htmlStr;
                    
                    linhasCabecalho10 = 0; // Reseta para o próximo cabeçalho mestre
                    continue; 
                }
                if (idRow === 12) {
                    let htmlStr = `<tr id="bal-cl-submenu-bloco-${blocoId10Cont}" class="linha-id1-row row-hidden">`;
                    dadosCorte10.forEach(campo => {
                        htmlStr += `<td style="font-size: 11px; color: var(--cinza-claro-azulado); font-weight: normal; padding: 12px 10px 4px 10px; border-bottom: 1px solid rgba(255,255,255,0.05); background: transparent !important;">${campo}</td>`;
                    });
                    htmlStr += '</tr>';
                    htmlId10 += htmlStr;
                    continue;
                }
                if (idRow >= 2 && idRow <= 5) {
                    let htmlStr = `<tr class="linha-dados bal-cl-filhas-bloco-${blocoId10Cont} row-hidden">`;
                    dadosCorte10.forEach((valor, idx) => {
                        if (idx === 1) {
                            if (valor === '') htmlStr += `<td class="campo-herdado-nulo">${herancaVacanteDes}</td>`;
                            else { herancaVacanteDes = valor; htmlStr += `<td>${valor}</td>`; }
                        } else {
                            htmlStr += `<td>${valor}</td>`;
                        }
                    });
                    htmlStr += '</tr>';
                    htmlId10 += htmlStr;

                    // Lógica de soma recursiva por % na carteira (Coluna 4 do CSV = índice 3 útil do corte)
                    let classeMacro = dadosCorte10[0]; 
                    let percentualTexto = dadosCorte10[3]; 

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

            // 2.3 PROCESSAMENTO DO ID 30
            else if (idEscopoAtual === 30) {
                let dadosRealAtivos = campos.slice(1, 8);
                while (dadosRealAtivos.length < 7) dadosRealAtivos.push('');

                if (idRow === 0) {
                    if (linhasCabecalho30 === 0) { // Linha 1: Títulos de Ativos
                        id0Linha1AtivosClass = [...dadosRealAtivos];
                        linhasCabecalho30++;
                        continue;
                    }
                    
                    // Linha 2: Valores legítimos do Menu Mestre de Ativos
                    blocoId30Cont++;
                    let htmlStr = `<tr id="bal-at-mestre-bloco-${blocoId30Cont}" class="id0-row-clickable collapsed" onclick="alternarBloco('bal-at', ${blocoId30Cont})">`;
                    dadosRealAtivos.forEach((conteudo, i) => {
                        let titulo = id0Linha1AtivosClass ? id0Linha1AtivosClass[i] : '';
                        let icone = i === 0 ? `<span class="toggle-icon" style="color: var(--azul-claro-brilhoso); margin-right:6px;">▼</span>` : '';
                        htmlStr += `<td class="linha-id0" style="border-bottom: 1px solid rgba(197, 168, 128, 0.2); padding: 8px 10px;">
                            <div style="font-size: 10px; color: var(--cinza-claro-azulado); font-weight: normal; margin-bottom: 2px;">${titulo}</div>
                            <div style="font-size: 13px; font-weight: bold; display: flex; align-items: center; color: var(--branco);">${icone}${conteudo}</div>
                        </td>`;
                    });
                    htmlStr += '</tr>';
                    htmlId30 += htmlStr;
                    
                    linhasCabecalho30 = 0; 
                    continue; 
                }
                if (idRow === 11) {
                    let htmlStr = `<tr id="bal-at-submenu-bloco-${blocoId30Cont}" class="linha-id1-row row-hidden">`;
                    dadosRealAtivos.forEach(campo => {
                        htmlStr += `<td style="font-size: 11px; color: var(--cinza-claro-azulado); font-weight: normal; padding: 12px 10px 4px 10px; border-bottom: 1px solid rgba(255,255,255,0.05); background: transparent !important;">${campo}</td>`;
                    });
                    htmlStr += '</tr>';
                    htmlId30 += htmlStr;
                    continue; 
                }
                if (idRow >= 2 && idRow <= 5) {
                    let htmlStr = `<tr class="linha-dados bal-at-filhas-bloco-${blocoId30Cont} row-hidden">`;
                    dadosRealAtivos.forEach((valor, idx) => {
                        if (idx === 1) {
                            if (valor === '') {
                                htmlStr += `<td class="campo-herdado-nulo">${herancaVacanteAtivo}</td>`;
                            } else {
                                herancaVacanteAtivo = valor;
                                htmlStr += `<td>${valor}</td>`;
                            }
                        } else {
                            htmlStr += `<td>${valor}</td>`;
                        }
                    });
                    htmlStr += '</tr>';
                    htmlId30 += htmlStr;
                    continue; 
                }
            }
        } // Fechamento do laço estrutural 'for'

        htmlId10 += '</table>';
        htmlId30 += '</table>';

        const coresOficiais = ['#38BDF8', '#E5C495', '#A78BFA', '#F43F5E', '#10B981'];

        // Geração da Legenda do Módulo 1 com a nova linha de Fechamento do Planejamento
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

        // ➔ INJEÇÃO PREMIUM NO MÓDULO 1: Totalizador de planejamento em 100,00% na legenda do Card 4
        htmlLegendaStr += `
            <div class="legenda-totalizador-linha">
                <span>Planejado:</span>
                <span>100,00%</span>
            </div>
        </div>`;

        // Inteligência condicional cromática para os percentuais macros (se houver)
        let htmlPainelCompleto = "";
        htmlPainelCompleto += `<div class="kpi-card"><div class="card-titulo">Patrimônio Total Planejado</div><div class="card-valor" style="color: var(--laranja-claro-dourado);">${kpiPatrimonio}</div><div class="card-sub">Ativos Cadastrados: ${kpiAtivos}</div></div>`;
        htmlPainelCompleto += `<div class="kpi-card"><div class="card-titulo">Alocação Renda Variável</div><div class="card-valor">${kpiRV}</div><div class="card-sub">Meta Alvo Global: ${pctRV}</div></div>`;
        htmlPainelCompleto += `<div class="kpi-card"><div class="card-titulo">Alocação Renda Fixa</div><div class="card-valor">${kpiRF}</div><div class="card-sub">Meta Alvo Global: ${pctRF}</div></div>`;
        htmlPainelCompleto += `
            <div class="chart-box-card">
                <div style="width: 90px; height: 90px; flex-shrink: 0; display: flex; justify-content: center; align-items: center;">
                    <canvas id="chartAlocacaoDesejada"></canvas>
                </div>
                ${htmlLegendaStr}
            </div>`;
        
        cardsContainer.innerHTML = htmlPainelCompleto.trim();
        containerId10.innerHTML = htmlId10;
        containerId30.innerHTML = htmlId30;

        if (typeof Chart !== 'undefined' && valoresGrafico.length > 0) {
            const ctx = document.getElementById('chartAlocacaoDesejada').getContext('2d');
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
        cardsContainer.innerHTML = `<div style="grid-column: span 4; background: rgba(239, 68, 68, 0.15); border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; font-weight: bold; color: #ef4444; font-size:14px; font-family: sans-serif;">⚠️ FALHA DE COMPATIBILIDADE DA BASE: ${erro.message}</div>`;
        containerId10.innerHTML = `<div class="status-msg" style="color: #ef4444;">Processamento interrompido para proteção dos cálculos.</div>`;
        containerId30.innerHTML = `<div class="status-msg" style="color: #ef4444;">Aguardando correção da estrutura do arquivo CSV.</div>`;
    }
}

document.addEventListener('DOMContentLoaded', inicializarModuloBalanceamento);
