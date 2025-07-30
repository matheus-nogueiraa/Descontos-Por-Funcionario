function abrirModalAtivos() {
  $('#modalAtivos').show();

  const filial = $('#codFilial').val();
  const codFilial = filial ? filial.split(' ')[ 0 ] : '';

  const funcionario = $('#codFuncionario').val();
  const nomeFuncionario = funcionario && funcionario.includes(' - ')
    ? funcionario.split(' - ')[ 1 ].trim()
    : funcionario.trim();

  const salario = $('#salario').val();
  const salario10 = $('#salario10').val();

  $('#codFilialModal').text(codFilial);
  $('#codFuncionarioModal').text(nomeFuncionario);
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
