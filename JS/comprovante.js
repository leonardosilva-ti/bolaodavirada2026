// URLs Fictícias. Estes serão substituídos pelo URL de Implantação do seu Apps Script.
const APPS_SCRIPT_URL_CONSULTA = 'https://script.google.com/macros/s/AKfycbyubHYU_2o26KHTRtH558L1eU4wXYZ5rGKi3ghwEJ9_xW95zh76lnkN3kKB5nuo0QjnJA/exec'; 

document.addEventListener('DOMContentLoaded', () => {
    const displayProtocolo = document.getElementById('display-protocolo');
    const displayDataHora = document.getElementById('display-data-hora');
    const displayNome = document.getElementById('display-nome');
    const displayTelefone = document.getElementById('display-telefone');
    const displayStatus = document.getElementById('display-status');
    const dataPagoInfo = document.getElementById('data-pago-info');
    const displayDataPago = document.getElementById('display-data-pago');
    const containerJogos = document.getElementById('container-jogos-comprovante');
    const atualizarStatusBtn = document.getElementById('atualizar-status-btn');
    const mensagemStatus = document.getElementById('mensagem-status');
    const gerarPdfBtn = document.getElementById('gerar-pdf-btn');
    const copiarPixBtn = document.getElementById('copiar-pix-btn');
    
    // Chave PIX fixa
    const CHAVE_PIX = '88f77025-40bc-4364-9b64-02ad88443cc4';

    // 1. Extrair Protocolo da URL
    const urlParams = new URLSearchParams(window.location.search);
    const protocolo = urlParams.get('protocolo') || localStorage.getItem('protocolo');

    if (protocolo) {
        displayProtocolo.textContent = protocolo;
        consultarAposta(protocolo);
    } else {
        alert('Protocolo não encontrado. Redirecionando para a Home.');
        window.location.href = 'index.html';
        return;
    }

    // 2. Função de Consulta ao Apps Script
    async function consultarAposta(proto) {
        mensagemStatus.textContent = 'Consultando status...';
        atualizarStatusBtn.disabled = true;

        try {
            // Requisição GET para o novo endpoint de consulta
            const response = await fetch(`${APPS_SCRIPT_URL_CONSULTA}?action=consultarAposta&protocolo=${proto}`, {
                method: 'GET',
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`Erro de rede: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.status === 'SUCCESS' && result.data) {
                exibirDados(result.data);
                mensagemStatus.textContent = 'Status atualizado com sucesso.';
                localStorage.setItem('protocolo', proto); // Mantém o protocolo para recarregamentos
            } else if (result.status === 'NOT_FOUND') {
                mensagemStatus.textContent = 'Protocolo não encontrado.';
                alert('Aposta não encontrada na base de dados.');
            } else {
                mensagemStatus.textContent = `Erro: ${result.message || 'Erro desconhecido na consulta.'}`;
            }

        } catch (error) {
            console.error('Erro na consulta:', error);
            mensagemStatus.textContent = 'Falha na comunicação com o servidor. Tente novamente.';
        } finally {
            atualizarStatusBtn.disabled = false;
        }
    }

    // 3. Função para Exibir Dados
    function exibirDados(data) {
        // Exibir dados básicos
        displayNome.textContent = data.Nome;
        displayTelefone.textContent = data.Telefone;
        displayDataHora.textContent = data.DataCad;
        
        // Exibir Status
        displayStatus.textContent = data.Status;
        displayStatus.setAttribute('data-status', data.Status.toUpperCase().includes('PAGO') ? 'PAGO' : 'AGUARDANDO');
        
        if (data.Status.toUpperCase().includes('PAGO') && data.DataPago) {
            displayDataPago.textContent = data.DataPago;
            dataPagoInfo.style.display = 'block';
        } else {
            dataPagoInfo.style.display = 'none';
        }

        // Exibir Jogos (Jogos estão em colunas Jogo1, Jogo2, etc.)
        containerJogos.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const jogoKey = `Jogo${i}`;
            const numeros = data[jogoKey] || 'N/A';
            
            const jogoDiv = document.createElement('div');
            jogoDiv.className = 'jogo-comprovante-item';
            jogoDiv.innerHTML = `
                <strong>Jogo ${i}:</strong>
                <span class="numeros-comprovante">${numeros}</span>
            `;
            containerJogos.appendChild(jogoDiv);
        }
    }

    // 4. Event Listeners

    // Botão Atualizar Status
    atualizarStatusBtn.addEventListener('click', () => {
        consultarAposta(protocolo);
    });
    
    // Botão Copiar PIX
    copiarPixBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(CHAVE_PIX).then(() => {
            copiarPixBtn.textContent = 'Copiado!';
            setTimeout(() => { copiarPixBtn.textContent = 'Copiar Chave'; }, 1500);
        });
    });

    // 5. Gerar PDF
    gerarPdfBtn.addEventListener('click', () => {
        // Usa html2canvas para renderizar o conteúdo do comprovante
        const content = document.getElementById('comprovante-content');
        
        // Temporariamente esconde o botão de PDF e Atualizar Status antes de tirar o print
        const originalDisplay = [gerarPdfBtn.style.display, atualizarStatusBtn.style.display];
        gerarPdfBtn.style.display = 'none';
        atualizarStatusBtn.style.display = 'none';

        // O elemento 'main' deve ser ajustado para caber no PDF
        html2canvas(content, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            
            // Configurações do PDF (A4)
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 200; // Largura do A4 em mm, menos margens
            const pageHeight = 295;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            // Adiciona a primeira imagem
            pdf.addImage(imgData, 'PNG', 5, 5, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Lógica para múltiplas páginas (se o conteúdo for longo)
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`Comprovante_Bolao_${protocolo}.pdf`);
            
            // Restaura a exibição dos botões
            gerarPdfBtn.style.display = originalDisplay[0];
            atualizarStatusBtn.style.display = originalDisplay[1];
        });
    });
});
