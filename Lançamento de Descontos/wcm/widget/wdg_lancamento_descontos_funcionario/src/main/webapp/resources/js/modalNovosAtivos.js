function abrirModalAtivos() {
  $('#modalAtivos').show();

  const filial = $('#codFilial').val();
  const codFilial = filial ? filial.split(' ')[ 0 ] : '';

  const funcionario = $('#matriculaFunc').val();

  const salario = $('#salario').val();
  const salario10 = $('#salario10').val();

  $('#codFilialModal').text(codFilial);
  $('#codFuncionarioModal').text(funcionario);
  $('#salarioModal').text(salario);
  $('#10salarioModal').text(salario10);
}

function fecharModalAtivos() {
  $('#modalAtivos').hide();

  // Limpar campos do modal
  $('#codFilialModal').text('');
  $('#codFuncionarioModal').text('');
  $('#10salarioModal').text('');
  $('#tblNovosAtivos tbody').empty();
  $('#cameraInputPhotoEPI').val('');
  $('.previewFotoEPI').attr('src', '');
}

function mudaVerbasNovoDesconto(tipoDesconto){
  $(`#verbaNovoDesconto`).find('option').remove();

  $(`#verbaNovoDesconto`).append(`<option value="" disabled selected>Selecione uma verba</option>`);

  VERBAS[tipoDesconto].forEach(element => {
    $(`#verbaNovoDesconto`).append(`<option value="${element.id?.trim()}">${element.id?.trim()} - ${element.desc?.trim()}</option>`);
  });
}