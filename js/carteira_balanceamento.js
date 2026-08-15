// Altera visualmente a aba ativa na tela
window.mudarAba = function(evento, idAba) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(idAba).classList.add('active');
    evento.currentTarget.classList.add('active');
};

async function carregarCarteiraPerfil() {
    const containerDesejado = document.getElementById('tabela-desejado');
    const containerRealidade = document.getElementById('tabela-realidade');
    
    try {
        // Chamada de rede com quebra de cache para o arquivo de balanceamento
        const resposta = await fetch('../csv/carteira_balanceamento.csv?v=' + Math.random());
        if (!resposta.ok) throw new Error('Não foi possível ler o arquivo carteira_balanceamento.csv.');

        const buffer = await resposta.arrayBuffer();
        const decodificador = new TextDecoder('windows-1252');
        const texto = decodificador.decode(buffer);
        const lines = texto.split('\n');

        let htmlDesejado = '<table class="db-table">';
        let htmlRealidade = '<table class="db-table">';
        
        let blocoDestino = ''; 
        let idAnterior = null;
        
        // Memória linear estável de 6 posições para a herança de dados vazios
        let valoresLinhaAnterior = Array(6).fill('');
        
        let titulosId0Temporario = null;
        let titulosId1Temporario = null;
        let contadorBlocos = 0; // <--- ADICIONE ESTA LINHA EXATAMENTE AQUI
        
        // Chave de controle interna para diferenciar a Linha 1 (Títulos) da Linha 2 (Valores) do ID 1
        let proximaLinhaEhConteudoId1 = false;

        lines.forEach((linha) => {
            const linhaLimpa = inlineString = linha.trim();
            if (linhaLimpa === '') return;

            const colunasBrutas = linhaLimpa.split(';');
            
            // Resgata o ID numérico puro da coluna 0 imediatamente
            const idRow = parseInt(colunasBrutas[0]?.trim());
            if (isNaN(idRow)) return;

            // PADRONIZAÇÃO MASTER: Altera a rota da aba e limpa as memórias ao ler os IDs 10 e 20
            if (idRow === 10) {
                blocoDestino = 'DESEJADO';
                valoresLinhaAnterior = Array(6).fill('');
                idAnterior = null;
                proximaLinhaEhConteudoId1 = false;
                return; 
            }
            if (idRow === 20) {
                blocoDestino = 'REALIDADE';
                valoresLinhaAnterior = Array(6).fill('');
                idAnterior = null;
                proximaLinhaEhConteudoId1 = false;
                return; 
            }

            // Fatia a linha mantendo rigidamente os 7 campos físicos do perfil (1 ID + 6 dados)
            const listaCampos = colunasBrutas.map(campo => campo.trim()).slice(0, 7);
            while(listaCampos.length < 7) listaCampos.push('');

            let dadosVisiveis = listaCampos.slice(1, 7);

            // Armazena temporariamente os rótulos de colunas do ID 0 e ID 1
            if (idRow === 0 && dadosVisiveis[0] === 'Carteira') {
                titulosId0Temporario = [...dadosVisiveis];
                return; 
            } 
            if (idRow === 1 && dadosVisiveis[0] === 'Ativos') {
                titulosId1Temporario = [...dadosVisiveis];
                proximaLinhaEhConteudoId1 = false; // Reinicia o indicador de linha do submenu
                return;
            }

            // Linha divisória pontilhada sutil na virada de categorias
            let classeSeparadoraID = '';
            if (idAnterior !== null && idRow !== idAnterior) {
                if (idRow === 0 || idRow === 1) {
                    classeSeparadoraID = 'inicio-bloco-id';
                }
            }
            idAnterior = idRow;

            // Carimba as classes no elemento <tr> para vincular com as chaves do CSS
            let classeLinhaTr = classeSeparadoraID;
            if (idRow === 1) {
                classeLinhaTr += ' linha-id1-row';
            } else if (idRow >= 2) {
                classeLinhaTr += ' linha-dados'; 
            }

            let htmlLinhaStr = `<tr class="${classeLinhaTr.trim()}">`;

            // 1. PROCESSAMENTO DO MENU PRINCIPAL (ID 0)
            if (idRow === 0) {
                htmlLinhaStr = `<tr id="mestre-bloco-${contadorBlocos}" class="id0-row-clickable collapsed ${classeSeparadoraID}" onclick="alternarBloco(${contadorBlocos})">`;

                if (titulosId0Temporario === null) {
                    titulosId0Temporario = ["Carteira", "Perfil de Investimento", "", "", "Patrimônio Total", ""];
                }

                dadosVisiveis.forEach((conteudo, colIndex) => {
                    let titulo = titulosId0Temporario[colIndex] || '';
                    let classeAlinhamento = colIndex === 0 ? '' : 'class="txt-centro"';
                    if (conteudo.includes('R$')) classeAlinhamento = 'class="txt-direita"';

                    // OTIMIZAÇÃO: Removido o 'color: #38bdf8;' inline para herdar o branco brilhante do seu CSS unificado
                    htmlLinhaStr += `<td class="linha-id0" ${classeAlinhamento}>
                        <div style="font-size: 10px; color: #94a3b8; font-weight: normal; margin-bottom: 2px;">${titulo}</div>
                        <div style="font-size: 13px; font-weight: bold;">${conteudo}</div>
                    </td>`;
                });
            } 
            // 2. PROCESSAMENTO DO SUBMENU (ID 1)
            else if (idRow === 1) {
                if (titulosId1Temporario === null) {
                    titulosId1Temporario = ["Ativos", "Perfil Carteira", "% carteira", "% ativos", "Patrimônio Renda Fixa", ""];
                }

                // Determina se aplica a classe de títulos (linha 1) ou de valores (linha 2)
                let classeSubmenu = proximaLinhaEhConteudoId1 ? 'submenu-valores' : 'submenu-titulos';

                dadosVisiveis.forEach((conteudo, colIndex) => {
                    let titulo = titulosId1Temporario[colIndex] || '';
                    let classeAlinhamento = colIndex === 0 ? '' : 'class="txt-centro"';
                    if (conteudo.includes('R$')) classeAlinhamento = 'class="txt-direita"';

                    let estiloRecuo = colIndex === 0 ? 'style="padding-left: 15px; border-left: 3px solid #475569;"' : '';

                    // Agora injetamos a classe correta na div para você controlar pelo CSS
                    htmlLinhaStr += `<td class="linha-id1" ${classeAlinhamento} ${estiloRecuo}>
                        <div style="font-size: 10px; color: #ffffff; font-weight: normal; margin-bottom: 2px;">${titulo}</div>
                        <div style="font-size: 13px; font-weight: bold;">${conteudo}</div>
                    </td>`;
                });
                
                proximaLinhaEhConteudoId1 = true;
            }
            // 3. PROCESSAMENTO DOS ATIVOS (ID >= 2) - HERANÇA E OPACIDADE
            else {
                let camposEramVazios = Array(6).fill(false);

                for (let i = 0; i < dadosVisiveis.length; i++) {
                    if (dadosVisiveis[i] === '') {
                        camposEramVazios[i] = true;
                        if (valoresLinhaAnterior[i] !== '') {
                            dadosVisiveis[i] = valoresLinhaAnterior[i];
                        }
                    }
                }
                valoresLinhaAnterior = [...dadosVisiveis];

                dadosVisiveis.forEach((valorCampo, colIndex) => {
                    let classeAlinhamento = 'class="txt-centro"';
                    if (colIndex === 0) classeAlinhamento = ''; 
                    if (valorCampo.includes('R$')) classeAlinhamento = 'class="txt-direita"'; 

                    let estiloSuave = colIndex === 0 ? 'style="padding-left: 28px; border-left: 3px solid #334155;' : 'style="';
                    
                    if (camposEramVazios[colIndex]) {
                        estiloSuave += ' opacity: 0.20; font-style: italic;';
                    }
                    estiloSuave += '"';

                    htmlLinhaStr += `<td class="linha-dados" ${classeAlinhamento} ${estiloSuave}>${valorCampo}</td>`;
                });
            }

            htmlLinhaStr += '</tr>';

            // Canaliza a linha consolidada para a aba correspondente
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

// Inicializa a carga usando o escutador de eventos padrão do sistema
document.addEventListener('DOMContentLoaded', carregarCarteiraPerfil);
