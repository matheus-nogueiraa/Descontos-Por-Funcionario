let signaturePad;

function initSignaturePad(canvasId = "signature-pad") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas com ID "${canvasId}" não encontrado.`);
    return;
  }

  // Ajusta o tamanho do canvas para caber corretamente
  function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);
  }

  resizeCanvas(); // Chama ao carregar
  window.addEventListener("resize", resizeCanvas);

  // Inicializa o SignaturePad
  signaturePad = new SignaturePad(canvas);
}

// Função para obter base64 da assinatura
function getAssinaturaBase64() {
  if (signaturePad && !signaturePad.isEmpty()) {
    return signaturePad.toDataURL("image/png");
  } else {
    alert("A assinatura está vazia!");
    return null;
  }
}

function openModalAssinatura() {
  // Captura os valores dos campos
  const descricao = $('#descricao').val().trim();
  const valor = parseFloat($('#valorEpi').val());

  // Validação dos campos
  if (!descricao) {
    toastMsg('Atenção', 'Preencha o campo descrição antes de prosseguir para a assinatura.', 'warning');
    return;
  }
  if (isNaN(valor) || valor <= 0) {
    toastMsg('Atenção', 'Preencha o campo Valor com um valor maior que zero.', 'warning');
    return;
  }

  const input = document.getElementById('cameraInputPhotoEPI');
  const file = input?.files?.[0];

  if (!file) {
    toastMsg('Atenção', 'Adicione uma foto do funcionário antes de prosseguir para a assinatura.', 'warning');
    return;
  }

  // Exibe a lista de EPIs com descrição e valor
  $('#revisaoEpis').html(`<ul><li>${descricao} - R$ ${valor.toFixed(2).replace('.', ',')}</li></ul>`);

  // Inicializa o SignaturePad
  initSignaturePad();

  // Mostra o modal de assinatura
  $('#modalAssinatura').show();
  setTimeout(() => {
    initSignaturePad();
  }, 300);
}

function fecharModalAssinatura() {
  $('#modalAssinatura').hide();
}

function clearModalAssinatura() {
  if (signaturePad) {
    signaturePad.clear();
  }
}