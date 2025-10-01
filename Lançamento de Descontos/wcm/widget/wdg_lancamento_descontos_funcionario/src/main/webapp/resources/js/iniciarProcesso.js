const PROCESS_ID = "wf_lancamento_descontos_funcionario";
const CONFIRMATION_MESSAGE = "Você tem certeza que deseja iniciar o processo?";
const ERROR_MESSAGE = "Erro ao gerar solicitação de compras. Contate a equipe de TI!";
const SUCCESS_MESSAGE = "Processo iniciado com sucesso! ID do processo: ";

function dataUrlToParts(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return { b64: null, ext: 'bin' };
  const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!m) return { b64: null, ext: 'bin' };
  const mime = m[1] || 'application/octet-stream';
  const b64 = m[2] || '';
  let ext = 'bin';
  if (mime.includes('png')) ext = 'png';
  else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
  else if (mime.includes('pdf')) ext = 'pdf';
  else if (mime.includes('gif')) ext = 'gif';
  else if (mime.includes('webp')) ext = 'webp';
  else if (mime.includes('svg')) ext = 'svg';
  return { b64, ext, mime };
}

function truncateJsonString(str, max = 3800) {
  if (!str) return str;
  if (str.length <= max) return str;
  const msg = `__TRUNCATED__ len=${str.length}`;
  return JSON.stringify({ truncated: true, note: msg }).slice(0, max);
}

// Lê as parcelas renderizadas na tabela (#revisaoParcelas)
function lerParcelasDoDOM(rootSel = '#revisaoParcelas') {
  const root = document.querySelector(rootSel);
  if (!root) return [];

  const parcelas = [];
  const $inputsPeriodo = root.querySelectorAll('input[name^="parcelas["][name$="[periodo]"]');

  $inputsPeriodo.forEach((inpPeriodo) => {
    const m = inpPeriodo.name.match(/parcelas\[(\d+)\]\[periodo\]/);
    const idx = m ? m[1] : null;
    if (idx == null) return;

    const inpValor = root.querySelector(`input[name="parcelas[${idx}][valor]"]`);
    const periodo = (inpPeriodo.value || '').trim();
    const valor = parseMoney(inpValor ? inpValor.value : 0);

    if (periodo) parcelas.push({ periodo, valor });
  });

  return parcelas;
}


async function iniciarProcesso() {
  try {
    obterDadosUsuarioLogado();

    const mensagemErro = validarCampos();
    if (mensagemErro) {
      toastMsg("Atenção", mensagemErro, "warning");
      return;
    }

    const confirmDialog = await exibirConfirmacao(CONFIRMATION_MESSAGE);
    if (!confirmDialog) return;

    $("#loadingOverlay").show();

    const confirmacao = await coletarConfirmacao();

    if (confirmacao.tipoConfirmacao === 'ASSINATURA_FUNC') {
      if (!confirmacao.assinaturaFuncionarioBase64) {
        toastMsg('Atenção', 'Assinatura do funcionário é obrigatória.', 'warning');
        return;
      }
    } else {
      if (!confirmacao.motivoRecusa) {
        toastMsg('Atenção', 'Informe o motivo da recusa.', 'warning');
        return;
      }
      const faltantes = (confirmacao.testemunhas || []).filter(t => !t?.nome || !t?.cpf || !t?.assinaturaBase64);
      if (faltantes.length > 0) {
        toastMsg('Atenção', 'Preencha nome, CPF e assinatura das duas testemunhas.', 'warning');
        return;
      }
    }

    const [fotoData, pdfBase64] = await Promise.all([
      processarFoto(),
      gerarRelatorioPDFBase64()
    ]);

    if (!fotoData) {
      toastMsg('Atenção', 'É necessário anexar a foto do funcionário.', 'warning');
      return;
    }

    const evidenciasBase64 = [
      ...(confirmacao.testemunhas || []).map(t => t?.fotoBase64).filter(Boolean),
      ...((confirmacao.evidenciasExtras || []).filter(Boolean))
    ];

    const parcelas = lerParcelasDoDOM('#revisaoParcelas');

    const constraints = await montarConstraints({
      fotoData,
      assinaturaData: confirmacao.assinaturaFuncionarioBase64 || null,
      pdfBase64,
      parcelas,
      confirmacao,
      evidenciasBase64
    });

    DatasetFactory.getDataset('ds_start_process', null, constraints, null, { // Consulta Dataset de Maneira Assíncrona
      success: function (dataset) {

        tratarResultado(dataset?.values[0]);
        $("#loadingOverlay").hide();
      },
      error: function (jqXHR, textStatus, errorThrown) {
        $("#loadingOverlay").hide();
        console.error('Erro ao tentar registrar solicitação. Erro:')
        console.log(jqXHR, textStatus, errorThrown);
        alert("Ocorreu um erro inesperado. Por favor, tente novamente.");
        return;
      }
    });

  } catch (error) {
    $("#loadingOverlay").hide();
    console.error(`Erro ao tentar registrar solicitação. Erro: ${error?.message || error}`);
    alert("Ocorreu um erro inesperado. Por favor, tente novamente.");
  }
}

