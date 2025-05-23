$(document).ready(function () {
  console.log("Iniciando o script de captura de foto e assinatura.");
  
  var base64Assinatura = $("input[name='assinaturaBase64']").val();
  if (base64Assinatura && base64Assinatura.length > 100) {
    if (!base64Assinatura.startsWith("data:image")) {
      base64Assinatura = "data:image/png;base64," + base64Assinatura;
    }
    $("#signature-pad").attr("src", base64Assinatura);
  } else {
    console.log("Base64 da assinatura não encontrado ou inválido.");
  }

  var input = document.getElementById("cameraInputPhotoEPI");
  if (input.innerHTML) {
    let base64Foto = input.innerHTML
    if (!base64Foto.startsWith("data:image")) {
      base64Foto = "data:image/jpeg;base64," + base64Foto;
    }
    $("#previewFotoEPI").attr("src", base64Foto);
  } else {
    console.log("Base64 da foto não encontrado ou inválido.");
  }
});