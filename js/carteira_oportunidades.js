// ============================================================================
// 1. ESCOPO GLOBAL E MEMÓRIA DE SIMULAÇÃO (Nunca apague ou mova estas linhas)
// ============================================================================
const memoriaSimulador = {};
const cacheOportunidades = {}; 

// Altera visualmente a aba ativa na tela
window.mudarAba = function(evento, idAba) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(idAba).classList.add('active');
    evento.currentTarget.classList.add('active');
};

// LÓGICA DE ÁRVORE EVOLUÍDA: Suporta colapsar tanto blocos ID 0 quanto submenus ID 1
window.alternarBloco = function(prefixoId, indexBloco) {
    const linhasFilhas = document.querySelectorAll(`.${prefixoId}-filhas-bloco-${indexBloco}`);
    const linhaMestre = document.getElementById(`${prefixoId}-mestre-bloco-${indexBloco}`);
    if (linhasFilhas.length === 0) return;

    let estaEscondido = linhasFilhas[0].classList.contains('row-hidden');

    linhasFilhas.forEach(linha => {
        if (estaEscondido) {
            linha.classList.remove('row-hidden');
        } else {
            linha.classList.add('row-hidden');
        }
    });

    if (linhaMestre) {
        if (estaEscondido) {
            linhaMestre.classList.remove('collapsed');
        } else {
            linhaMestre.classList.add('collapsed');
        }
    }
};

// AUXILIAR GLOBAL: Limpa moedas e porcentagens e converte para número real no JS
function converterParaNumero(texto) {
    if (!texto) return 0;
    let limpo = texto.replace('R$', '').replace('%', '').replace(/\s/g, '').trim();
    if (limpo.includes(',') && limpo.includes('.')) {
        limpo = limpo.replace(/\./g, '').replace(',', '.');
    } else if (limpo.includes(',')) {
        limpo = limpo.replace(',', '.');
    }
    return parseFloat(limpo) || 0;
}

// ============================================================================
// 2. MOTOR DE CÁLCULO DO SIMULADOR (Injetado Direto nas Linhas da Tabela)
// ============================================================================
window.calcularSimulacaoLinha = function(ativo) {
    const dadosOp = cacheOportunidades[ativo];
    if (!dadosOp) return;

    const inputQuant = document.getElementById(`input-sim-${ativo}`);
    if (!inputQuant) return;
    const novaQuantidade = parseInt(inputQuant.value) || 0;

    const formatarMoeda = (numero) => numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatarPorcentagem = (numero) => (numero * 100).toFixed(2).replace('.', ',') + '%';

    // FÓRMULA 1: Investimento = Nova Qtd * Preço Atual
    const novoInvestimento = novaQuantidade * dadosOp.precoAtual;

    // FÓRMULA 2: Novo Preço Médio (Média Ponderada Pura)
    let novoPrecoMedio = dadosOp.precoMedio; 
    const qtdTotal = dadosOp.adquirido + novaQuantidade;
    if (qtdTotal > 0) {
        novoPrecoMedio = ((dadosOp.adquirido * dadosOp.precoMedio) + (novaQuantidade * dadosOp.precoAtual)) / qtdTotal;
    }

    // FÓRMULA 3: Variação = [Preço Atual / Novo (PM)] - 1
    let novaVariacao = 0;
    if (novoPrecoMedio > 0) {
        novaVariacao = (dadosOp.precoAtual / novoPrecoMedio) - 1;
    }

    // FÓRMULA 4: Upside = [Preço teto - Novo (PM)] / Preço teto
    let novoUpside = 0;
    let temPrecoTeto = dadosOp.precoTeto > 0;
    if (temPrecoTeto) {
        novoUpside = (dadosOp.precoTeto - novoPrecoMedio) / dadosOp.precoTeto;
    }

    // Atualização dinâmica dos campos HTML da linha correspondente
    const campoInvestimento = document.getElementById(`txt-sim-investimento-${ativo}`);
    const campoNovoPM       = document.getElementById(`txt-sim-novopm-${ativo}`);
    const campoVariacao     = document.getElementById(`txt-sim-variacao-${ativo}`);
    const campoUpside       = document.getElementById(`txt-sim-upside-${ativo}`);

    if (campoInvestimento) campoInvestimento.innerText = formatarMoeda(novoInvestimento);
    if (campoNovoPM)       campoNovoPM.innerText = formatarMoeda(novoPrecoMedio);
    
    if (campoVariacao) {
        campoVariacao.innerText = formatarPorcentagem(novaVariacao);
        campoVariacao.style.color = novaVariacao >= 0 ? '#10b981' : '#ef4444';
    }
    
    if (campoUpside) {
        if (!temPrecoTeto) {
            campoUpside.innerText = "N/A";
            campoUpside.style.color = "#64748b";
        } else {
            campoUpside.innerText = formatarPorcentagem(novoUpside);
            campoUpside.style.color = novoUpside >= 0 ? '#10b981' : '#ef4444';
        }
    }
};

