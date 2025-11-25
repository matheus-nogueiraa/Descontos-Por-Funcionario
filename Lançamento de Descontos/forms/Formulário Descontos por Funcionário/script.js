const ATIVIDADES = {
    ZERO: '0',
    INICIO: '4',
    APROV_GERENTE: '22'
}

var beforeSendValidate = function (numState, nextState) {
    let msg = '';

    if (numState == ATIVIDADES.ZERO || numState == ATIVIDADES.INICIO) {
        msg = 'Este processo deve ser iniciado exclusivamente pela Página Pública de Lançamentos de Descontos. Feche esta tela e utilize a página oficial.';
        customMsg(msg);
        throw "<b>Erro de Validação:</b> " + msg;
    }

    if (numState == ATIVIDADES.APROV_GERENTE) {
        const rdAprovaDescGerente = $('input[name="rdAprovaDescGerente"]:checked')?.val()?.trim() || '';
        const obsAnaliseAprovadorGerente = $('#obsAnaliseAprovadorGerente')?.val()?.trim() || '';
        const recusaAssinatura = $('#recusaAssinatura').val() === 'sim';
        const test2Cpf = $('#test2_cpf')?.val()?.trim() || '';
        const test2Cargo = $('#test2_cargo')?.val()?.trim() || '';
        const test2Nome = $('#test2_nome')?.val()?.trim() || '';
        const assinaturaTestemunha2 = getPadBase64('signature-pad-test2');

        if (!rdAprovaDescGerente) {
            customMsg('Aprovar Desconto?');
            throw "Campo obrigatório: Aprovação do Gerente.";
        }

        if (rdAprovaDescGerente == 'abonar' && !obsAnaliseAprovadorGerente) {
            customMsg('Observação do Aprovador é obrigatória.');
            throw "Campo obrigatório: Observação do Aprovador.";
        }

        if (recusaAssinatura) {
            if (!test2Cpf || !test2Cargo || !test2Nome || !assinaturaTestemunha2) {
                customMsg('Todos os campos da testemunha 2 são obrigatórios.');
                throw "Campos obrigatórios da testemunha 2 não preenchidos.";
            }

            try {
                // 1️⃣ Salvar assinatura como anexo
                salvarAssinaturaComoAnexo(assinaturaTestemunha2, "assinatura-testemunha2.png");

                // 3️⃣ Buscar anexos existentes (sincronamente)
                const processId = parseInt($("#solicitacao_fluig").val(), 10);
                const anexos = obterAnexosProcesso(processId);

                // 4️⃣ Gerar e salvar o PDF v2
                processarRelatorio(anexos, "relatorio_desconto_lancado.pdf", test2Nome, test2Cpf, test2Cargo);

                // 5️⃣ Esperar o PDF anexar
                sleep(2500);

            } catch (error) {
                console.error("Erro ao salvar anexos:", error);
                customMsg("Erro ao processar anexos antes da movimentação.");
                throw "Falha no upload de arquivos.";
            }
        }
    }

    return true;
};

// 🔹 Bloqueia execução por X ms
function sleep(ms) {
    const end = Date.now() + ms;
    while (Date.now() < end) { }
}

// 🔹 Função para salvar assinatura como anexo
function salvarAssinaturaComoAnexo(base64Data, fileName) {
    const blob = base64ToBlob(base64Data, "image/png");
    const file = new File([ blob ], fileName, { type: "image/png" });

    const inputFile = top.$('#ecm-navigation-inputFile-clone');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    inputFile[ 0 ].files = dataTransfer.files;
    inputFile.trigger('change');
}

// 🔹 Conversões utilitárias
function base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64.split(",")[ 1 ]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[ i ] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([ byteArray ], { type: mimeType });
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[ i ]);
    return btoa(binary);
}

function getPadBase64(idCanvas) {
    const pad = pads[ idCanvas ];
    if (!pad || pad.isEmpty()) return null;
    return pad.toDataURL("image/png");
}

// 🔹 Consulta de anexos
function obterAnexosProcesso(processId) {
    const constraints = [ DatasetFactory.createConstraint("processId", processId, processId, ConstraintType.MUST) ];
    const dataset = DatasetFactory.getDataset("ds_process_attachments_files", null, constraints, null);
    if (!dataset || dataset.values.length === 0) throw new Error('Nenhum anexo encontrado.');
    return dataset.values;
}

