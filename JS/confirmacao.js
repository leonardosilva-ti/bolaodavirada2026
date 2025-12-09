// URLs Fictícias. Estes serão substituídos pelo URL de Implantação do seu Apps Script.
const APPS_SCRIPT_URL_CONFIRMACAO = 'https://script.google.com/macros/s/AKfycbyubHYU_2o26KHTRtH558L1eU4wXYZ5rGKi3ghwEJ9_xW95zh76lnkN3kKB5nuo0QjnJA/exec';

document.addEventListener('DOMContentLoaded', () => {
    const dadosApostaJSON = localStorage.getItem('dadosBolao');
    const formConfirmacao = document.getElementById('form-confirmacao');
    const confirmaLeituraCheckbox = document.getElementById('confirma-leitura');
    const confirmarApostaBtn = document.getElementById('confirmar-aposta-btn');
    const voltarBtn = document.getElementById('voltar-btn');
    const mensagemStatus = document.getElementById('mensagem-status');
    const copiarPixBtn = document.getElementById('copiar-pix-btn');

    let dadosAposta = null;

    // 1. Carregar e Exibir Dados
    function carregarDados() {
        if (!dadosApostaJSON) {
            alert('Nenhum dado de aposta encontrado. Voltando para a Home.');
            window.location.href = 'index.html'; // Assume que a home é index.html
            return;
        }

        try {
            dadosAposta = JSON.parse(dadosApostaJSON);

            // Exibir dados do participante
            document.getElementById('display-nome').textContent = dadosAposta.nome;
            document.getElementById('display-telefone').textContent = dadosAposta.telefone;
            document.getElementById('display-pix').textContent = dadosAposta.chavePix;

            // Exibir jogos
            const containerJogosRevisao = document.getElementById('container-jogos-revisao');
            containerJogosRevisao.innerHTML = dadosAposta.jogos.map((jogo, index) => {
                // Formata os números
                const numerosFormatados = jogo.map(n => n.toString().padStart(2, '0')).join(', ');
                return `
                    <div class="jogo-revisao-item">
                        <strong>Jogo ${index + 1}:</strong>
                        <span class="numeros-revisao">${numerosFormatados}</span>
                    </div>
                `;
            }).join('');
            
        } catch (e) {
            console.error('Erro ao analisar dados da aposta:', e);
            alert('Erro ao carregar dados. Voltando para a Home.');
            window.location.href = 'index.html';
        }
    }
    
    // Funçao para gerar protocolo (replicada do GS)
    function gerarProtocoloUnico() {
        const date = new Date();
        const pad2 = (n) => n.toString().padStart(2, '0');

        const ano = date.getFullYear();
        const mes = pad2(date.getMonth() + 1);
        const dia = pad2(date.getDate());
        const hora = pad2(date.getHours());
        const minuto = pad2(date.getMinutes());
        const segundo = pad2(date.getSeconds());
        
        const timestampPart = `${ano}${mes}${dia}${hora}${minuto}${segundo}`;

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const nums = '0123456789';
        
        const char1 = chars.charAt(Math.floor(Math.random() * chars.length));
        const char2 = chars.charAt(Math.floor(Math.random() * chars.length));
        const num1 = nums.charAt(Math.floor(Math.random() * 10));
        const num2 = nums.charAt(Math.floor(Math.random() * 10));
        const char3 = chars.charAt(Math.floor(Math.random() * chars.length));
        const num3 = nums.charAt(Math.floor(Math.random() * 10));
        
        const codePart = `${char1}${char2}${num1}${num2}${char3}${num3}`;

        return `${timestampPart}-${codePart}`; 
    }

    // 2. Eventos e Controles
    
    // Habilitar/Desabilitar botão de confirmação
    confirmaLeituraCheckbox.addEventListener('change', () => {
        confirmarApostaBtn.disabled = !confirmaLeituraCheckbox.checked;
    });

    // Botão Voltar
    voltarBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // Botão Copiar PIX
    if (copiarPixBtn) {
        copiarPixBtn.addEventListener('click', () => {
            if (dadosAposta && dadosAposta.chavePix) {
                navigator.clipboard.writeText(dadosAposta.chavePix).then(() => {
                    copiarPixBtn.textContent = 'Copiado!';
                    setTimeout(() => { copiarPixBtn.textContent = 'Copiar Chave'; }, 1500);
                });
            }
        });
    }

    // 3. Submissão do Formulário para Apps Script (USANDO POST)
    formConfirmacao.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!confirmaLeituraCheckbox.checked) {
            alert('Você deve confirmar que leu a mensagem de atenção e que os dados estão corretos.');
            return;
        }
        
        // Bloquear o botão para evitar cliques duplos
        confirmarApostaBtn.disabled = true;
        mensagemStatus.style.color = 'blue';
        mensagemStatus.textContent = 'Enviando aposta e gerando protocolo...';

        try {
            // Prepara os dados para envio
            const dadosParaEnvio = {
                action: 'confirmarAposta', // Ação que o Apps Script vai processar
                nome: dadosAposta.nome,
                telefone: dadosAposta.telefone,
                // Serializa os jogos para uma string
                jogos: JSON.stringify(dadosAposta.jogos)  
            };
            
            // ********* MUDANÇA: USANDO FormData para POST *********
            const formData = new FormData();
            for (const key in dadosParaEnvio) {
                formData.append(key, dadosParaEnvio[key]);
            }
            
            // Requisição POST para o Apps Script
            const response = await fetch(APPS_SCRIPT_URL_CONFIRMACAO, {
                method: 'POST', // Agora é POST
                body: formData, // Envia o formulário no corpo da requisição
                mode: 'cors', 
            });

            // Se o status HTTP não for 200, ainda pode indicar um problema na requisição
            if (!response.ok) {
                throw new Error(`Erro de rede: ${response.statusText}. Verifique a implantação do Apps Script.`);
            }

            // O Apps Script deve retornar um JSON válido
            const result = await response.json();
            
            if (result.status === 'SUCCESS') {
                // Sucesso! Limpar LocalStorage e redirecionar para Comprovante
                localStorage.removeItem('dadosBolao');
                localStorage.setItem('protocolo', result.protocolo); // Salva o protocolo
                
                mensagemStatus.style.color = 'green';
                mensagemStatus.textContent = `Aposta confirmada! Redirecionando para o comprovante...`;
                
                // Redireciona para a página de Comprovante
                setTimeout(() => {
                    window.location.href = `comprovante.html?protocolo=${result.protocolo}`;
                }, 1500);

            } else {
                mensagemStatus.style.color = 'red';
                mensagemStatus.textContent = `Erro ao salvar: ${result.message || 'Erro desconhecido.'}`;
                confirmarApostaBtn.disabled = false; // Re-habilita
            }

        } catch (error) {
            console.error('Erro na submissão:', error);
            mensagemStatus.style.color = 'red';
            mensagemStatus.textContent = `Falha na comunicação com o servidor. Tente novamente.`;
            confirmarApostaBtn.disabled = false; // Re-habilita
        }
    });

    // 4. Inicialização
    carregarDados();
});
