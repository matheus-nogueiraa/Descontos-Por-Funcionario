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

    const fotoData = await processarFoto();
    if (!fotoData) return;

    const assinaturaData = capturarAssinatura();
    if (!assinaturaData) return;

    const constraints = await montarConstraints();
    const statusIntegracao = await iniciarProcessoFluig(constraints);

    if (!statusIntegracao || statusIntegracao.status === "ERROR") {
      tratarResultado(statusIntegracao);
      return;
    }

    tratarResultado(statusIntegracao);
  } catch (error) {
    console.error(`Erro ao tentar registrar solicitação. Erro: ${error.message}`);
    alert("Ocorreu um erro inesperado. Por favor, tente novamente.");
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
function capturarAssinatura() {
  const signaturePad = document.getElementById("signature-pad");
  if (isCanvasBlank(signaturePad)) {
    alert("A assinatura está vazia!");
    return null;
  }
  return signaturePad.toDataURL("image/png");
}

async function montarConstraints() {
  const numFluig = document.getElementById("numFluig").value || "";
  const dataSolicitacao = new Date().toLocaleDateString("pt-BR");
  const horaSolicitacao = new Date().toLocaleTimeString("pt-BR");
  const nomeSolicitante = document.getElementById("nomeUsuario").value || "";
  const matriculaSolicitante = document.getElementById("matriculaUsuario").value || "";
  const emailSolicitante = document.getElementById("emailUsuario").value || "";
  const codFilial = document.getElementById("codFilial").value || "";
  const nomeColaborador = document.getElementById("codFuncionario").value || "";
  const codEpi = document.getElementById("descricaoEpi").value || "";
  const valorEpi = document.getElementById("valorEpi").value || "";

  const constraints = [];
  constraints.push(DatasetFactory.createConstraint("formField", "numFluig", numFluig, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "dataSolicitacao", dataSolicitacao, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "horaSolicitacao", horaSolicitacao, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "nomeSolicitante", nomeSolicitante, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "matriculaSolicitante", matriculaSolicitante, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "emailSolicitante", emailSolicitante, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "codFilial", codFilial, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "nomeColaborador", nomeColaborador, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "codEpi", codEpi, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "valorEpi", valorEpi.toString(), ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "salarioporcento", dezPorcentoSalario.toString(), ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("formField", "totalParcelas", novoTotalParcelas.toString(), ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("choosedState", 10, 10, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint("processId", PROCESS_ID, PROCESS_ID, ConstraintType.MUST));

  // --- Pegando a foto em base64 ---
  const fotoInput = document.getElementById("cameraInputPhotoEPI");
  const foto = fotoInput.files[0];
  if (foto) {
    const fotoBase64 = await readFileAsBase64(foto);
    constraints.push(DatasetFactory.createConstraint("attachment", fotoBase64, foto.name, ConstraintType.MUST));
  }

  // --- Pegando a assinatura em base64 ---
  const signaturePad = document.getElementById("signature-pad");
  if (signaturePad && !isCanvasBlank(signaturePad)) {
    const assinaturaBase64 = signaturePad.toDataURL("image/png").split(",")[1];
    constraints.push(DatasetFactory.createConstraint("attachment", assinaturaBase64, "assinatura.png", ConstraintType.MUST));
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
  $("#previewFotoEPI").attr("src", "");

  const signaturePad = document.getElementById("signature-pad");
  if (signaturePad) {
    signaturePad.getContext("2d").clearRect(0, 0, signaturePad.width, signaturePad.height);
  }
}

// Obtém os dados do colaborador
function obterdadosColaborador() {
  const funcionario = $("#codFuncionario").val();

  if (!funcionario) {
    alert("Por favor, insira o código e o nome do funcionário.");
    return null;
  }

  const [ codFuncionario, nomeFuncionario ] = funcionario.includes(" - ")
    ? funcionario.split(" - ").map((item) => item.trim())
    : [ funcionario.trim(), "" ];

  if (!codFuncionario || !nomeFuncionario) {
    alert('Formato inválido. Certifique-se de usar o formato "Código - Nome".');
    return null;
  }

  return { codFuncionario, nomeFuncionario };
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