function validarCampos() {
  const erros = [];
  if (erros.length > 0) {
    return "Verifique os campos obrigatórios antes de continuar:\n\n" + erros.join("\n");
  }
  return null;
}

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

async function processarFoto() {
  const fotoInput = document.getElementById("cameraInputPhotoEPI");
  const foto = fotoInput.files[0];
  if (!foto) {
    alert("Nenhuma foto foi selecionada.");
    return null;
  }
  const fotoBase64 = await readFileAsBase64(foto);
  return { fotoBase64, nomeFoto: foto.name };
}

async function capturarAssinatura() {
  const dataUrl = getPadBase64('signature-pad-func');
  if (!dataUrl) {
    alert("A assinatura está vazia!");
    return null;
  }
  return dataUrl;
}

function parseValorFromElement(elementId) {
  const el = document.getElementById(elementId);
  if (!el || !el.innerText) return 0;
  let valor = el.innerText.replace(/[^\d,.-]/g, '').replace(',', '.').trim();
  if (!valor) return 0;
  const parsed = parseFloat(valor);
  return isNaN(parsed) ? 0 : parsed;
}

const parseBR = (v) => {
  if (v == null) return 0;
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  const s = String(v).trim().replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return isFinite(n) ? n : 0;
};

async function montarConstraints({ fotoData, assinaturaData, pdfBase64, parcelas = [], confirmacao = {}, evidenciasBase64 = [] }) {
  const dataSolicitacao = new Date().toLocaleDateString("pt-BR");
  var data = new Date(),
    hora = data.getHours(),
    minuto = data.getMinutes(),
    segundos = data.getSeconds() <= 9 ? "0" + data.getSeconds() : data.getSeconds();
  const horaSolicitacao = `${hora}:${minuto}:${segundos}`;
  const nomeSolicitante = document.getElementById("nomeUsuario").value || "";
  const matriculaSolicitante = document.getElementById("matriculaUsuario").value || "";
  const emailSolicitante = document.getElementById("emailUsuario").value || "";
  const codFilial = document.getElementById("codFilial").value || "";
  const nomeColaborador = (document.getElementById("nomeColaborador")?.value || document.getElementById("funcionarioFiltro")?.value || "");
  const matriculaColaborador = document.getElementById("matriculaFunc").value || "";
  const descricao = document.getElementById("descricao").value || "";
  const valorEpi = parseMoney(document.getElementById("valorEpi").value || "0");
  const codVerba = $('#verbaNovoDesconto').val() || "";
  const tipoDesconto = ($('input[name="rdTipoDesconto"]:checked')?.val())?.toUpperCase() || ($('#revisaoTipoDesconto').text())?.toUpperCase() || "";
  const dataAtual = new Date();
  const anoAtual = String(dataAtual.getFullYear());
  const mesAtual = String(dataAtual.getMonth() + 1).padStart(2, '0');
  const periodoAtual = $('#periodoAtual').text() || `${anoAtual?.trim()}${mesAtual?.trim()}`

  const quinzeSalarioTxt =
    (document.getElementById("salario")?.value) ||
    (document.getElementById("salarioModal")?.innerText) ||
    "";

  const valSalarioTxt =
    (document.getElementById("valQuinzePorCentroSalario")?.value) ||
    (document.getElementById("quinzePorCentroSalario")?.innerText) ||
    "";

  const valSalario = parseMoney(valSalarioTxt);
  const quinzePorcentoSalario = parseMoney(quinzeSalarioTxt);

  const totalParcelas = Array.isArray(parcelas) ? parcelas.length : 0;

  const constraints = [];
  constraints.push(DatasetFactory.createConstraint("formField", "dataSolicitacao", dataSolicitacao, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "horaSolicitacao", horaSolicitacao, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "nomeSolicitante", nomeSolicitante, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "matriculaSolicitante", matriculaSolicitante, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "emailSolicitante", emailSolicitante, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "codFilial", codFilial, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "nomeColaborador", nomeColaborador, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "matriculaColaborador", matriculaColaborador, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "descricao", descricao, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "valorEpi", formatMoney2(valorEpi), ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "valSalario", formatMoney2(valSalario), ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "salarioporcento", formatMoney2(quinzePorcentoSalario), ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "totalParcelas", String(totalParcelas), ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "tipoDesconto", String(tipoDesconto), ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "codVerba", String(codVerba), ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "periodoAtual", String(periodoAtual), ConstraintType.MUST));

  constraints.push(DatasetFactory.createConstraint("formField", "parcelas_json", JSON.stringify(parcelas || []), ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "confirmacao_tipo", confirmacao?.tipoConfirmacao || "", ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "confirmacao_motivoRecusa", confirmacao?.motivoRecusa || "", ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "assinaturaFuncionario_base64", (assinaturaData ? (assinaturaData.split(",")[1] || "") : ""), ConstraintType.MUST));

  const t1 = confirmacao?.testemunhas?.[0] || {};
  const t2 = confirmacao?.testemunhas?.[1] || {};
  constraints.push(DatasetFactory.createConstraint("formField", "test1_nome", t1.nome || "", ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "test1_cpf", t1.cpf || "", ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "test1_cargo", t1.cargo || "", ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "assinaturaTestemunha1_base64", (t1.assinaturaBase64 ? (t1.assinaturaBase64.split(",")[1] || "") : ""), ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "test2_nome", t2.nome || "", ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "test2_cpf", t2.cpf || "", ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "test2_cargo", t2.cargo || "", ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "assinaturaTestemunha2_base64", (t2.assinaturaBase64 ? (t2.assinaturaBase64.split(",")[1] || "") : ""), ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "confirmacao_tipo_view", confirmacao?.tipoConfirmacao || "", ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "confirmacao_motivoRecusa_view", confirmacao?.motivoRecusa || "", ConstraintType.MUST));

  const evidNames = [];
  if (fotoData?.fotoBase64) {
    constraints.push(DatasetFactory.createConstraint("attachment", fotoData.fotoBase64, fotoData.nomeFoto || "foto_funcionario.png", ConstraintType.MUST));
    constraints.push(DatasetFactory.createConstraint("formField", "anexo_foto_nome", fotoData.nomeFoto || "foto_funcionario.png", ConstraintType.MUST));
  }
  if (assinaturaData) {
    constraints.push(DatasetFactory.createConstraint("attachment", (assinaturaData.split(",")[1] || ""), "assinatura.png", ConstraintType.MUST));
  }
  if (pdfBase64) {
    constraints.push(DatasetFactory.createConstraint("attachment", pdfBase64, "relatorio_desconto_lancado.pdf", ConstraintType.MUST));
    constraints.push(DatasetFactory.createConstraint("formField", "anexo_pdf_nome", "relatorio_desconto_lancado.pdf", ConstraintType.MUST));
  }

  (evidenciasBase64 || []).forEach((dataUrl, idx) => {
    const { b64, ext } = dataUrlToParts(dataUrl);
    if (!b64) return;
    const fname = `evidencia_${String(idx + 1).padStart(2, '0')}.${ext}`;
    constraints.push(DatasetFactory.createConstraint("attachment", b64, fname, ConstraintType.MUST));
    evidNames.push(fname);
  });

  const evidManifest = JSON.stringify({ total: evidNames.length, arquivos: evidNames });
  constraints.push(DatasetFactory.createConstraint("formField", "evidencias_json", truncateJsonString(evidManifest, 3800), ConstraintType.MUST));

  constraints.push(DatasetFactory.createConstraint("comments", "Lançamento de descontos iniciado pela Widget", "Lançamento de descontos iniciado pela Widget", ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("choosedState", 9, 9, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("processId", PROCESS_ID, PROCESS_ID, ConstraintType.MUST));

  return constraints;
}

async function iniciarProcessoFluig(constraints) {
  const dataset = await DatasetFactory.getDataset("ds_start_process", null, constraints, null);
  return dataset?.values[0];
}

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

function isCanvasBlank(canvas) {
  const context = canvas.getContext("2d");
  const pixelBuffer = new Uint32Array(context.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
  return !pixelBuffer.some((color) => color !== 0);
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function base64ToBlob(base64, mimeType) {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

function fecharModaisELimparInputs() {
  $("#modalAtivos").hide();
  $("#modalAssinatura").hide();
  $("#painelFuncionario").hide();
  $("#tabelaDescontos").empty();
  $("#tabelaResumoGeral tbody").find("td").empty();
  $("#tblNovosAtivos tbody").empty();
  $("#cameraInputPhotoEPI").val("");
  $(".previewFotoEPI").attr("src", "");
  $("#descricao").val("");
  $("#valorEpi").val("");
  clearPad('signature-pad-func');
  clearPad('signature-pad-test1');
  clearPad('signature-pad-test2');
}

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

async function gerarRelatorioPDFBase64() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  const primaryColor = [125, 30, 10];
  const lineSpacing = 7;

  const clamp = (n) => (Number.isFinite(n) ? n : 0);

  const pm = (typeof parseMoney === "function")
    ? parseMoney
    : (v) => {
      if (v == null) return 0;
      if (typeof v === "number") return isFinite(v) ? v : 0;
      const s = String(v).trim().replace(/\./g, "").replace(",", ".");
      const n = Number(s);
      return isFinite(n) ? n : 0;
    };

  function addTitle(text) {
    doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(...primaryColor);
    doc.text(text, pageWidth / 2, y, { align: "center" });
    y += 10;
  }
  function addH2(text) {
    doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...primaryColor);
    doc.text(text, margin, y);
    y += lineSpacing;
  }
  function addP(text) {
    doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(0, 0, 0);
    doc.text(text, margin, y);
    y += lineSpacing;
  }
  function ensureRoom(blockHeight) {
    if (y + blockHeight + 10 > pageHeight) {
      doc.addPage();
      y = margin;
    }
  }
  function addImageSafe(imgData, targetHmm = 20) {
    if (!imgData) return { usedH: 0 };
    const h = targetHmm;
    const maxW = pageWidth - 2 * margin;
    const w = Math.min(maxW, h * 5);
    const x = (pageWidth - w) / 2;
    if (![h, w, x, y].every(Number.isFinite)) return { usedH: 0 };
    ensureRoom(h + 12);
    doc.addImage(imgData, "PNG", x, y, w, h);
    y += h + 10;
    return { usedH: h };
  }
  function addUnderline(usedH) {
    if (!usedH) return;
    const w = Math.min(pageWidth - 2 * margin, 120);
    const x = (pageWidth - w) / 2;
    const lineY = y - 10 + usedH + 3 - usedH;
    doc.setDrawColor(180, 180, 180);
    doc.line(x, lineY, x + w, lineY);
  }
  function addSignatureBlock(title, { hiddenInputId, canvasId }) {
    doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...primaryColor);
    doc.text(title, margin, y);
    y += 5;
    let imgData = "";
    const hidden = document.getElementById(hiddenInputId)?.value?.trim();
    if (hidden) {
      imgData = `data:image/png;base64,${hidden}`;
    } else {
      const canvas = document.getElementById(canvasId);
      const w = clamp(canvas?.width), h = clamp(canvas?.height);
      if (canvas && w > 0 && h > 0) {
        try { imgData = canvas.toDataURL("image/png"); } catch (_) { imgData = ""; }
      }
    }
    if (!imgData) { addP("Não informado."); y -= lineSpacing - 10; return; }
    const { usedH } = addImageSafe(imgData, 20);
    addUnderline(usedH);
  }

  const filial = (document.getElementById("codFilial")?.value || "").trim();
  const funcionario = (document.getElementById("nomeColaborador")?.value
    || document.getElementById("funcionarioFiltro")?.value || "").trim();
  const descricaoDesc = (document.getElementById("descricao")?.value || "").trim();
  const valorEpi = pm((document.getElementById("valorEpi")?.value || "0").trim());

  const quinzeTxt = (document.getElementById("valQuinzePorCentroSalario")?.value
    || document.getElementById("quinzePorCentroSalario")?.innerText || "0");
  const quinzePorCentoSalario = pm(quinzeTxt);

  const parcelas = (typeof lerParcelasDoDOM === "function") ? lerParcelasDoDOM('#revisaoParcelas') : [];
  const totalParcelas = parcelas.length;
  const somaParcelas = (parcelas || []).reduce((a, p) => a + (Number(p?.valor) || 0), 0);

  const codVerba = $('#verbaNovoDesconto').val() || "";
  const tipoDesconto = ($('input[name="rdTipoDesconto"]:checked')?.val())?.toUpperCase()
    || ($('#revisaoTipoDesconto').text())?.toUpperCase() || "";

  const verbaDesc = (typeof getVerbaDesc === "function")
    ? (getVerbaDesc(tipoDesconto, codVerba) || "")
    : "";

  addTitle("RELATÓRIO DO NOVO DESCONTO");
  doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(0, 0, 0);
  addP(`Filial: ${filial}`);
  addP(`Funcionário: ${funcionario}`);
  y += 3;

  addH2("Novo Desconto");
  addP(`Descrição: ${descricaoDesc}`);
  addP(`Valor do Desconto: R$ ${valorEpi.toFixed(2)}`);
  y += 3;

  addH2("Resumo do novo desconto");
  addP(`15% do Salário (teto por período): R$ ${quinzePorCentoSalario.toFixed(2)}`);
  addP(`Total de Parcelas: ${totalParcelas}`);
  addP(`Soma das Parcelas: R$ ${somaParcelas.toFixed(2)}`);
  addP(`Tipo Desconto: ${tipoDesconto}`);
  addP(`Verba: ${codVerba}${verbaDesc ? ` - ${verbaDesc}` : ""}`);
  y += 5;

  addH2("Parcelas do novo desconto");
  const tableBody = (parcelas || []).map(p => [
    String(p?.periodo || ""),
    `R$ ${(Number(p?.valor) || 0).toFixed(2)}`
  ]);
  doc.autoTable({
    head: [["Período (YYYYMM)", "Valor da Parcela (R$)"]],
    body: tableBody.length ? tableBody : [["-", "-"]],
    startY: y,
    theme: "striped",
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 10, halign: "left" },
    bodyStyles: { fontSize: 9, valign: "middle" },
    styles: { overflow: "linebreak", cellWidth: "wrap" },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => { y = data.cursor.y + 10; }
  });

  const preview = document.querySelector(".previewFotoEPI");
  if (preview && preview.src) {
    try {
      const canvasPhoto = await html2canvas(preview);
      const imgData = canvasPhoto.toDataURL("image/png");
      doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...primaryColor);
      doc.text("Foto Capturada", margin, y);
      y += 5;
      addImageSafe(imgData, 90);
    } catch (e) {
      console.warn("Falha ao incluir foto no PDF:", e);
    }
  }

  addSignatureBlock("Assinatura do Funcionário", {
    hiddenInputId: "assinaturaFuncionario_base64",
    canvasId: "signature-pad-func"
  });

  const recusa = document.querySelector('input[name="recusaAssinatura"]:checked')?.value === "sim";
  if (recusa) {
    addSignatureBlock("Assinatura da Testemunha 1", {
      hiddenInputId: "assinaturaTestemunha1_base64",
      canvasId: "signature-pad-test1"
    });
    addSignatureBlock("Assinatura da Testemunha 2", {
      hiddenInputId: "assinaturaTestemunha2_base64",
      canvasId: "signature-pad-test2"
    });
  }

  const now = new Date();
  doc.setFontSize(8).setTextColor(120, 120, 120);
  doc.text(
    `Gerado em: ${now.toLocaleDateString()} ${now.toLocaleTimeString().slice(0, 5)}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  return doc.output("datauristring").split(",")[1];
}

function getVerbaDesc(nomeVerbaUpper, idProcurado) {
  if (!nomeVerbaUpper || !idProcurado) return null;
  const chave = Object.keys(VERBAS).find(
    k => k.toUpperCase() === String(nomeVerbaUpper).trim().toUpperCase()
  );
  if (!chave) return null;
  const item = VERBAS[chave].find(v => String(v.id) === String(idProcurado));
  return item ? item.desc : null;
}
