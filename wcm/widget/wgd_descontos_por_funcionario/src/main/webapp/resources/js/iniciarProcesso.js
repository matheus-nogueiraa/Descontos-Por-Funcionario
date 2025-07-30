const PROCESS_ID = "wf_cadastrosDescontosAtivosAoColaborador";
const CONFIRMATION_MESSAGE = "Você tem certeza que deseja iniciar o processo?";
const ERROR_MESSAGE = "Erro ao gerar solicitação de compras. Contate a equipe de TI!";
const SUCCESS_MESSAGE = "Processo iniciado com sucesso! ID do processo: ";

// Função principal para iniciar o processo
async function iniciarProcesso() {
  try {
    obterDadosUsuarioLogado();

    const mensagemErro = validarCampos();
    if (mensagemErro) {
      toastMsg("Atenção", mensagemErro, "warning");
      return;
    }

    const confirmacao = await exibirConfirmacao(CONFIRMATION_MESSAGE);
    if (!confirmacao) return;

    $("#loadingOverlay").show();

    // Processa foto, assinatura e PDF em paralelo
    const [ fotoData, assinaturaData, pdfBase64 ] = await Promise.all([
      processarFoto(),
      capturarAssinatura(),
      gerarRelatorioPDFBase64()
    ]);

    if (!fotoData || !assinaturaData) return;

    // Passe os dados já processados para montarConstraints
    const constraints = await montarConstraints({ fotoData, assinaturaData, pdfBase64 });
    const statusIntegracao = await iniciarProcessoFluig(constraints);

    tratarResultado(statusIntegracao);
  } catch (error) {
    console.error(`Erro ao tentar registrar solicitação. Erro: ${error.message}`);
    alert("Ocorreu um erro inesperado. Por favor, tente novamente.");
  } finally {
    $("#loadingOverlay").hide();
  }
}

// Validação dos campos obrigatórios
function validarCampos() {
  const erros = [];

  if (isCanvasBlank(document.getElementById('signature-pad'))) {
    erros.push("- A assinatura do funcionário é obrigatória.");
  }

  // Adicione aqui outras validações de campos obrigatórios, se necessário

  if (erros.length > 0) {
    return "Verifique os campos obrigatórios antes de continuar:\n\n" + erros.join("\n");
  }
  return null;
}

// Exibição de confirmação ao usuário
async function exibirConfirmacao(mensagem) {
  const result = await Swal.fire({
    icon: "question",
    title: "Atenção",
    text: mensagem,
    showDenyButton: true,
    confirmButtonText: "Sim",
    denyButtonText: "Não",
  });

  return result.isConfirmed;
}

// Processamento da foto do funcionário
async function processarFoto() {
  const fotoInput = document.getElementById("cameraInputPhotoEPI");
  const foto = fotoInput.files[ 0 ];

  if (!foto) {
    alert("Nenhuma foto foi selecionada.");
    return null;
  }

  const fotoBase64 = await readFileAsBase64(foto);
  return { fotoBase64, nomeFoto: foto.name };
}

// Captura da assinatura do funcionário
async function capturarAssinatura() {
  const signaturePad = document.getElementById("signature-pad");
  if (isCanvasBlank(signaturePad)) {
    alert("A assinatura está vazia!");
    return null;
  }

  // Retorna uma Promise para manter padrão com Promise.all
  return new Promise((resolve) => {
    const dataUrl = signaturePad.toDataURL("image/png");
    resolve(dataUrl);
  });
}

function parseValorFromElement(elementId) {
  const el = document.getElementById(elementId);
  if (!el || !el.innerText) return 0;
  // Remove tudo que não for número, vírgula, ponto ou sinal de menos
  let valor = el.innerText.replace(/[^\d,.-]/g, '').replace(',', '.').trim();
  if (!valor) return 0;
  const parsed = parseFloat(valor);
  return isNaN(parsed) ? 0 : parsed;
}