// ============================================================================
// 3. CARREGAMENTO E PARSER DINÂMICO DO ARQUIVO CSV
// ============================================================================
async function carregarOportunidades() {
    const containerOportunidades = document.getElementById('tabela-oportunidades-container');
    const containerSimulador = document.getElementById('tabela-simulador-container');
    
    try {
        const resposta = await fetch('../csv/carteira_oportunidades.csv?v=' + Math.random());
        if (!resposta.ok) throw new Error('Não foi possível ler o arquivo CSV.');

        const buffer = await resposta.arrayBuffer();
        const decodificador = new TextDecoder('windows-1252');
        const lines = decodificador.decode(buffer).split('\n');

        let htmlOportunidades = '<table class="db-table tabela-oportunidades">';
        let htmlSimulador = '<table class="db-table tabela-simulador">';
        
        let idEscopoAtual = 30, idAnterior = null;
        let contadorBlocosOp = 0, contadorBlocosSim = 0;
        let titulosId0 = null, titulosId1Op = null, titulosId1Sim = null;
        
        let valoresLinhaAnteriorOp = Array(10).fill(''); 
        let valoresLinhaAnteriorSim = Array(7).fill('');

        lines.forEach((linha) => {
            const htmlLinhaReal = linha.trim();
            if (!htmlLinhaReal || htmlLinhaReal === '"') return;

            const listaCampos = htmlLinhaReal.split(';').map(campo => campo.trim());
            const idRow = parseInt(listaCampos[0]); 
            if (isNaN(idRow)) return;

            if (idRow === 30 || idRow === 40) {
                idEscopoAtual = idRow;
                idAnterior = null;
                if (idRow === 40) { titulosId0 = null; titulosId1Op = null; }
                return;
            }

            // ==========================================
            // ESCOPO 30: OPORTUNIDADES
            // ==========================================
            if (idEscopoAtual === 30) {
                let dadosOp = listaCampos.slice(1, 10);
                while (dadosOp.length < 9) dadosOp.push('');

                if (idRow === 0 && (listaCampos[1] === undefined || listaCampos[1].trim() === '')) {
                    titulosId0 = [...dadosOp]; 
                    return; 
                }

                if (idRow === 0) {
                    contadorBlocosOp++;
                    idAnterior = idRow;

                    if (titulosId0 === null) {
                        titulosId0 = ["Ativos", "", "", "", "", "Variação", "Resultado Parcial", "Ativos", "Valuation"];
                    }

                    let htmlLinhaStr = `<tr id="op-mestre-bloco-${contadorBlocosOp}" class="id0-row-clickable collapsed" onclick="alternarBloco('op', ${contadorBlocosOp})">`;
                    
                    dadosOp.forEach((conteudo, colIndex) => {
                        let titulo = titulosId0[colIndex] || '';
                        let prefixoIcone = colIndex === 0 ? `<span class="toggle-icon">▼</span>` : '';
                        
                        htmlLinhaStr += `<td class="linha-id0">
                            <div style="font-size: 10px; color: #94a3b8; font-weight: normal; margin-bottom: 2px;">${titulo}</div>
                            <div style="font-size: 13px; font-weight: bold; display: flex; align-items: center;">${prefixoIcone}${conteudo}</div>
                        </td>`;
                    });
                    
                    htmlLinhaStr += '<td class="linha-id0"></td></tr>';
                    htmlOportunidades += htmlLinhaStr;
                    titulosId0 = null; 
                    return;
                }

                let classeSeparadoraID = '';
                if (idAnterior !== null && idRow !== idAnterior && (idRow === 0 || idRow === 1)) {
                    classeSeparadoraID = 'inicio-bloco-id';
                }
                idAnterior = idRow;

                let classeLinhaTr = classeSeparadoraID;
                if (idRow === 1) classeLinhaTr += ` linha-id1-row op-filhas-bloco-${contadorBlocosOp} row-hidden`;
                else if (idRow >= 2) classeLinhaTr += ` linha-dados op-filhas-bloco-${contadorBlocosOp} row-hidden`;

                let htmlLinhaStr = '';

                if (idRow === 1) {
                    titulosId1Op = [...dadosOp];
                    htmlLinhaStr += `<tr class="${classeLinhaTr.trim()}">`;
                    titulosId1Op.forEach(campo => htmlLinhaStr += `<td>${campo}</td>`);
                    htmlLinhaStr += '<td></td></tr>';
                } 
                else if (idRow === 2) {
                    const ticker = dadosOp[0];
                    if (!ticker) return;

                    for (let i = 0; i < dadosOp.length; i++) {
                        if (dadosOp[i] === '' && valoresLinhaAnteriorOp[i]) dadosOp[i] = valoresLinhaAnteriorOp[i];
                    }
                    valoresLinhaAnteriorOp = [...dadosOp];

                    cacheOportunidades[ticker] = {
                        desejadoTexto: dadosOp[1] || '-', 
                        adquirido: converterParaNumero(dadosOp[2]),
                        precoMedio: converterParaNumero(dadosOp[3]),
                        precoAtual: converterParaNumero(dadosOp[6]), 
                        precoTeto: converterParaNumero(dadosOp[7])   
                    };

                    htmlLinhaStr += `<tr class="${classeLinhaTr.trim()}">`;
                    dadosOp.forEach(valor => htmlLinhaStr += `<td>${valor}</td>`);
                    htmlLinhaStr += `<td><button class="btn-menu-lateral" onclick="window.abrirSimulador('${ticker}')">⋮</button></td></tr>`;
                }
                htmlOportunidades += htmlLinhaStr;
            }
            // ==============================================
     // ESCOPO 40: SIMULADOR (Submenu ID 1 vira Mestre Colapsável)
            //   ESCOPO 40: SIMULADOR (Com 4 Colunas Injetadas da Oportunidade)
            // ==============================================
            else if (idEscopoAtual === 40) {
                let dadosSim = listaCampos.slice(1, 7);
                while (dadosSim.length < 6) dadosSim.push('');

                // ID 1: Cabeçalho do Bloco
                if (idRow === 1) {
                    contadorBlocosSim++;
                    titulosId1Sim = listaCampos.slice(2, 7);
                    
                    htmlSimulador += `<tr id="sim-mestre-bloco-${contadorBlocosSim}" class="linha-id1-row id0-row-clickable collapsed" onclick="alternarBloco('sim', ${contadorBlocosSim})" style="cursor: pointer;">`;
                    
                    // Nome do Ativo
                    htmlSimulador += `<td style="font-weight: bold; font-size: 13px;"><span class="toggle-icon">▼</span> ${dadosSim[0]}</td>`;
                    
                    // Títulos das Novas Colunas de Referência (Injetadas)
                    htmlSimulador += `<td style="font-weight: bold; font-size: 13px; color: #94a3b8;">Desejado</td>`;
                    htmlSimulador += `<td style="font-weight: bold; font-size: 13px; color: #94a3b8;">Adquirido</td>`;
                    htmlSimulador += `<td style="font-weight: bold; font-size: 13px; color: #94a3b8;">Preço Atual</td>`;
                    htmlSimulador += `<td style="font-weight: bold; font-size: 13px; color: #94a3b8;">Preço Teto</td>`;
                    
                    // Títulos Originais do Simulador
                    htmlSimulador += `<td style="font-weight: bold; font-size: 13px;">${dadosSim[1]}</td>`;
                    htmlSimulador += `<td style="font-weight: bold; font-size: 13px;">${dadosSim[2]}</td>`;
                    htmlSimulador += `<td style="font-weight: bold; font-size: 13px;">${dadosSim[3]}</td>`;
                    htmlSimulador += `<td style="font-weight: bold; font-size: 13px;">${dadosSim[4]}</td>`;
                    htmlSimulador += `<td style="font-weight: bold; font-size: 13px;">${dadosSim[5]}</td>`;
                    
                    htmlSimulador += `</tr>`;
                } 
                // ID 2: Linha de Dados
                else if (idRow === 2) {
                    const ticker = dadosSim[0];
                    if (!ticker) return;

                    for (let i = 0; i < dadosSim.length; i++) {
                        if (dadosSim[i] === '' && valoresLinhaAnteriorSim[i]) dadosSim[i] = valoresLinhaAnteriorSim[i];
                    }
                    valoresLinhaAnteriorSim = [...dadosSim];

                    // Recupera os 4 dados estratégicos guardados da aba Oportunidades
                    const dadosOriginais = cacheOportunidades[ticker] || { desejadoTexto: '-', adquirido: 0, precoAtual: 0, precoTeto: 0 };
                    
                    const txtDesejado = dadosOriginais.desejadoTexto;
                    const txtAdquirido = dadosOriginais.adquirido > 0 ? dadosOriginais.adquirido.toString() : '0';
                    const txtPrecoAtual = dadosOriginais.precoAtual > 0 ? dadosOriginais.precoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-';
                    const txtPrecoTeto = dadosOriginais.precoTeto > 0 ? dadosOriginais.precoTeto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-';

                    htmlSimulador += `<tr class="linha-dados sim-filhas-bloco-${contadorBlocosSim} row-hidden">`;
                    
                    // Coluna 1: Nome do Ativo
                    htmlSimulador += `<td>${dadosSim[0]}</td>`;
                    
                    // Colunas Injetadas (Estilo sutil cinza/itálico de referência)
                    htmlSimulador += `<td style="color: #64748b; font-style: italic;">${txtDesejado}</td>`;
                    htmlSimulador += `<td style="color: #64748b; font-style: italic;">${txtAdquirido}</td>`;
                    htmlSimulador += `<td style="color: #64748b; font-style: italic;">${txtPrecoAtual}</td>`;
                    htmlSimulador += `<td style="color: #64748b; font-style: italic;">${txtPrecoTeto}</td>`;
                    
                    // Coluna 6: Input de Quantidade / Compra
                    htmlSimulador += `<td>
                        <input type="number" id="input-sim-${ticker}" class="simulador-input-quant" value="0" min="0" style="width:70px; text-align:right; font-weight:bold;" oninput="window.calcularSimulacaoLinha('${ticker}')">
                    </td>`;
                    
                    // Colunas Calculadas Dinamicamente
                    htmlSimulador += `<td id="txt-sim-investimento-${ticker}">${dadosSim[2]}</td>`;
                    htmlSimulador += `<td id="txt-sim-novopm-${ticker}">${dadosSim[3]}</td>`;
                    htmlSimulador += `<td id="txt-sim-variacao-${ticker}">${dadosSim[4]}</td>`;
                    htmlSimulador += `<td id="txt-sim-upside-${ticker}">${dadosSim[5]}</td>`;
                    
                    htmlSimulador += '</tr>';

                    // Manutenção do cache interno do sistema
                    const dadosOpSalvos = cacheOportunidades[ticker] || { desejadoTexto: '-', adquirido: 0, precoMedio: 0, precoAtual: 0, precoTeto: 0 };
                    const titulosPopup = ["Desejado (Op)", "Adquirido (Op)", "Preço Atual (Op)", ...(titulosId1Sim && titulosId1Sim.length > 0 ? titulosId1Sim : ["Quant.", "Investimento", "Novo (PM)", "Variação", "Upside"])];
                    const valoresPopup = [dadosOpSalvos.desejadoTexto, dadosOpSalvos.adquirido.toString(), dadosOpSalvos.precoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), ...dadosSim.slice(1)];

                    memoriaSimulador[ticker] = { titulos: titulosPopup, valores: valoresPopup };
                }
            }
        });

        htmlOportunidades += '</table>';
        htmlSimulador += '</table>';

        if(containerOportunidades) containerOportunidades.innerHTML = htmlOportunidades;
        if(containerSimulador) containerSimulador.innerHTML = htmlSimulador;
    } catch (erro) {
        if(containerOportunidades) containerOportunidades.innerHTML = `<div class="status-msg" style="color: #ff6b6b;">Erro: ${erro.message}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', carregarOportunidades);
