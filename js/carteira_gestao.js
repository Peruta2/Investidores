// Altera visualmente a aba ativa na tela
window.mudarAba = function(evento, idAba) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(idAba).classList.add('active');
    evento.currentTarget.classList.add('active');
};

// Abre e fecha as linhas filhas (ID 1 e ID 2) do bloco correspondente
window.alternarBloco = function(indexBloco) {
    const linhasFilhas = document.querySelectorAll(`.grupo-bloco-${indexBloco}`);
    const linhaMestre = document.getElementById(`mestre-bloco-${indexBloco}`);
    
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

async function carregarCarteiraGestao() {
    const containerDesejado = document.getElementById('tabela-desejado');
    const containerRealidade = document.getElementById('tabela-realidade');
    
    try {
        const resposta = await fetch('../csv/carteira_gestao_ativos.csv?v=' + Math.random());
        if (!resposta.ok) throw new Error('Não foi possível ler o arquivo CSV.');

        const buffer = await resposta.arrayBuffer();
        const decodificador = new TextDecoder('windows-1252');
        const texto = decodificador.decode(buffer);
        const lines = texto.split('\n');

        let htmlDesejado = '<table class="db-table gabarito-desejado">';
        let htmlRealidade = '<table class="db-table gabarito-realidade">';
        
        let blocoDestino = ''; 
        let idAnterior = null;
        let valoresLinhaAnterior = Array(7).fill('');
        let titulosId0Temporario = null;
        let contadorBlocos = 0;

        lines.forEach((linha) => {
            const linhaLimpa = linha.trim();
            if (linhaLimpa === '') return;

            const colunasBrutas = linhaLimpa.split(';');
            
            const idRow = parseInt(colunasBrutas[0].trim());
            if (isNaN(idRow)) return;

            if (idRow === 10) {
                blocoDestino = 'DESEJADO';
                valoresLinhaAnterior = Array(7).fill('');
                idAnterior = null;
                return; 
            }
            if (idRow === 20) {
                blocoDestino = 'REALIDADE';
                valoresLinhaAnterior = Array(7).fill('');
                idAnterior = null;
                return; 
            }

            const maxCamposFisicos = blocoDestino === 'DESEJADO' ? 6 : 8;
            const maxCamposVisiveis = blocoDestino === 'DESEJADO' ? 5 : 7;

            let listaCampos = colunasBrutas.map(campo => campo.trim()).slice(0, maxCamposFisicos);
            while(listaCampos.length < maxCamposFisicos) listaCampos.push('');

            let dadosVisiveis = listaCampos.slice(1, maxCamposFisicos);

            if (idRow === 0 && dadosVisiveis[0] === '') {
                titulosId0Temporario = [...dadosVisiveis];
                contadorBlocos++; 
                return; 
            }

            let classeSeparadoraID = '';
            if (idAnterior !== null && idRow !== idAnterior) {
                if (idRow === 0 || idRow === 1) {
                    classeSeparadoraID = 'inicio-bloco-id';
                }
            }
            idAnterior = idRow;

            let classeLinhaTr = classeSeparadoraID;
            if (idRow === 1) {
                classeLinhaTr += ` linha-id1-row grupo-bloco-${contadorBlocos} row-hidden`;
            } else if (idRow >= 2) {
                classeLinhaTr += ` linha-dados grupo-bloco-${contadorBlocos} row-hidden`; 
            }

            let htmlLinhaStr = '';

            if (idRow === 0) {
                htmlLinhaStr = `<tr id="mestre-bloco-${contadorBlocos}" class="id0-row-clickable collapsed ${classeSeparadoraID}" onclick="alternarBloco(${contadorBlocos})">`;
                
                if (titulosId0Temporario === null) {
                    titulosId0Temporario = blocoDestino === 'DESEJADO' ? ["", "", "", "Ativos", "Valor Total"] : ["", "", "", "Variação", "Ativos", "% na carteira", "Valor Total"];
                }

                dadosVisiveis.forEach((conteudo, colIndex) => {
                    let titulo = titulosId0Temporario[colIndex] || '';
                    let prefixoIcone = colIndex === 0 ? '<span class="toggle-icon">▼</span>' : '';

                    // Mantém a estrutura de divs para herdar o branco brilhoso do style.css
                    htmlLinhaStr += `<td class="linha-id0">
                        <div style="font-size: 10px; color: #94a3b8; font-weight: normal; margin-bottom: 2px;">${titulo}</div>
                        <div style="font-size: 13px; font-weight: bold; display: flex; align-items: center;">${prefixoIcone}${conteudo}</div>
                    </td>`;
                });
                htmlLinhaStr += '</tr>';
                titulosId0Temporario = null;
            } 
            else if (idRow === 1) {
                htmlLinhaStr += `<tr class="${classeLinhaTr.trim()}">`;
                dadosVisiveis.forEach((campo, colIndex) => {
                    let estiloRecuo = colIndex === 0 ? 'style="padding-left: 15px; border-left: 3px solid #475569;"' : '';
                    htmlLinhaStr += `<td ${estiloRecuo}>${campo}</td>`;
                });
                htmlLinhaStr += '</tr>';
            } 
            else {
                let camposEramVazios = Array(maxCamposVisiveis).fill(false);

                for (let i = 0; i < dadosVisiveis.length; i++) {
                    if (dadosVisiveis[i] === '') {
                        camposEramVazios[i] = true;
                        if (valoresLinhaAnterior[i] !== '') {
                            dadosVisiveis[i] = valoresLinhaAnterior[i];
                        }
                    }
                }
                valoresLinhaAnterior = [...dadosVisiveis];

                htmlLinhaStr += `<tr class="${classeLinhaTr.trim()}">`;
                dadosVisiveis.forEach((valorCampo, colIndex) => {
                    let estiloSuave = colIndex === 0 ? 'style="padding-left: 28px; border-left: 3px solid #334155;' : 'style="';
                    
                    if (camposEramVazios[colIndex]) {
                        estiloSuave += ' opacity: 0.20; font-style: italic;';
                    }
                    estiloSuave += '"';

                    htmlLinhaStr += `<td ${estiloSuave}>${valorCampo}</td>`;
                });
                htmlLinhaStr += '</tr>';
            }

            if (blocoDestino === 'DESEJADO') htmlDesejado += htmlLinhaStr;
            else if (blocoDestino === 'REALIDADE') htmlRealidade += htmlLinhaStr;
        });

        htmlDesejado += '</table>';
        htmlRealidade += '</table>';

        containerDesejado.innerHTML = htmlDesejado;
        containerRealidade.innerHTML = htmlRealidade;

    } catch (erro) {
        const painelErro = `<div class="status-msg" style="color: #f87171;">Erro de carga: ${erro.message}</div>`;
        containerDesejado.innerHTML = painelErro;
        containerRealidade.innerHTML = painelErro;
    }
}

document.addEventListener('DOMContentLoaded', carregarCarteiraGestao);
