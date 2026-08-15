// Defina a sua senha aqui
const SENHA_CORRETA = "admin123";

// Executa automaticamente assim que a página index.html carrega/atualiza
window.onload = function() {
    verificarLoginExistente();
};

function verificarSenha() {
    const senhaDigitada = document.getElementById('input-senha').value;
    const erroMsg = document.getElementById('erro');

    if (senhaDigitada === SENHA_CORRETA) {
        // CORREÇÃO: Usa sessionStorage para expirar ao fechar a aba/navegador
        sessionStorage.setItem('painel_financeiro_logado', 'true');
        
        liberarAcesso();
        
        // Carrega as páginas iniciais padrão se for o primeiro acesso
        mudarCanais('ini_esquerdo.html', 'ini_direito.html'); 
    } else {
        erroMsg.style.display = 'block';
        document.getElementById('input-senha').value = '';
    }
}

// Verifica se o usuário já colocou a senha na sessão atual (permite F5)
function verificarLoginExistente() {
    // CORREÇÃO: Busca do sessionStorage
    const estaLogado = sessionStorage.getItem('painel_financeiro_logado');
    
    if (estaLogado === 'true') {
        liberarAcesso();
        recuperarPaginasAtuais();
    }
}

// Esconde a tela de login e mostra o painel
function liberarAcesso() {
    document.getElementById('tela-senha').style.display = 'none';
    document.getElementById('conteudo-principal').style.display = 'flex';
}

// Controla os frames e salva quais páginas estão abertas no momento
function mudarCanais(urlEsquerda, urlDireita) {
    const frameEsq = document.getElementById('frame-esquerdo');
    const frameDir = document.getElementById('frame-direito');
    
    if (urlEsquerda) frameEsq.src = urlEsquerda;
    if (urlDireita) frameDir.src = urlDireita;

    // CORREÇÃO: Salva o histórico na sessão (limpa ao fechar a aba)
    sessionStorage.setItem('ultima_pagina_esquerda', urlEsquerda);
    sessionStorage.setItem('ultima_pagina_direita', urlDireita);
}

// Caso o usuário dê F5, essa função reabre exatamente onde ele estava
function recuperarPaginasAtuais() {
    // CORREÇÃO: Busca do sessionStorage
    const urlEsq = sessionStorage.getItem('ultima_pagina_esquerda') || 'vazia.html';
    const urlDir = sessionStorage.getItem('ultima_pagina_direita') || 'about:blank';
    
    document.getElementById('frame-esquerdo').src = urlEsq;
    document.getElementById('frame-direito').src = urlDir;
}

// Botão de Logout limpa a sessão atual
function efetuarLogout() {
    // CORREÇÃO: Remove do sessionStorage
    sessionStorage.removeItem('painel_financeiro_logado');
    sessionStorage.removeItem('ultima_pagina_esquerda');
    sessionStorage.removeItem('ultima_pagina_direita');
    window.location.reload(); 
}

// ... suas outras funções continuam iguais ...

// Garante que o HTML já existe na tela:
document.addEventListener('DOMContentLoaded', function() {
    const inputSenha = document.getElementById('input-senha');
    if (inputSenha) {
        inputSenha.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                verificarSenha();
            }
        });
    }
});