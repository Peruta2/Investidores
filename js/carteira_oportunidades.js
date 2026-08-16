// ============================================================================
// 1. ESCOPO GLOBAL E MEMÓRIA DE SIMULAÇÃO (Nunca apague ou mova estas linhas)
// ============================================================================
const memoriaSimulador = {};
const cacheOportunidades = {}; 

// LÓGICA DE ÁRVORE PADRONIZADA: Expande e retrai os blocos da tabela principal
window.alternarBloco = function(indexBloco) {
    const linhasFilhas = document.querySelectorAll(`.filhas-bloco-${indexBloco}`);
    const lineMestre = document.getElementById(`mestre-bloco-${indexBloco}`);
    if (linhasFilhas.length === 0) return;

    const primeiraLinha = linhasFilhas.item(0);
    let estaEscondido = primeiraLinha.classList.contains('row-hidden');

    linhasFilhas.forEach(linha => {
        if (estaEscondido) {
            linha.classList.remove('row-hidden');
        } else {
            linha.classList.add('row-hidden');
        }
    });

    if (lineMestre) {
        if (estaEscondido) {
            lineMestre.classList.remove('collapsed');
        } else {
            lineMestre.classList.add('collapsed');
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
// 2. CONTROLE INTERATIVO DO POPUP (SIMULADOR DE COMPRAS)
// ============================================================================
window.abrirSimulador = function(ativo) {
    const dadosDoAtivo = memoriaSimulador[ativo];
    const modal = document.getElementById('popup-simulador');
    if (!dadosDoAtivo) {
        alert(`Nenhum registro de simulador encontrado para o ativo ${ativo}.`);
        return;
    }

    document.getElementById('modal-titulo').innerText = `Simulador de Compra: ${ativo}`;
    let htmlPopup = '';
    modal.dataset.ativo = ativo;

    dadosDoAtivo.titulos.forEach((rotulo, index) => {
        let valor = dadosDoAtivo.valores[index] || '';
        let elementoValor = `<div class="simulador-val">${valor}</div>`;

        let rotuloLimpo = rotulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Torna a quantidade editável
        if (rotuloLimpo.includes('quant') || rotuloLimpo.includes('compra')) {
            let valorNumerico = parseInt(valor.replace(/\D/g, '')) || 0;
            elementoValor = `
                <input type="number" 
                       class="simulador-input-quant" 
                       id="input-simulador-quant" 
                       value="${valorNumerico}" 
                       min="0" 
                       style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px; font-weight: bold; text-align: right;"
                       oninput="window.calcularSimulacao('${ativo}')">`;
        }
        // Injeta IDs fixos para os alvos matemáticos
        else if (rotuloLimpo.includes('investimento')) {
            elementoValor = `<div class="simulador-val" id="sim-investimento" style="font-weight: bold;">${valor}</div>`;
        } 
        else if (rotuloLimpo.includes('novo (pm)')) {
            elementoValor = `<div class="simulador-val" id="sim-novopm" style="font-weight: bold;">${valor}</div>`;
        } 
        else if (rotuloLimpo.includes('variacao')) {
            elementoValor = `<div class="simulador-val" id="sim-variacao" style="font-weight: bold;">${valor}</div>`;
        } 
        else if (rotuloLimpo.includes('upside')) {
            elementoValor = `<div class="simulador-val" id="sim-upside" style="font-weight: bold;">${valor}</div>`;
        }

        htmlPopup += `
            <div class="simulador-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                <div class="simulador-label" style="font-size: 12px; color: #64748b;">${rotulo}</div>
                <div style="width: 50%; text-align: right;">${elementoValor}</div>
            </div>`;
    });

    document.getElementById('modal-conteudo').innerHTML = htmlPopup;
    modal.classList.add('active');

    // Foco automático do cursor no input de quantidade
    setTimeout(() => {
        const inputQuant = document.getElementById('input-simulador-quant');
        if (inputQuant) {
            inputQuant.focus();
            inputQuant.select(); 
        }
    }, 50);
};

window.fecharModal = function(e) {
    if (!e || e.target.id === 'popup-simulador' || e.type === 'click') {
        document.getElementById('popup-simulador').classList.remove('active');
    }
};

// MOTOR DE CÁLCULO DA SIMULAÇÃO
window.calcularSimulacao = function(ativo) {
    const dadosOp = cacheOportunidades[ativo];
    if (!dadosOp) return;

    const inputQuant = document.getElementById('input-simulador-quant');
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

    // Injeção de resultados na interface do Popup
    const campoInvestimento = document.getElementById('sim-investimento');
    const campoNovoPM       = document.getElementById('sim-novopm');
    const campoVariacao     = document.getElementById('sim-variacao');
    const campoUpside       = document.getElementById('sim-upside');

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
    const container = document.getElementById('tabela-oportunidades-container');
    try {
        const resposta = await fetch('../csv/carteira_oportunidades.csv?v=' + Math.random());
        if (!resposta.ok) throw new Error('Não foi possível ler o arquivo CSV.');

        const buffer = await resposta.arrayBuffer();
        const decodificador = new TextDecoder('windows-1252');
        const lines = decodificador.decode(buffer).split('\n');

        let htmlTabela = '<table class="db-table">';
        let idEscopoAtual = 30, idAnterior = null, contadorBlocos = 0;
        let titulosId0 = null, titulosId1Op = null, titulosId1Sim = null;
        
        let valoresLinhaAnteriorOp = Array(10).fill(''); 
        let valoresLinhaAnteriorSim = Array(7).fill('');

        lines.forEach((linha) => {
            const htmlLinhaReal = linha.trim();
            if (!htmlLinhaReal || htmlLinhaReal === '"') return;

            const listaCampos = htmlLinhaReal.split(';').map(campo => campo.trim());
            const idRow = parseInt(listaCampos[0]); // Captura explícita do ID da linha
            if (isNaN(idRow)) return;

            if (idRow === 30 || idRow === 40) {
                idEscopoAtual = idRow;
                idAnterior = null;
                if (idRow === 40) { titulosId0 = null; titulosId1Op = null; }
                return;
            }

            if (idEscopoAtual === 30) {
                let dadosOp = listaCampos.slice(1, 10);
                while (dadosOp.length < 9) dadosOp.push('');

                // Ignora linhas de metadados de cabeçalho vazias do ID 0
                if (idRow === 0 && (listaCampos[1] === undefined || listaCampos[1].trim() === '')) {
                    titulosId0 = [...dadosOp]; 
                    return; 
                }

                if (idRow === 0) {
                    contadorBlocos++;
                    idAnterior = idRow;

                    if (titulosId0 === null) {
                        titulosId0 = ["Ativos", "", "", "", "", "Variação", "Resultado Parcial", "Ativos", "Valuation"];
                    }

                    let htmlLinhaStr = `<tr id="mestre-bloco-${contadorBlocos}" class="id0-row-clickable collapsed" onclick="alternarBloco(${contadorBlocos})">`;
                    
                    dadosOp.forEach((conteudo, colIndex) => {
                        let titulo = titulosId0[colIndex] || '';
                        let prefixoIcone = colIndex === 0 ? `<span class="toggle-icon">▼</span>` : '';
                        
                        htmlLinhaStr += `<td class="linha-id0">
                            <div style="font-size: 10px; color: #94a3b8; font-weight: normal; margin-bottom: 2px;">${titulo}</div>
                            <div style="font-size: 13px; font-weight: bold; display: flex; align-items: center;">${prefixoIcone}${conteudo}</div>
                        </td>`;
                    });
                    
                    htmlLinhaStr += '<td class="linha-id0"></td></tr>';
                    htmlTabela += htmlLinhaStr;
                    
                    titulosId0 = null; 
                    return;
                }

                let classeSeparadoraID = '';
                if (idAnterior !== null && idRow !== idAnterior && (idRow === 0 || idRow === 1)) {
                    classeSeparadoraID = 'inicio-bloco-id';
                }

                idAnterior = idRow;

                let classeLinhaTr = classeSeparadoraID;
                if (idRow === 1) classeLinhaTr += ` linha-id1-row filhas-bloco-${contadorBlocos} row-hidden`;
                else if (idRow >= 2) classeLinhaTr += ` linha-dados filhas-bloco-${contadorBlocos} row-hidden`;

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

                    // EXTRAÇÃO POSICIONAL FIXA DO NOVO CSV (ID 30)
                    cacheOportunidades[ticker] = {
                        desejadoTexto: dadosOp[1] || '-', // Mapeia o Desejado planejado
                        adquirido: typeof converterParaNumero === 'function' ? converterParaNumero(dadosOp[2]) : 0,
                        precoMedio: typeof converterParaNumero === 'function' ? converterParaNumero(dadosOp[3]) : 0,
                        precoAtual: typeof converterParaNumero === 'function' ? converterParaNumero(dadosOp[6]) : 0, // Índice 6 = Preço Atual
                        precoTeto: typeof converterParaNumero === 'function' ? converterParaNumero(dadosOp[7]) : 0   // Índice 7 = Preço Teto
                    };

                    htmlLinhaStr += `<tr class="${classeLinhaTr.trim()}">`;
                    dadosOp.forEach(valor => htmlLinhaStr += `<td>${valor}</td>`);
                    htmlLinhaStr += `<td><button class="btn-menu-lateral" onclick="abrirSimulador('${ticker}')">⋮</button></td></tr>`;
                }
                htmlTabela += htmlLinhaStr;
            }
            else if (idEscopoAtual === 40) {
                let dadosSim = listaCampos.slice(1, 8);
                while (dadosSim.length < 7) dadosSim.push('');

                if (idRow === 1) {
                    titulosId1Sim = listaCampos.slice(2, 7);
                } 
                else if (idRow === 2) {
                    const ticker = dadosSim[0];
                    if (!ticker) return;

                    for (let i = 0; i < dadosSim.length; i++) {
                        if (dadosSim[i] === '' && valoresLinhaAnteriorSim[i]) dadosSim[i] = valoresLinhaAnteriorSim[i];
                    }
                    valoresLinhaAnteriorSim = [...dadosSim];

                    const dadosOpSalvos = cacheOportunidades[ticker] || { desejadoTexto: '-', adquirido: 0, precoMedio: 0, precoAtual: 0, precoTeto: 0 };
                    
                    const titulosPopup = [
                        "Desejado (Op)", 
                        "Adquirido (Op)", 
                        "Preço Atual (Op)", 
                        ...(titulosId1Sim && titulosId1Sim.length > 0 ? titulosId1Sim : ["Quant.", "Investimento", "Novo (PM)", "Variação", "Upside"])
                    ];
                    
                    const valoresPopup = [
                        dadosOpSalvos.desejadoTexto, 
                        dadosOpSalvos.adquirido.toString(), 
                        dadosOpSalvos.precoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                        ...dadosSim.slice(1) 
                    ];

                    memoriaSimulador[ticker] = {
                        titulos: titulosPopup,
                        valores: valoresPopup
                    };
                }
            }
        });

        htmlTabela += '</table>';
        container.innerHTML = htmlTabela;
    } catch (erro) {
        container.innerHTML = `<div class="status-msg" style="color: #ff6b6b;">Erro: ${erro.message}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', carregarOportunidades);
