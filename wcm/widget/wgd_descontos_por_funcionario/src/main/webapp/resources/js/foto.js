function savePhotoFuncionario() {
  const input = document.getElementById('cameraInputPhotoEPI');
  const preview = document.getElementById('previewPhotoFuncionario');
  const file = input?.files?.[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        preview.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}