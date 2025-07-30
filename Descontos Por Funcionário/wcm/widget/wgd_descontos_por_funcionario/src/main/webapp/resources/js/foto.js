function reloadPreview() {
  const input = document.getElementById('cameraInputPhotoEPI');
  const preview = document.getElementById('previewFotoEPI');

  if (input.files && input.files[ 0 ]) {
    const reader = new FileReader();

    reader.onload = function (e) {
      preview.src = e.target.result;

      // Aqui você pode atualizar o campo oculto se desejar salvar o base64
      $("input[name='nomeFotoEpi']").val(e.target.result.replace(/^data:image\/(png|jpeg|jpg);base64,/, ''));
    };

    reader.readAsDataURL(input.files[ 0 ]);
  }
}

function removePhoto() {
  const preview = document.getElementById('previewFotoEPI');
  const input = document.getElementById('cameraInputPhotoEPI');

  preview.src = '';
  input.value = '';

  // Limpa o campo oculto
  $("input[name='nomeFotoEpi']").val('');
}