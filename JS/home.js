document.addEventListener('DOMContentLoaded', () => {
    const containerJogos = document.getElementById('container-jogos');
    const contadorNumeros = document.getElementById('contador-numeros');
    const finalizarApostaBtn = document.getElementById('finalizar-aposta-btn');
    const limparSelecaoBtn = document.getElementById('limpar-selecao-btn');
    const copiarPixBtn = document.getElementById('copiar-pix-btn');
    const chavePixDisplay = document.getElementById('chave-pix-display');
    const maxNumeros = 30; // 5 jogos * 6 números

    let numerosSelecionados = new Set();
    const CHAVE_PIX_SIMULADA = "11.222.333/0001-44"; // Chave PIX simulada (pode ser CPF/CNPJ ou aleatória)

    // 1. Geração dos Números (1 a 60)
    for (let i = 1; i <= 60; i++) {
        const numeroBtn = document.createElement('div');
        numeroBtn.className = 'numero-btn';
        numeroBtn.textContent = i.toString().padStart(2, '0'); // Formata para '01', '02', etc.
        numeroBtn.dataset.numero = i;
        
        numeroBtn.addEventListener('click', () => toggleNumero(numeroBtn, i));
        containerJogos.appendChild(numeroBtn);
    }

    // 2. Lógica de Seleção
    function toggleNumero(btn, numero) {
        if (numerosSelecionados.has(numero)) {
            // Desselecionar
            numerosSelecionados.delete(numero);
            btn.classList.remove('selecionado');
        } else if (numerosSelecionados.size < maxNumeros) {
            // Selecionar
            numerosSelecionados.add(numero);
            btn.classList.add('selecionado');
        } else {
            alert(`Você só pode selecionar no máximo ${maxNumeros} números (5 jogos de 6 números).`);
        }
        
        atualizarContador();
        verificarBotaoFinalizar();
    }

    // 3. Atualização do Contador
    function atualizarContador() {
        contadorNumeros.textContent = `${numerosSelecionados.size}/${maxNumeros}`;
    }

    // 4. Verificação do Botão de Finalizar
    function verificarBotaoFinalizar() {
        // Habilita o botão APENAS se 30 números estiverem selecionados.
        finalizarApostaBtn.disabled = numerosSelecionados.size !== maxNumeros;
    }

    // 5. Botão Limpar Seleção
    limparSelecaoBtn.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja limpar todos os números selecionados?')) {
            // Limpa o Set
            numerosSelecionados.clear();
            // Remove a classe 'selecionado' de todos os botões
            document.querySelectorAll('.numero-btn').forEach(btn => {
                btn.classList.remove('selecionado');
            });
            atualizarContador();
            verificarBotaoFinalizar();
        }
    });

    // 6. Configuração da Chave PIX
    chavePixDisplay.textContent = CHAVE_PIX_SIMULADA;
    
    // 7. Botão Copiar PIX
    copiarPixBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(CHAVE_PIX_SIMULADA).then(() => {
            copiarPixBtn.textContent = 'Copiado!';
            setTimeout(() => {
                copiarPixBtn.textContent = 'Copiar Chave';
            }, 1500);
        }).catch(err => {
            console.error('Erro ao copiar PIX:', err);
            alert('Erro ao copiar a chave PIX. Tente copiar manualmente: ' + CHAVE_PIX_SIMULADA);
        });
    });

    // 8. Botão Finalizar Aposta (Armazenamento temporário e Redirecionamento)
    finalizarApostaBtn.addEventListener('click', (e) => {
        const nome = document.getElementById('nome').value;
        const telefone = document.getElementById('telefone').value;

        if (!nome || !telefone) {
            alert('Por favor, preencha seu Nome e Telefone antes de avançar.');
            return;
        }

        // Converte o Set de números para um Array ordenado e formatado
        const jogosSelecionadosArray = Array.from(numerosSelecionados).sort((a, b) => a - b);

        // Estrutura os 5 jogos de 6 números (simplesmente agrupando em blocos de 6)
        const jogosFormatados = [];
        for (let i = 0; i < jogosSelecionadosArray.length; i += 6) {
            jogosFormatados.push(jogosSelecionadosArray.slice(i, i + 6));
        }
        
        // Dados a serem passados para a página de confirmação
        const dadosAposta = {
            nome: nome,
            telefone: telefone,
            chavePix: CHAVE_PIX_SIMULADA,
            jogos: jogosFormatados
        };

        // Salva os dados no LocalStorage para serem acessados na página de Confirmação
        localStorage.setItem('dadosBolao', JSON.stringify(dadosAposta));

        // Redireciona para a página de Confirmação
        window.location.href = 'confirmacao.html';
    });
    
    // Inicialização
    atualizarContador();
});
