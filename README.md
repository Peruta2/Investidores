# 📈 Portal Assessoria Financeira

Um painel corporativo elegante e seguro desenvolvido para empresas de assessoria financeira. O sistema utiliza uma estrutura moderna de navegação dividida em frames controlados dinamicamente via JavaScript, garantindo alta usabilidade e performance.

---

## 🚀 Funcionalidades Clave

- **🔒 Tela de Bloqueio Integrada:** Proteção de acesso direto na página inicial com foco automático no cursor.
- **⏱️ Gerenciamento de Sessão Seguro:** Utiliza `sessionStorage` para reter o login ao atualizar a página ($F5$), mas exige a senha novamente caso a aba do navegador seja fechada.
- **🎛️ Controle Unificado de Frames:** Menu horizontal superior capaz de atualizar o conteúdo de dois frames verticais (esquerdo e direito) de forma simultânea.
- **🔗 Navegação Dinâmica:** Menu lateral esquerdo configurado para injetar conteúdos e relatórios diretamente no frame principal à direita.
- **🚪 Encerramento de Sessão:** Botão "Sair" dedicado que limpa os dados de navegação e redireciona para o login.

---

## 🎨 Identidade Visual

O design foi projetado sob medida para o setor financeiro e de investimentos, transmitindo sobriedade e sofisticação através das cores:
- **Azul Marinho Profundo (`#0A192F`):** Cor predominante que evoca segurança e estabilidade.
- **Dourado Fosco (`#C5A880`):** Detalhes e destaques visuais que remetem à prosperidade e alta performance.
- **Cinza Claro e Branco:** Para superfícies de leitura limpas e focadas nos dados.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5:** Estruturação semântica e containers de visualização (`iframes`).
- **CSS3:** Estilização responsiva, variáveis nativas (`:root`) e efeitos visuais modernos.
- **JavaScript (Vanilla):** Lógica de validação de senha, manipulação da API de armazenamento do navegador (`Web Storage API`) e controle dos frames.

---

## 💾 Como Executar o Projeto

Como o projeto foi desenvolvido puramente em tecnologias *Front-End*, não é necessário instalar dependências.

1. Faça o clone do repositório ou baixe os arquivos.
2. Certifique-se de ter os seguintes arquivos na mesma pasta:
   - `index.html` (Arquivo principal)
   - `vazia.html` / `menu.html` (Arquivos carregados nos frames)
3. Abra o arquivo `index.html` em qualquer navegador moderno.
4. Digite a senha padrão: **`admin123`** e pressione `Enter`.

---

## 🔒 Nota de Segurança

> **Aviso:** A versão atual deste repositório valida a senha diretamente no código do cliente (*hardcoded*) e utiliza `sessionStorage` apenas para fins de simulação de sessão e prototipagem visual. Para uso em ambiente de produção real, recomenda-se a migração para validação em um servidor (*backend*) protegido e o uso de variáveis de ambiente.
