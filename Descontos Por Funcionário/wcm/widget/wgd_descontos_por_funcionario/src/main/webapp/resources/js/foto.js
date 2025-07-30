function reloadPreview() {
  const input = document.getElementById('cameraInputPhotoEPI');
  const file = input?.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      // Atualiza todas as imagens de preview
      document.querySelectorAll('.previewFotoEPI').forEach(img => {
        img.src = e.target.result;
      });
    };
    reader.readAsDataURL(file);
  } else {
    // Limpa as imagens se não houver arquivo
    document.querySelectorAll('.previewFotoEPI').forEach(img => {
      img.src = '';
    });
  }
}

function removePhoto() {
  const preview = document.querySelector('.previewFotoEPI');
  const input = document.getElementById('cameraInputPhotoEPI');

  if (preview) preview.src = '';
  if (input) input.value = '';

  // Limpa o campo oculto
  $("input[name='nomeFotoEpi']").val('');
}