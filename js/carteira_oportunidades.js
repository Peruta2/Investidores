// Memória local para registrar quais ativos estão com o simulador expandido na tela
let linhasExpandidasSimulador = {}; 
let dadosOriginaisCSV = [];

// MOTOR DE COLAPSO REPARADO: Localiza as filhas com base no contador sequencial do bloco mestre do ID 50
window.alternarBloco = function(prefixoId, indexBloco) {
    const linhasFilhas = document.querySelectorAll(`.${prefixoId}-filhas-bloco-${indexBloco}`);
    const linhaSubmenu = document.getElementById(`${prefixoId}-submenu-bloco-${indexBloco}`);
    const lineMestre = document.getElementById(`${prefixoId}-mestre-bloco-${indexBloco}`);
    
    if (!linhasFilhas || linhasFilhas.length === 0) return;
    let estaEscondido = linhasFilhas.item(0).classList.contains('row-hidden');

    linhasFilhas.forEach(linha => {
        if (estaEscondido) {
            linha.classList.remove('row-hidden');
        } else {
            linha.classList.add('row-hidden');
            linha.classList.remove('mostrar-simulador');
        }
    });

    if (linhaSubmenu) {
        if (estaEscondido) linhaSubmenu.classList.remove('row-hidden');
        else linhaSubmenu.classList.add('row-hidden');
        linhaSubmenu.classList.remove('mostrar-simulador');
    }
    if (lineMestre) {
        if (estaEscondido) lineMestre.classList.remove('collapsed');
        else lineMestre.classList.add('collapsed');
    }
};

