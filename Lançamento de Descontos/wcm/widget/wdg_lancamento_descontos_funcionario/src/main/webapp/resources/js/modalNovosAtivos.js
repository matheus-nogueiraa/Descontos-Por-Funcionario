function abrirModalAtivos() {
  const nomeFuncionario = $('#nomeColaborador')?.val()?.trim() || '';
  const nenhumProcessoAtivo = consultaProcessosDescontosAtivos(nomeFuncionario);

  if (nenhumProcessoAtivo) {
    $('#modalAtivos').show();

    const filial = $('#codFilial').val();
    const codFilial = filial ? filial.split(' ')[0] : '';

    const funcionario = $('#matriculaFunc').val();

    const salario = $('#salario').val();
    const salario15 = $('#salario15').val();

    $('#codFilialModal').text(codFilial);
    $('#codFuncionarioModal').text(funcionario);
    $('#salarioModal').text(salario);
    $('#15salarioModal').text(salario15);
  }
}

function fecharModalAtivos() {
  $('#modalAtivos').hide();

  // Limpar campos do modal
  $('#codFilialModal').text('');
  $('#codFuncionarioModal').text('');
  $('#15salarioModal').text('');
  $('#tblNovosAtivos tbody').empty();
  $('#cameraInputPhotoEPI').val('');
  $('.previewFotoEPI').attr('src', '');
}

function mudaVerbasNovoDesconto(tipoDesconto) {
  $(`#verbaNovoDesconto`).find('option').remove();

  $(`#verbaNovoDesconto`).append(`<option value="" disabled selected>Selecione a verba...</option>`);

  VERBAS[tipoDesconto].forEach(element => {
    $(`#verbaNovoDesconto`).append(`<option value="${element.id?.trim()}">${element.id?.trim()} - ${element.desc?.trim()}</option>`);
  });
}

function consultaProcessosDescontosAtivos(funcionario) {
  let constraints = new Array();
  let listaSolicitacoes = new Array();

  constraints.push(DatasetFactory.createConstraint('nomeColaborador', funcionario, funcionario, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint('atividadeAtual', '27', '27', ConstraintType.MUST_NOT));
  constraints.push(DatasetFactory.createConstraint('atividadeAtual', '10', '10', ConstraintType.MUST_NOT));
  constraints.push(DatasetFactory.createConstraint('atividadeAtual', '00', '00', ConstraintType.MUST_NOT));

  let dataset = DatasetFactory.getDataset('ds_form_lancamento_desconto_funcionario', null, constraints, null);

  dataset.values.forEach((element, index) => {
    if (element?.solicitacao_fluig) {
      listaSolicitacoes.push(element.solicitacao_fluig)
    }
  });

  if (listaSolicitacoes.length > 0) {
    showSweetAlert('Atenção', `Existem processos de descontos ativos para o funcionário selecionado. Aguarde a finalização dos seguintes processos: \n${listaSolicitacoes}`, 'warning');
    return false;
  }
  else {
    return true;
  }
}