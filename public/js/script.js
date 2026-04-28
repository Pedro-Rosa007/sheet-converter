// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

const API_BASE_URL = 'http://127.0.0.1:8001';
const FORM_ID = 'formMigracao';
const STATUS_MESSAGE_ID = 'statusMessage';
const SUBMIT_BTN_ID = 'submitBtn';
const BTN_TEXT_ID = 'btnText';
const BTN_LOADER_ID = 'btnLoader';

// ============================================================================
// ELEMENTOS DOM
// ============================================================================

const form = document.getElementById(FORM_ID);
const statusMessageDiv = document.getElementById(STATUS_MESSAGE_ID);
const submitBtn = document.getElementById(SUBMIT_BTN_ID);
const btnText = document.getElementById(BTN_TEXT_ID);
const btnLoader = document.getElementById(BTN_LOADER_ID);

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Obtém todos os valores do formulário
 */
function getFormData() {
    return {
        id_cliente: document.getElementById("id_cliente").value || null,
        codigo_cliente: document.getElementById("codigo_cliente").value || null,
        nome_cliente: document.getElementById("nome_cliente").value || null,
        descricao_cliente: document.getElementById("descricao_cliente").value || null,
        preco_cliente: document.getElementById("preco_cliente").value || null,
        grupo_cliente: document.getElementById("grupo_cliente").value || null,
        subgrupo_cliente: document.getElementById("subgrupo_cliente").value || null,
        impressao_cliente: document.getElementById("impressao_cliente").value || null,
        ncm_cliente: document.getElementById("ncm_cliente").value || null,
        cest_cliente: document.getElementById("cest_cliente").value || null,
        uncompra_cliente: document.getElementById("uncompra_cliente").value || null,
        unvendas_cliente: document.getElementById("unvendas_cliente").value || null,
        pesavel_cliente: document.getElementById("pesavel_cliente").value || null,
        fracionado_cliente: document.getElementById("fracionado_cliente").value || null,
        exportarbalanca_cliente: document.getElementById("exportarbalanca_cliente").value || null,
        classificacao_cliente: document.getElementById("classificacao_cliente").value || null,
        nome_planilha: document.getElementById("planilha_cliente").value || null
    };
}

/**
 * Valida os campos obrigatórios
 */
function validateForm(data) {
    const errors = [];

    if (!data.nome_cliente || data.nome_cliente.trim() === "") {
        errors.push("Campo 'Nome' é obrigatório");
    }

    if (!data.preco_cliente || data.preco_cliente.trim() === "") {
        errors.push("Campo 'Preço' é obrigatório");
    }

    if (!data.nome_planilha || data.nome_planilha.trim() === "") {
        errors.push("Campo 'Nome da Planilha' é obrigatório");
    }

    return errors;
}

/**
 * Exibe mensagem de status
 */
function showMessage(type, title, message, details = null) {
    const messageHtml = `
        <h4>${title}</h4>
        <p>${message}</p>
        ${details ? `<ul>${details.map(d => `<li>${d}</li>`).join('')}</ul>` : ''}
    `;

    statusMessageDiv.innerHTML = messageHtml;
    statusMessageDiv.className = `status-message ${type}`;
    statusMessageDiv.style.display = 'block';

    // Scroll para a mensagem
    statusMessageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Auto-hide em 5 segundos se for sucesso
    if (type === 'success') {
        setTimeout(() => {
            statusMessageDiv.style.display = 'none';
        }, 5000);
    }
}

/**
 * Esconde mensagem de status
 */
function hideMessage() {
    statusMessageDiv.style.display = 'none';
}

/**
 * Define estado de carregamento do botão
 */