async function montarConstraints({ fotoData, assinaturaData, pdfBase64 }) {
  const dataSolicitacao = new Date().toLocaleDateString("pt-BR");
  const horaSolicitacao = new Date().toLocaleTimeString("pt-BR");
  const nomeSolicitante = document.getElementById("nomeUsuario").value || "";
  const matriculaSolicitante = document.getElementById("matriculaUsuario").value || "";
  const emailSolicitante = document.getElementById("emailUsuario").value || "";
  const codFilial = document.getElementById("codFilial").value || "";
  const nomeColaborador = document.getElementById("codFuncionario").value || "";
  const descricao = document.getElementById("descricao").value || "";
  const valorEpi = parseFloat((document.getElementById("valorEpi").value || "0").replace(",", "."));

  const dezPorcentoSalario = parseValorFromElement("10salarioModal");
  const valorTotalAtual = parseValorFromElement("valorTotalResumo");

  // Soma o valor do novo item ao total já lançado
  const novoValorTotal = valorTotalAtual + valorEpi;

  let novoTotalParcelas = 1;
  if (dezPorcentoSalario > 0) {
    novoTotalParcelas = Math.ceil(novoValorTotal / dezPorcentoSalario);
  }
  const constraints = [];
  constraints.push(DatasetFactory.createConstraint("formField", "dataSolicitacao", dataSolicitacao, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "horaSolicitacao", horaSolicitacao, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "nomeSolicitante", nomeSolicitante, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "matriculaSolicitante", matriculaSolicitante, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "emailSolicitante", emailSolicitante, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "codFilial", codFilial, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "nomeColaborador", nomeColaborador, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "descricao", descricao, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "valorEpi", valorEpi.toString(), ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "salarioporcento", dezPorcentoSalario.toString(), ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "totalParcelas", novoTotalParcelas.toString(), ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("comments", "Lançamento de descontos iniciado pela Widget", "Lançamento de descontos iniciado pela Widget", ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("choosedState", 10, 10, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("processId", PROCESS_ID, PROCESS_ID, ConstraintType.MUST));

  // --- Pegando a foto em base64 ---
  if (fotoData) {
    constraints.push(DatasetFactory.createConstraint("attachment", fotoData.fotoBase64, fotoData.nomeFoto, ConstraintType.MUST));
  }
  if (assinaturaData) {
    constraints.push(DatasetFactory.createConstraint("attachment", assinaturaData.split(",")[ 1 ], "assinatura.png", ConstraintType.MUST));
  }
  if (pdfBase64) {
    constraints.push(DatasetFactory.createConstraint("attachment", pdfBase64, "relatorio_desconto_lançado.pdf", ConstraintType.MUST));
  }

  return constraints;
}

// Início do processo no Fluig
async function iniciarProcessoFluig(constraints) {
  const dataset = DatasetFactory.getDataset("ds_start_process", null, constraints, null);
  return dataset?.values[ 0 ];
}

// Tratamento do resultado do processo
function tratarResultado(statusIntegracao) {
  if (!statusIntegracao || statusIntegracao.status === "ERROR") {
    showSweetTimerAlert(ERROR_MESSAGE, "warning");
    console.error(`Erro ao gerar solicitação de compras: ${statusIntegracao?.status}`);
    return;
  }

  const processId = statusIntegracao.idProcess || "desconhecido";
  fecharModaisELimparInputs();
  showSweetTimerAlert(SUCCESS_MESSAGE + processId, "success");
}

// Verifica se o canvas está vazio
function isCanvasBlank(canvas) {
  const context = canvas.getContext("2d");
  const pixelBuffer = new Uint32Array(context.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
  return !pixelBuffer.some((color) => color !== 0);
}

// Converte arquivo para Base64
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[ 1 ]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Converte base64 para Blob
function base64ToBlob(base64, mimeType) {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[ i ] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([ byteArray ], { type: mimeType });
}

// Fecha modais e limpa os inputs
function fecharModaisELimparInputs() {
  $("#modalAtivos").hide();
  $("#modalAssinatura").hide();

  // Esconde o painel de funcionário
  $("#painelFuncionario").hide();

  // Limpa as tabelas de descontos e resumo geral
  $("#tabelaDescontos").empty();
  $("#tabelaResumoGeral tbody").find("td").empty();

  $("#tblNovosAtivos tbody").empty();
  $("#cameraInputPhotoEPI").val("");
  $(".previewFotoEPI").attr("src", "");

  $("#descricao").val("");
  $("#valorEpi").val("");

  const signaturePad = document.getElementById("signature-pad");
  if (signaturePad) {
    signaturePad.getContext("2d").clearRect(0, 0, signaturePad.width, signaturePad.height);
  }
}


// Obtém os dados do usuário logado
function obterDadosUsuarioLogado() {
  if (WCMAPI.userIsLogged) {
    $.ajax({
      url: '/api/public/2.0/users/getCurrent',
      type: "GET",
    }).done(function (data) {
      const nomeUsuario = data?.content?.fullName || "";
      const emailUsuario = data?.content?.email || "";
      const matriculaUsuario = data?.content?.code || "";

      $('#nomeUsuario').val(nomeUsuario);
      $('#emailUsuario').val(emailUsuario);
      $('#matriculaUsuario').val(matriculaUsuario);
    });
  }
}

// Exemplo de função para gerar PDF com jsPDF, html2canvas e autotable
async function gerarRelatorioPDFBase64() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  const primaryColor = [ 125, 30, 10 ];
  const lineSpacing = 7;

  // Dados
  const filial = document.getElementById("codFilial")?.value || "";
  const funcionario = document.getElementById("codFuncionario")?.value || "";
  const descricaoDesconto = document.getElementById("descricao")?.value || "";
  const valorDesconto = document.getElementById("valorEpi")?.value || "";
  const valorTotal = document.getElementById("valorTotalResumo")?.innerText || "";
  const parcelasTotais = document.getElementById("parcelasTotaisResumo")?.innerText || "";
  const valorParcelaMensal = document.getElementById("valorParcelaMensalResumo")?.innerText || "";

  // Título principal
  doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(...primaryColor);
  doc.text("RELATÓRIO DE DESCONTOS", pageWidth / 2, y, { align: "center" });
  y += 10;

  // Dados do Funcionário
  doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(0, 0, 0);
  doc.text(`Filial: ${filial}`, margin, y);
  y += lineSpacing;
  doc.text(`Funcionário: ${funcionario}`, margin, y);
  y += lineSpacing + 3;

  // Seção: Desconto Cadastrado
  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...primaryColor);
  doc.text("Novo Desconto", margin, y);
  y += lineSpacing;

  doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(0, 0, 0);
  doc.text(`Descrição: ${descricaoDesconto}`, margin, y);
  y += lineSpacing;
  doc.text(`Valor: R$ ${valorDesconto}`, margin, y);
  y += lineSpacing + 3;

  // Seção: Resumo Geral
  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...primaryColor);
  doc.text("Total de todos os descontos", margin, y);
  y += lineSpacing;

  doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(0, 0, 0);
  doc.text(`Valor Total: ${valorTotal}`, margin, y);
  y += lineSpacing;
  doc.text(`Parcelas Totais: ${parcelasTotais}`, margin, y);
  y += lineSpacing;
  doc.text(`Valor da Parcela Mensal: ${valorParcelaMensal}`, margin, y);
  y += lineSpacing + 5;

  // Seção: Tabela de Descontos Detalhados
  const tabela = document.getElementById("tabelaDescontos");
  if (tabela) {
    const headers = Array.from(tabela.querySelectorAll("thead tr th")).map(th => th.textContent.trim());
    const rows = Array.from(tabela.querySelectorAll("tbody tr")).map(tr =>
      Array.from(tr.querySelectorAll("td")).map(td => td.textContent.trim())
    );

    doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...primaryColor);
    doc.text("Detalhe dos descontos ativos", margin, y);
    y += 3;

    doc.autoTable({
      head: [ headers ],
      body: rows,
      startY: y,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [ 255, 255, 255 ],
        fontSize: 10,
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 9,
        valign: 'middle',
      },
      styles: {
        overflow: 'linebreak',
        cellWidth: 'wrap',
      },
      margin: { left: margin, right: margin },
      didDrawPage: data => {
        y = data.cursor.y + 10;
      }
    });
  }

  // Foto do EPI (caso tenha)
  const preview = document.querySelector(".previewFotoEPI");
  if (preview && preview.src) {
    const canvasPhoto = await html2canvas(preview);
    const imgDataPhoto = canvasPhoto.toDataURL("image/png");
    const imgHeight = 90;
    const imgWidth = (canvasPhoto.width * imgHeight) / canvasPhoto.height;
    const xImg = (pageWidth - imgWidth) / 2;

    if (y + imgHeight + 30 > doc.internal.pageSize.getHeight()) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...primaryColor);
    doc.text("Foto do Capturada", margin, y);
    y += 5;

    doc.addImage(imgDataPhoto, "PNG", xImg, y, imgWidth, imgHeight);
    y += imgHeight + 10;
  }

  // Assinatura
  const signatureCanvas = document.getElementById("signature-pad");
  if (signatureCanvas) {
    const imgDataSignature = signatureCanvas.toDataURL("image/png");
    const imgHeight = 20;
    const imgWidth = (signatureCanvas.width * imgHeight) / signatureCanvas.height;
    const xSignature = (pageWidth - imgWidth) / 2;

    if (y + imgHeight + 30 > doc.internal.pageSize.getHeight()) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...primaryColor);
    doc.text("Assinatura", margin, y);
    y += 5;

    doc.addImage(imgDataSignature, "PNG", xSignature, y, imgWidth, imgHeight);
    const lineY = y + imgHeight + 3;
    doc.setDrawColor(180, 180, 180);
    doc.line(xSignature, lineY, xSignature + imgWidth, lineY);
    doc.setFontSize(10).setTextColor(0, 0, 0);
    doc.text(`Assinatura do Funcionário: ${funcionario}`, pageWidth / 2, lineY + 6, { align: "center" });

    y = lineY + 15;
  }

  // Rodapé com data/hora
  const now = new Date();
  doc.setFontSize(8).setTextColor(120, 120, 120);
  doc.text(`Gerado em: ${now.toLocaleDateString()} ${now.toLocaleTimeString().slice(0, 5)}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });

  // Retorno em base64
  return doc.output("datauristring").split(',')[ 1 ];
}

