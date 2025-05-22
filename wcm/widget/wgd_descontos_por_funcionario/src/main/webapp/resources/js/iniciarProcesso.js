const PROCESS_ID = "wf_cadastrosDescontosAtivosAoColaborador";
const CONFIRMATION_MESSAGE = "Você tem certeza que deseja iniciar o processo?";
const ERROR_MESSAGE = "Erro ao gerar solicitação de compras. Contate a equipe de TI!";
const SUCCESS_MESSAGE = "Processo iniciado com sucesso! ID do processo: ";

async function iniciarProcesso() {
  try {
    if (!validarCampos()) return;

    const confirmacao = await exibirConfirmacao(CONFIRMATION_MESSAGE);
    if (!confirmacao) return;

    const fotoData = await processarFoto();
    if (!fotoData) return;

    const assinaturaData = capturarAssinatura();
    if (!assinaturaData) return;

    const tabelaEPIsData = processarTabelaEPIs();
    const dadosColaborador = obterdadosColaborador();
    if (!dadosColaborador) return;

    const constraints = montarConstraints(fotoData, assinaturaData, tabelaEPIsData, dadosColaborador);
    const statusIntegracao = await iniciarProcessoFluig(constraints);

    tratarResultado(statusIntegracao);
  } catch (error) {
    console.error(`Erro ao tentar registrar solicitação. Erro: ${error}`);
    alert("Ocorreu um erro inesperado. Por favor, tente novamente.");
  }
}

function validarCampos() {
  const erros = [];

  if (!document.querySelectorAll('#tblNovosAtivos tbody tr').length) {
    erros.push("- Adicione pelo menos um EPI a ser pago.");
  }

  if (!document.getElementById('cameraInputPhotoEPI').files.length) {
    erros.push("- Capture ou anexe uma foto do funcionário.");
  }

  if (isCanvasBlank(document.getElementById('signature-pad'))) {
    erros.push("- A assinatura do funcionário é obrigatória.");
  }

  if (erros.length) {
    alert("Verifique os seguintes campos antes de continuar:\n\n" + erros.join("\n"));
    return false;
  }

  return true;
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

function capturarAssinatura() {
  const signaturePad = document.getElementById("signature-pad");
  if (isCanvasBlank(signaturePad)) {
    alert("A assinatura está vazia!");
    return null;
  }
  return signaturePad.toDataURL("image/png");
}

function processarTabelaEPIs() {
  return Array.from(document.querySelectorAll("#tblNovosAtivos tbody tr")).map((row, index) => ({
    index: index + 1,
    nomeEPI: row.querySelector('input[name="codEpi"]').value || "",
    valorEPI: parseFloat(row.querySelector('input[name="valorEpi"]').value || 0),
  }));
}

function montarConstraints(fotoData, assinaturaData, tabelaEPIsData, dadosColaborador) {
  const constraints = [
    DatasetFactory.createConstraint("formField", "cameraInputPhotoEPI", fotoData.fotoBase64, ConstraintType.MUST),
    DatasetFactory.createConstraint("formField", "nomeFotoEpi", fotoData.nomeFoto, ConstraintType.MUST),
    DatasetFactory.createConstraint("formField", "assinaturaBase64", assinaturaData, ConstraintType.MUST),
    DatasetFactory.createConstraint("processId", PROCESS_ID, PROCESS_ID, ConstraintType.MUST),
    DatasetFactory.createConstraint("choosedState", 10, 10, ConstraintType.MUST),
    DatasetFactory.createConstraint("comments", "Iniciado via widget de Cadastro de Descontos ao Colaborador", "Iniciado via widget de Cadastro de Descontos ao Colaborador", ConstraintType.MUST),
  ];

  tabelaEPIsData.forEach(({ index, nomeEPI, valorEPI }) => {
    constraints.push(DatasetFactory.createConstraint("formField", `codEpi___${index}`, nomeEPI, ConstraintType.MUST));
    constraints.push(DatasetFactory.createConstraint("formField", `valorEPI___${index}`, valorEPI, ConstraintType.MUST));
  });

  constraints.push(DatasetFactory.createConstraint("formField", "codColaborador", dadosColaborador.codFuncionario, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "nomeColaborador", dadosColaborador.nomeFuncionario, ConstraintType.MUST));

  return constraints;
}

async function iniciarProcessoFluig(constraints) {
  const dataset = DatasetFactory.getDataset("ds_start_process", null, constraints, null);
  return dataset?.values[0];
}

function tratarResultado(statusIntegracao) {
  if (!statusIntegracao || statusIntegracao.status === "ERROR") {
    showSweetTimerAlert(ERROR_MESSAGE, "warning");
    console.error(`Erro ao gerar solicitação de compras: ${statusIntegracao?.status}`);
    return;
  }

  const processId = statusIntegracao.processId || "desconhecido";
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

function fecharModaisELimparInputs() {
  $("#modalAtivos").hide();
  $("#modalAssinatura").hide();

  $("#tblNovosAtivos tbody").empty();
  $("#cameraInputPhotoEPI").val("");
  $("#previewPhotoFuncionario").attr("src", "");
  const signaturePad = document.getElementById("signature-pad");
  signaturePad.getContext("2d").clearRect(0, 0, signaturePad.width, signaturePad.height);
  $("#codFuncionario").val("");
  $("#codFilial").val("");
  $("#dadosColaborador").empty();
  $("#tabelaDescontos").empty();
  $("#valorTotalResumo").text("");
  $("#parcelasTotaisResumo").text("");
  $("#valorParcelaMensalResumo").text("");
  $("#revisaoEpis").empty();
}

function obterdadosColaborador() {
  const funcionario = $("#codFuncionario").val();

  if (!funcionario) {
    alert("Por favor, insira o código e o nome do funcionário.");
    return null;
  }

  const [codFuncionario, nomeFuncionario] = funcionario.includes(" - ")
    ? funcionario.split(" - ").map((item) => item.trim())
    : [funcionario.trim(), ""];

  if (!codFuncionario || !nomeFuncionario) {
    alert('Formato inválido. Certifique-se de usar o formato "Código - Nome".');
    return null;
  }

  return { codFuncionario, nomeFuncionario };
}