// 🔹 Geração e salvamento do PDF modificado
async function processarRelatorio(dataset, nomeArquivo, nome, cpf, cargo, assinaturaBase64) {
    try {
        console.log("🔹 Iniciando geração do PDF v2 com assinatura da Testemunha 2...");

        const documento = dataset.find(doc => doc.fileName === nomeArquivo);
        if (!documento) throw new Error(`Arquivo ${nomeArquivo} não encontrado.`);

        // 🔹 Baixa o PDF original
        const response = await fetch(documento.downloadUrl, { credentials: 'include' });
        if (!response.ok) throw new Error(`Erro ao baixar PDF: ${response.statusText}`);
        const pdfBytes = await response.arrayBuffer();

        // 🔹 Carrega o PDF existente
        const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
        const { rgb, StandardFonts } = PDFLib;
        const novaPagina = pdfDoc.addPage([595, 842]);

        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // 🔹 Cabeçalho da seção
        novaPagina.drawText("Assinatura da Testemunha 2", {
            x: 50,
            y: 790,
            size: 14,
            font: fontBold,
            color: rgb(0.55, 0.15, 0.05) // marrom avermelhado igual Testemunha 1
        });

        // 🔹 Linha separadora
        novaPagina.drawLine({
            start: { x: 50, y: 775 },
            end: { x: 545, y: 775 },
            thickness: 2,
            color: rgb(0.3, 0.3, 0.3)
        });

        // 🔹 Inserir assinatura se existir
        if (assinaturaBase64) {
            const assinaturaBytes = base64ToUint8Array(assinaturaBase64.split(",")[1]);
            const assinaturaImage = await pdfDoc.embedPng(assinaturaBytes);
            const assinaturaWidth = 180;
            const assinaturaHeight = 70;
            novaPagina.drawImage(assinaturaImage, {
                x: (pageWidth - assinaturaWidth) / 2,  // Centraliza a assinatura
                y: 690,
                width: assinaturaWidth,
                height: assinaturaHeight
            });
        }

        // 🔹 Linha abaixo da assinatura
        const lineWidth = 180;  // Mesma largura da assinatura
        const lineX = (pageWidth - lineWidth) / 2;  // Centraliza a linha
        novaPagina.drawLine({
            start: { x: lineX, y: 680 },
            end: { x: lineX + lineWidth, y: 680 },
            thickness: 1,
            color: rgb(0.5, 0.5, 0.5)
        });

        // 🔹 Dados da testemunha
        const pageWidth = novaPagina.getWidth();
        const dataHora = new Date().toLocaleString("pt-BR");
        
        // Centraliza os textos
        novaPagina.drawText(`Nome: ${nome}`, { 
            x: pageWidth / 2, 
            y: 660, 
            size: 11, 
            font: fontNormal,
            color: rgb(124/255, 30/255, 9/255),
            maxWidth: pageWidth - 100,
            textAlign: 'center'
        });
        novaPagina.drawText(`CPF: ${cpf}`, { 
            x: pageWidth / 2,
            y: 640, 
            size: 11, 
            font: fontNormal,
            color: rgb(124/255, 30/255, 9/255),
            maxWidth: pageWidth - 100,
            textAlign: 'center'
        });
        novaPagina.drawText(`Cargo: ${cargo}`, { 
            x: pageWidth / 2,
            y: 620, 
            size: 11, 
            font: fontNormal,
            color: rgb(124/255, 30/255, 9/255),
            maxWidth: pageWidth - 100,
            textAlign: 'center'
        });
        novaPagina.drawText(`Data e Hora: ${dataHora}`, { 
            x: pageWidth / 2,
            y: 600, 
            size: 11, 
            font: fontNormal,
            color: rgb(124/255, 30/255, 9/255),
            maxWidth: pageWidth - 100,
            textAlign: 'center'
        });

        // 🔹 Gera o novo PDF e converte para base64
        const pdfFinal = await pdfDoc.save();
        const base64pdf = arrayBufferToBase64(pdfFinal);

        // 🔹 Salva o novo PDF como anexo
        salvarPdfComoAnexo(`data:application/pdf;base64,${base64pdf}`, "relatorio_desconto_assinado.pdf");

        console.log("✅ PDF v2 com assinatura salvo com sucesso!");

    } catch (error) {
        console.error("❌ Erro ao gerar PDF:", error);
        customMsg("Erro ao gerar PDF com assinatura da testemunha.");
    }
}

function salvarPdfComoAnexo(base64Data, fileName) {
    const blob = base64ToBlob(base64Data, "application/pdf");
    const file = new File([ blob ], fileName, { type: "application/pdf" });

    const inputFile = top.$('#ecm-navigation-inputFile-clone');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    inputFile[ 0 ].files = dataTransfer.files;
    inputFile.trigger('change');
}


// 🔹 Alerta
function customMsg(msg) {
    showSweetTimerAlert("Campo Obrigatório!<br><b>" + msg + "</b>", "warning");
}

function showSweetTimerAlert(msg, icon) {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top',
        showConfirmButton: false,
        timer: 6000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
    Toast.fire({ icon, html: msg });
}

function base64ToUint8Array(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
}