// INTELIGÊNCIA DE EXPANSÃO SINCRONIZADA: Expande o ID 11 apenas e estritamente no clique do botão 3 pontos
window.alternarColunasSimuladorLinha = function(e, ticker, indexBloco) {
    e.stopPropagation(); // Impede o clique de interferir nos colapsos pais da tabela
    
    // 1. Altera a classe na linha de dados do ativo clicado
    const linhasAtivo = document.querySelectorAll(`.linha-simulacao-${ticker}`);
    if (!linhasAtivo || linhasAtivo.length === 0) return;

    linhasAtivo.forEach(linha => {
        linha.classList.toggle('mostrar-simulador');
    });

    // 2. Controla o cabeçalho do ID 11: Se houver qualquer ativo simulando, expande; se todos fecharem, recolhe
    const cabecalhoId11 = document.getElementById(`op-cl-submenu-bloco-${indexBloco}`);
    if (cabecalhoId11) {
        const ativosAtivosNesseBloco = document.querySelectorAll(`.op-cl-filhas-bloco-${indexBloco}.mostrar-simulador`);
        if (ativosAtivosNesseBloco.length > 0) {
            cabecalhoId11.classList.add('mostrar-simulador');
        } else {
            cabecalhoId11.classList.remove('mostrar-simulador');
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

async function inicializarModuloOportunidades() {
    try {
        const resposta = await fetch('../csv/carteira_oportunidades.csv?v=' + Math.random());
        if (!resposta.ok) throw new Error('Falha ao ler carteira_oportunidades.csv');

        const buffer = await resposta.arrayBuffer();
        const decodificador = new TextDecoder('windows-1252');
        const textoPuro = decodificador.decode(buffer).replace(/\r/g, '');
        
        dadosOriginaisCSV = textoPuro.split('\n');
        renderizarMatrizOportunidades();

    } catch (erro) {
        document.getElementById('container-id50-tabela').innerHTML = `<div class="status-msg" style="color: #ff6b6b;">Erro: ${erro.message}</div>`;
    }
}

function renderizarMatrizOportunidades() {
    const cardsContainer = document.getElementById('kpi-cards-oportunidades-container');
    const containerId50 = document.getElementById('container-id50-tabela');

    let htmlId50 = '<table class="db-table tabela-oportunidades">';
    let id0Linha1Titulos = null;
    let id80Linha1Titulos = null;

    let idEscopoAtual = 80; 
    let blocoId50Cont = 0;
    let herancaVacanteOportunidade = "";

    // ➔ REVISADO: Declarações travadas 100% em português
    let dadosCardsSimulacao = [];
    let linhasCabecalho50 = 0; 
    let linhasCabecalho80 = 0; 

    dadosOriginaisCSV.forEach((linha) => {
        const linhaLimpa = linha.trim();
        if (!linhaLimpa || linhaLimpa === '"') return;

        const campos = linhaLimpa.split(';').map(c => c.trim());
        const idRow = parseInt(campos);
        if (isNaN(idRow)) return;

        // ➔ REVISADO: Zeragem das variáveis corrigida estritamente para o português
        if (idRow === 80 || idRow === 50) {
            idEscopoAtual = idRow;
            linhasCabecalho50 = 0;
            return;
        }

        if (idEscopoAtual === 80) {
            let dadosCorte80 = campos.slice(1, 18);
            if (idRow === 0) {
                if (linhasCabecalho80 === 0) { 
                    id80Linha1Titulos = [...dadosCorte80];
                    linhasCabecalho80++;
                    return;
                }
                dadosCardsSimulacao = [...dadosCorte80];
                linhasCabecalho80 = 0; // ➔ REVISADO: Português
            }
            return;
        }

        if (idEscopoAtual === 50) {
            let dadosCorte50 = campos.slice(1, 18); 
            while (dadosCorte50.length < 17) dadosCorte50.push('');

            if (idRow === 0) {
                if (linhasCabecalho50 === 0) { 
                    id0Linha1Titulos = [...dadosCorte50];
                    linhasCabecalho50++;
                    return;
                }
                
                blocoId50Cont++;
                let htmlStr = `<tr id="op-cl-mestre-${blocoId50Cont}" class="id0-row-clickable collapsed" onclick="alternarBloco('op-cl', ${blocoId50Cont})">`;
                
                dadosCorte50.forEach((conteudo, i) => {
                    if (i > 15) return; 
                    let titulo = id0Linha1Titulos ? id0Linha1Titulos[i] : '';
                    let icone = i === 0 ? `<span class="toggle-icon" style="color: var(--azul-claro-brilhoso); margin-right:6px;">▼</span>` : '';
                    let classeOculta = i >= 10 ? 'col-simulador' : ''; 
                    
                    if (i === 10) {
                        htmlStr += `<td class="linha-id0 coluna-acao-tres-pontos"></td>`;
                    }
                    
                    htmlStr += `<td class="linha-id0 ${classeOculta}" style="border-bottom: 1px solid rgba(197, 168, 128, 0.2); padding: 8px 10px;">
                        <div style="font-size: 10px; color: var(--cinza-claro-azulado); font-weight: normal; margin-bottom: 2px;">${titulo}</div>
                        <div style="font-size: 13px; font-weight: bold; display: flex; align-items: center; color: var(--branco);">${icone}${conteudo}</div>
                    </td>`;
                });
                
                htmlStr += `</tr>`;
                htmlId50 += htmlStr;
                linhasCabecalho50 = 0; // ➔ REVISADO: Português
                return;
            }

            if (idRow === 11) {
                let htmlStr = `<tr id="op-cl-submenu-bloco-${blocoId50Cont}" class="linha-id1-row row-hidden">`;
                dadosCorte50.forEach((campo, i) => {
                    if (i > 15) return;
                    let classeOculta = i >= 10 ? 'col-simulador' : '';
                    
                    if (i === 10) {
                        htmlStr += `<td class="coluna-acao-tres-pontos" style="font-size: 11px; padding: 12px 10px 4px 10px; border-bottom: 1px solid rgba(255,255,255,0.05);">MENU</td>`;
                    }
                    
                    // ➔ LIMPO: Removido o background forçado para o CSS dourado assumir o controle!
                    htmlStr += `<td class="${classeOculta}" style="font-size: 11px; padding: 12px 10px 4px 10px; border-bottom: 1px solid rgba(255,255,255,0.05);">${campo}</td>`;
                });
                htmlStr += `</tr>`;
                htmlId50 += htmlStr;
                return;
            }

            if (idRow >= 2 && idRow <= 5) {
                let ticker = dadosCorte50[0]; // Extrai estritamente o ticker puro (BBDC4)
                let estadoExpandido = linhasExpandidasSimulador[ticker] ? 'mostrar-simulador' : '';
                
                let htmlStr = `<tr class="linha-dados op-cl-filhas-bloco-${blocoId50Cont} linha-simulacao-${ticker} ${estadoExpandido} row-hidden">`;
                dadosCorte50.forEach((valor, idx) => {
                    if (idx > 15) return;
                    let classeOculta = idx >= 10 ? 'col-simulador' : '';
                    
                    if (idx === 10) {
                        htmlStr += `
                            <td class="coluna-acao-tres-pontos">
                                <button class="btn-tres-pontos" onclick="alternarColunasSimuladorLinha(event, '${ticker}', ${blocoId50Cont})">⋮</button>
                            </td>`;
                    }
                    
                    if (idx === 1) {
                        if (valor === '') htmlStr += `<td class="${classeOculta} campo-herdado-nulo">${herancaVacanteOportunidade}</td>`;
                        else { herancaVacanteOportunidade = valor; htmlStr += `<td class="${classeOculta}">${valor}</td>`; }
                    } else {
                        htmlStr += `<td class="${classeOculta}">${valor}</td>`;
                    }
                });
                htmlStr += `</tr>`;
                htmlId50 += htmlStr;
                return;
            }
        }
    });

    containerId50.innerHTML = htmlId50 + '</table>';

    // MONTAGEM DIRETA E INDIVIDUAL VALIDADA DOS CARDS
    let htmlCards = "";
    if (dadosCardsSimulacao.length > 0 && id80Linha1Titulos) {
        
        // Slot 1: Patrimônio Total (Coluna física 5 -> Índice 4 do corte útil)
        let t1 = id80Linha1Titulos[4] || "Patrimônio Total";
        let v1 = dadosCardsSimulacao[4] || "-";

        // Slot 2: Investimento (Coluna física 8 -> Índice 7 do corte útil)
        let t2 = id80Linha1Titulos[7] || "Investimento";
        let v2 = dadosCardsSimulacao[7] || "-";

        // Slot 3: Ganho de Capital (Coluna física 9 -> Índice 8 do corte útil)
        let t3 = id80Linha1Titulos[8] || "Ganho de Capital";
        let v3 = dadosCardsSimulacao[8] || "-";

        // Slot 4: (%) Ganho (Coluna física 10 -> Índice 9 do corte útil)
        let t4 = id80Linha1Titulos[9] || "(%) Ganho";
        let v4 = dadosCardsSimulacao[9] || "-";

        // Slot 5: Carteira Mestre (Coluna física 1 -> Índice 0 do corte útil)
        let t5 = id80Linha1Titulos[0] || "Carteira";
        let v5 = dadosCardsSimulacao[0] || "-";

        htmlCards += `<div class="kpi-card" style="border-left: 4px solid var(--azul-claro-brilhoso);"><div class="card-titulo">${t1}</div><div class="card-valor" style="color: var(--azul-claro-brilhoso); font-size:18px;">${v1}</div><div class="card-sub">Radar</div></div>`;
        htmlCards += `<div class="kpi-card" style="border-left: 4px solid #38BDF8;"><div class="card-titulo">${t2}</div><div class="card-valor" style="color: #38BDF8; font-size:18px;">${v2}</div><div class="card-sub">Radar</div></div>`;
        htmlCards += `<div class="kpi-card" style="border-left: 4px solid #E5C495;"><div class="card-titulo">${t3}</div><div class="card-valor" style="color: #E5C495; font-size:18px;">${v3}</div><div class="card-sub">Radar</div></div>`;
        htmlCards += `<div class="kpi-card" style="border-left: 4px solid #10B981;"><div class="card-titulo">${t4}</div><div class="card-valor" style="color: #10B981; font-size:18px;">${v4}</div><div class="card-sub">Radar</div></div>`;
        htmlCards += `<div class="kpi-card" style="border-left: 4px solid var(--laranja-claro-dourado);"><div class="card-titulo">${t5}</div><div class="card-valor" style="color: var(--laranja-claro-dourado); font-size:18px;">${v5}</div><div class="card-sub">Radar</div></div>`;

    } else {
        for (let idx = 1; idx <= 5; idx++) {
            htmlCards += `<div class="kpi-card"><div class="card-titulo">Card ${idx}</div><div class="card-valor">-</div><div class="card-sub">Aguardando...</div></div>`;
        }
    }
    cardsContainer.innerHTML = htmlCards;
}

document.addEventListener('DOMContentLoaded', inicializarModuloOportunidades);
