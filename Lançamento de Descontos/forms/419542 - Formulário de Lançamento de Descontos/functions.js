$(document).ready(function () {
  setValueTest2()
  initPad('signature-pad-test2');
  const rescusaAssinatura = $('#recusaAssinatura').val();
  if (rescusaAssinatura === 'sim') {
    clearPad('signature-pad-test2');
    $('#signature-pad-test2').prop('disabled', false);
    $('#panelTestemunha2').show();
  } else {
    $('#signature-pad-test2').prop('disabled', true);
    $('#panelTestemunha2').hide();
  }
});

async function getFluigUser() {
  return $.ajax({
    url: '/api/public/2.0/users/getCurrent',
    type: "GET",
  }).then(function (data) {
    const nomeUsuario = data?.content?.fullName || "";
    const emailUsuario = data?.content?.email || "";
    const matriculaUsuario = data?.content?.code || "";
    console.log(data?.content)
    console.log("Usuário Fluig:", nomeUsuario, emailUsuario, matriculaUsuario);
    return nomeUsuario;
  }).catch(function (err) {
    console.error('Erro ao obter usuário Fluig', err);
  });
}

async function setValueTest2() {
  const nomeUsuario = await getFluigUser();
  $('#test2_nome').val(nomeUsuario).prop('readonly', true);
}

const pads = {};



function initPad(idCanvas) {
  const canvas = document.getElementById(idCanvas);
  if (!canvas) {
    console.error(`Canvas com ID "${idCanvas}" não encontrado.`);
    return;
  }
  console.log(`Inicializando SignaturePad para o canvas "${idCanvas}"`);

  // Ajusta resolução
  const resize = () => {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
  };
  resize();
  window.addEventListener('resize', resize);

  pads[ idCanvas ] = new SignaturePad(canvas, { penColor: '#000' });
}

function clearPad(idCanvas) { pads[ idCanvas ]?.clear(); }
