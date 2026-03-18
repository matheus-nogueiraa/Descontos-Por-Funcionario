function reloadPreview() {
  const input = document.getElementById('cameraInputPhotoEPI');
  const file = input?.files?.[0];

  if (file) {
    const tiposPermitidos = ['image/png', 'image/jpeg', 'image/bmp'];
    const extensoesPermitidas = ['.png', '.jpg', '.jpeg', '.bmp'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!tiposPermitidos.includes(file.type) || !extensoesPermitidas.includes(ext)) {
      // Remove o arquivo inválido e limpa o preview
      input.value = '';
      document.querySelectorAll('.previewFotoEPI').forEach(img => { img.src = ''; });

      // Exibe aviso ao usuário
      const Toast = Swal.mixin({
        toast: true,
        position: 'top',
        showConfirmButton: false,
        timer: 8000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer);
          toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
      });
      Toast.fire({
        icon: 'error',
        html: '<b>Arquivo inválido!</b><br>Este campo aceita apenas imagens (PNG, JPG, JPEG, BMP).<br>Para enviar PDF, utilize o campo <b>"Evidências Complementares"</b>.'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      document.querySelectorAll('.previewFotoEPI').forEach(img => {
        img.src = e.target.result;
      });
    };
    reader.readAsDataURL(file);
  } else {
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