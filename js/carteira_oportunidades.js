const memoriaSimulador = {};

// LÓGICA DE ÁRVORE PADRONIZADA: Idêntica ao motor da tela de gestão
window.alternarBloco = function(indexBloco) {
    const linhasFilhas = document.querySelectorAll(`.filhas-bloco-${indexBloco}`);
    const linhaMestre = document.getElementById(`mestre-bloco-${indexBloco}`);
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

    if (linhaMestre) {
        if (estaEscondido) {
            linhaMestre.classList.remove('collapsed');
        } else {
            linhaMestre.classList.add('collapsed');
        }
    }
};

window.abrirSimulador = function(ativo) {
    const dadosDoAtivo = memoriaSimulador[ativo];
    const modal = document.getElementById('popup-simulador');
    if (!dadosDoAtivo) {
        alert(`Nenhum registro de simulador encontrado para o ativo ${ativo}.`);
        return;
    }

    document.getElementById('modal-titulo').innerText = `Simulador de Compra: ${ativo}`;
    let htmlPopup = '';
    dadosDoAtivo.valores.forEach((valor, index) => {
        let rotulo = dadosDoAtivo.titulos[index] || `Indicador ${index + 1}`;
        htmlPopup += `
            <div class="simulador-item">
                <div class="simulador-label">${rotulo}</div>
                <div class="simulador-val">${valor}</div>
            </div>`;
    });
    document.getElementById('modal-conteudo').innerHTML = htmlPopup;
    modal.classList.add('active');
};

window.fecharModal = function(e) {
    if (!e || e.target.id === 'popup-simulador' || e.type === 'click') {
        document.getElementById('popup-simulador').classList.remove('active');
    }
};

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
        let valoresLinhaAnteriorOp = Array(9).fill('');
        let valoresLinhaAnteriorSim = Array(6).fill('');

        lines.forEach((linha) => {
            const htmlLinhaLimpa = linha.trim();
            if (htmlLinhaLimpa === '') return;

            const listaCampos = htmlLinhaLimpa.split(';').map(campo => campo.trim());
            const idRow = parseInt(listaCampos[0]);
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

                let classeSeparadoraID = '';
                if (idAnterior !== null && idRow !== idAnterior && (idRow === 0 || idRow === 1)) {
                    classeSeparadoraID = 'inicio-bloco-id';
                }

                if (idRow === 0 && dadosOp[0] && dadosOp[0].toUpperCase().includes('ANÁLISE')) {
                    titulosId0 = [...dadosOp];
                    return;
                } else if (idRow === 0) {
                    contadorBlocos++;
                }

                idAnterior = idRow;

                let classeLinhaTr = classeSeparadoraID;
                if (idRow === 1) classeLinhaTr += ` linha-id1-row filhas-bloco-${contadorBlocos} row-hidden`;
                else if (idRow >= 2) classeLinhaTr += ` linha-dados filhas-bloco-${contadorBlocos} row-hidden`;

                let htmlLinhaStr = '';

                if (idRow === 0) {
                    if (titulosId0 === null) titulosId0 = ["Ativos", "", "Situação Atual", "", "", "", "", "Valuation", ""];
                    htmlLinhaStr += `<tr id="mestre-bloco-${contadorBlocos}" class="id0-row-clickable collapsed ${classeSeparadoraID}" onclick="alternarBloco(${contadorBlocos})">`;
                    dadosOp.forEach((conteudo, colIndex) => {
                        let titulo = titulosId0[colIndex] || '';
                        let prefixoIcone = colIndex === 0 ? `<span class="toggle-icon">▼</span>` : '';
                        htmlLinhaStr += `<td class="linha-id0">
                            <div style="font-size: 10px; color: #94a3b8; font-weight: normal; margin-bottom: 2px;">${titulo}</div>
                            <div style="font-size: 13px; font-weight: bold; display: flex; align-items: center;">${prefixoIcone}${conteudo}</div>
                        </td>`;
                    });
                    htmlLinhaStr += '<td class="linha-id0"></td></tr>';
                    titulosId0 = null;
                } 
                else if (idRow === 1) {
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

                    htmlLinhaStr += `<tr class="${classeLinhaTr.trim()}">`;
                    dadosOp.forEach(valor => htmlLinhaStr += `<td>${valor}</td>`);
                    htmlLinhaStr += `<td><button class="btn-menu-lateral" onclick="abrirSimulador('${ticker}')">⋮</button></td></tr>`;
                }
                htmlTabela += htmlLinhaStr;
            }
            else if (idEscopoAtual === 40) {
                let dadosSim = listaCampos.slice(1, 7);
                while (dadosSim.length < 6) dadosSim.push('');

                if (idRow === 1) {
                    titulosId1Sim = [...dadosSim];
                } 
                else if (idRow === 2) {
                    const ticker = dadosSim[0];
                    if (!ticker) return;

                    for (let i = 0; i < dadosSim.length; i++) {
                        if (dadosSim[i] === '' && valoresLinhaAnteriorSim[i]) dadosSim[i] = valoresLinhaAnteriorSim[i];
                    }
                    valoresLinhaAnteriorSim = [...dadosSim];

                    memoriaSimulador[ticker] = {
                        titulos: titulosId1Sim ? titulosId1Sim.slice(1) : ["Ordem", "Investimento", "Preço Médio", "Variação", "Upside"],
                        valores: dadosSim.slice(1)
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

// Inicializa o carregamento da tabela assim que a página abre
document.addEventListener('DOMContentLoaded', carregarOportunidades);
