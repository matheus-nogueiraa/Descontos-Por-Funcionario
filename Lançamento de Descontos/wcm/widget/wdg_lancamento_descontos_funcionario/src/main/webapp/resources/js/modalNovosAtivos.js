function abrirModalAtivos() {
  var isTestEnvironment = window.location.origin.includes(':8443');
  var metadataid = isTestEnvironment ? "341794" : "486718";

  var constraintsAprovacao = [
    DatasetFactory.createConstraint('metadata#id', metadataid, metadataid, ConstraintType.MUST),
    DatasetFactory.createConstraint('userSecurityId', 'admin', 'admin', ConstraintType.MUST)
  ];
  var dataset = DatasetFactory.getDataset('ds_parametro_aprovacao_descontos', null, constraintsAprovacao, null);

  var permitirAprovacao = false;
  if (dataset && dataset.values.length > 0) {
    var valorInicial = dataset.values[ 0 ].permitirAprovacao;
    permitirAprovacao = valorInicial === true || valorInicial === 'true';
  }

  if (!permitirAprovacao) {   
    showSweetAlert('Atenção', 'Lançamento de novos descontos não permitida no momento.', 'error');
    return;
  }

  const nomeFuncionario = $('#nomeColaborador')?.val()?.trim() || '';
  const nenhumProcessoAtivo = consultaProcessosDescontosAtivos(nomeFuncionario);

  if (nenhumProcessoAtivo) {
    $('#modalAtivos').show();

    const filial = $('#codFilial').val();
    const codFilial = filial ? filial.split(' ')[ 0 ] : '';

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

  VERBAS[ tipoDesconto ].forEach(element => {
    $(`#verbaNovoDesconto`).append(`<option value="${element.id?.trim()}">${element.id?.trim()} - ${element.desc?.trim()}</option>`);
  });

  $("#descricao").val('');
  $("#tipoVerba").val('');
  $("#valorEpi").val('');
  $('#labelTipoDesconto').text('');

  // Mostra o campo de foto por padrão quando muda o tipo de desconto
  $('#cameraContainer').parent().parent().show();

  // Esconde o campo centro de custo se for tipo DP
  if (tipoDesconto === 'dp') {
    $(`#centroCustoDesconto`).hide();
    $(`#btnVincularEpiXFuncionario`).text('Avançar')
  } else {
    $(`#centroCustoDesconto`).show();
    $(`#btnVincularEpiXFuncionario`).text('Solicitar Assinatura')
  }
}

function consultaProcessosDescontosAtivos(funcionario) {
  let constraints = new Array();
  let listaSolicitacoes = new Array();

  constraints.push(DatasetFactory.createConstraint('nomeColaborador', funcionario, funcionario, ConstraintType.MUST));
  constraints.push(DatasetFactory.createConstraint('rdTipoDesconto', 'dp', 'dp', ConstraintType.MUST_NOT));
  constraints.push(DatasetFactory.createConstraint('atividadeAtual', '32', '32', ConstraintType.MUST_NOT));
  constraints.push(DatasetFactory.createConstraint('atividadeAtual', '22', '22', ConstraintType.MUST_NOT));
  constraints.push(DatasetFactory.createConstraint('atividadeAtual', '27', '27', ConstraintType.MUST_NOT));
  constraints.push(DatasetFactory.createConstraint('atividadeAtual', '10', '10', ConstraintType.MUST_NOT));
  constraints.push(DatasetFactory.createConstraint('atividadeAtual', '29', '29', ConstraintType.MUST_NOT));
  constraints.push(DatasetFactory.createConstraint('atividadeAtual', '15', '15', ConstraintType.MUST_NOT));
  constraints.push(DatasetFactory.createConstraint('atividadeAtual', '00', '00', ConstraintType.MUST_NOT));
  constraints.push(DatasetFactory.createConstraint('atividadeAtual', '9', '9', ConstraintType.MUST_NOT));


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

function consultaTipoVerba() {
  const verbaNovoDesconto = $('#verbaNovoDesconto').val();
  const filial = $('#codFilial').val();
  const codFilial = filial ? filial.split(' ')[ 0 ] : '';
  if (verbaNovoDesconto) {
    const constraints = new Array();

    constraints.push(DatasetFactory.createConstraint('filial', codFilial, codFilial, ConstraintType.MUST));
    constraints.push(DatasetFactory.createConstraint('codVerba', verbaNovoDesconto, verbaNovoDesconto, ConstraintType.MUST));

    const dataset = DatasetFactory.getDataset('ds_consultaVerbasProtheus', null, constraints, null);

    const tipoVerba = dataset?.values[ 0 ]?.RV_TIPO || '';

    $('#tipoVerba').val(tipoVerba);

    if (tipoVerba == 'H') {
      $('#labelTipoDesconto').text('EM HORAS');
      $('#valorEpi').attr('placeholder', '000:00');
    }
    else if (tipoVerba == 'D') {
      $('#labelTipoDesconto').text('EM DIAS');
      $('#valorEpi').attr('placeholder', '00');
    }
    else {
      $('#labelTipoDesconto').text('EM VALOR (R$)');
      $('#valorEpi').attr('placeholder', '00.000,00');
    }
  }

  const verbasSemFoto = [ "440", "445", "570", "571" ];
  if (verbasSemFoto.includes(verbaNovoDesconto)) {
    $('#cameraContainer').parent().parent().hide(); // Oculta todo o painel de captura de foto
  } else {
    $('#cameraContainer').parent().parent().show(); // Mostra o painel de captura de foto
  }
}