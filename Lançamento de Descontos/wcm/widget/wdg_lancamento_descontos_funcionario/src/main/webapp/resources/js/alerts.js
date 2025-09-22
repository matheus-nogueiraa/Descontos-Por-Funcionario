function toastMsg(titulo, message, tipo) {
  FLUIGC.toast({
    title: titulo,
    message: message,
    type: tipo
  });
}

function showSweetAlert(title, msg, icon) {
  Swal.fire({
    icon: icon,
    title: title,
    html: '' + msg + ''
  });
}

function showSweetTimerAlert(msg, icon) {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 6000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  })
  Toast.fire({
    icon: icon,
    html: msg
  });
}