function setLoadingState(isLoading) {
    submitBtn.disabled = isLoading;
    if (isLoading) {
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
    } else {
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

/**
 * Formata bytes para tamanho legível
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// ============================================================================
// REQUISIÇÕES À API
// ============================================================================

/**
 * Envia mapeamentos para a API
 */
async function sendMappings(mappings) {
    try {
        const response = await fetch(`${API_BASE_URL}/catchcollumns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(mappings)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Erro ao enviar mapeamentos:', error);
        throw error;
    }
}

/**
 * Executa a migração de dados
 */
async function executeMigration(planilhaName) {
    try {
        const response = await fetch(`${API_BASE_URL}/datamigration`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                nome_planilha: planilhaName
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Erro ao executar migração:', error);
        throw error;
    }
}

// ============================================================================
// MANIPULADORES DE EVENTOS
// ============================================================================

/**
 * Manipulador do submit do formulário
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    hideMessage();

    // Obter dados
    const formData = getFormData();

    // Validar
    const validationErrors = validateForm(formData);
    if (validationErrors.length > 0) {
        showMessage(
            'error',
            '❌ Formulário Inválido',
            'Corrija os seguintes erros:',
            validationErrors
        );
        return;
    }

    setLoadingState(true);

    try {
        // Passo 1: Enviar mapeamentos
        console.log('📤 Enviando mapeamentos...');
        const mappingResponse = await sendMappings(formData);

        if (mappingResponse.status !== 'success') {
            throw new Error(mappingResponse.message || 'Erro ao definir mapeamentos');
        }

        console.log('✅ Mapeamentos definidos com sucesso');

        // Passo 2: Executar migração
        console.log('🔄 Executando migração...');
        const migrationResponse = await executeMigration(formData.nome_planilha);

        if (migrationResponse.status !== 'success') {
            throw new Error(migrationResponse.message || 'Erro durante a migração');
        }

        console.log('✅ Migração concluída com sucesso', migrationResponse);

        // Exibir sucesso
        const details = [
            `📍 Arquivo de saída: ${migrationResponse.arquivo_saida}`,
            `📊 Linhas processadas: ${migrationResponse.linhas_processadas}`,
            `🗂️ Colunas mapeadas: ${migrationResponse.colunas_mapeadas.length}`
        ];

        if (migrationResponse.colunas_mapeadas && migrationResponse.colunas_mapeadas.length > 0) {
            details.push('Mapeamentos:');
            migrationResponse.colunas_mapeadas.forEach(col => {
                details.push(`  → ${col}`);
            });
        }

        showMessage(
            'success',
            '✅ Migração Concluída!',
            'Os dados foram migrados com sucesso para a planilha base.',
            details
        );

        // Limpar formulário
        form.reset();

    } catch (error) {
        console.error('Erro:', error);
        showMessage(
            'error',
            '❌ Erro na Migração',
            error.message || 'Ocorreu um erro inesperado. Verifique o console para mais detalhes.',
            [
                'Verifique se o arquivo existe na pasta planilhas/',
                'Confirme se os nomes das colunas estão corretos',
                'Verifique a conexão com a API'
            ]
        );
    } finally {
        setLoadingState(false);
    }
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sheets Converter - Frontend Carregado');

    // Adicionar event listener no formulário
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    } else {
        console.error('Formulário não encontrado!');
    }

    // Verificar conexão com API
    fetch(`${API_BASE_URL}/health`)
        .then(response => {
            if (response.ok) {
                console.log('✅ API conectada e funcionando');
            }
        })
        .catch(error => {
            console.warn('⚠️ API não está acessível:', error);
            showMessage(
                'warning',
                '⚠️ Aviso',
                'A API não está acessível em http://127.0.0.1:8001',
                [
                    'Verifique se o servidor FastAPI está rodando',
                    'Execute: python api/main.py',
                    'Aguarde a inicialização...'
                ]
            );
        });
});

// ============================================================================
// FUNCIONALIDADES ADICIONAIS
// ============================================================================

// Remover mensagem ao começar a digitar
document.addEventListener('input', function(event) {
    if (event.target.closest('form') && statusMessageDiv.style.display === 'block') {
        const messageClass = statusMessageDiv.className;
        if (messageClass.includes('error') || messageClass.includes('warning')) {
            // Manter visível para erros e avisos
            return;
        }
        // Esconder mensagens de sucesso ao digitar
        if (messageClass.includes('success')) {
            hideMessage();
        }
    }
});

// Permitir Enter para submit (já é comportamento padrão, mas melhoramos o UX)
document.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && event.target.closest('form')) {
        if (event.target.tagName !== 'BUTTON') {
            event.preventDefault();
            submitBtn.click();
        }
    }
});