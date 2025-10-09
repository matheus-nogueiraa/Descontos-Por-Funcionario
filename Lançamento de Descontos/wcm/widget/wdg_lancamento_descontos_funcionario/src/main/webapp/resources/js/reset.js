// ================= RESET CENTRAL =================
const STATE = {
  parcelas: [],
  funcionarioSelecionado: null
};

window.pads = window.pads || {};

// util para limpar um SignaturePad existente e resetar o canvas
function destroyPad(idCanvas) {
  const pad = pads[idCanvas];
  if (pad) {
    try { pad.clear(); } catch(_) {}
    delete pads[idCanvas];
  }
  const canvas = document.getElementById(idCanvas);
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0, 0, canvas.width || 0, canvas.height || 0);
      // zera dimensões para evitar “fantasmas”
      canvas.width = canvas.offsetWidth || 0;
      canvas.height = canvas.offsetHeight || 0;
    }
  }
}

function resetTablesAndResumo() {
  // tabelas e resumos
  $("#tabelaDescontos").empty();
  $("#tabelaResumoGeral tbody").find("td").empty();
  $("#revisaoParcelas").empty();

  // painel de funcionário
  $("#painelFuncionario").hide();

  // campos do "Parcelas Geradas" no formulário (lado Fluig)
  $('input[name^="parcelas["][name$="[periodo]"]').val('');
  $('input[name^="parcelas["][name$="[valor]"]').val('');
  $('input[name="parcelas_total"]').val('');
  $('input[name="parcelas_qtd"]').val('');

  // campos técnicos
  $('#parcelas_json').val('[]'); // se existir no seu HTML de formulário
}

function resetCamposNovosDesconto() {
  $("#descricao").val("");
  $("#valorEpi").val("");
  $("#verbaNovoDesconto").val("");
  $('input[name="rdTipoDesconto"]').prop('checked', false);
  $("#revisaoFuncionario").empty();
  $("#revisaoEpis").empty();
  $("#revisaoTipoDesconto").empty();

  // teto/15% se for preenchido em algum lugar “de revisão”
  $("#quinzePorCentroSalario").text("");
  $("#valorParcelaMensalResumo").text("");
  $("#valorTotalResumo").text("");

  // esconda/limpe campos auxiliares se tiver
  $("#salarioModal").text("");
  $("#valQuinzePorCentroSalario").val("");
  $(`#verbaNovoDesconto`).find('option').remove();
}

function resetFilesAndImages() {
  // foto do funcionário
  $("#cameraInputPhotoEPI").val("");
  $(".previewFotoEPI").attr("src", "");

  // fotos das testemunhas e anexos extras
  $("#test1_foto").val("");
  $("#test2_foto").val("");
  $("#evidenciasExtras").val("");
}

function resetAssinaturas() {
  // limpa canvases/pads
  destroyPad('signature-pad-func');
  destroyPad('signature-pad-test1');
  destroyPad('signature-pad-test2');

  // limpa inputs de assinatura base64 (se existirem)
  $("#assinaturaFuncionario_base64").val("");
  $("#assinaturaTestemunha1_base64").val("");
  $("#assinaturaTestemunha2_base64").val("");

  // limpa dados das testemunhas
  $("#test1_nome, #test1_cpf, #test1_cargo").val('');
  $("#test2_nome, #test2_cpf, #test2_cargo").val('');
  $('input[name="recusaAssinatura"][value="nao"]').prop('checked', true);
  $('#blocoAssinaturaFuncionario').show();
  $('#blocoTestemunhas, #blocoMotivoRecusa').hide();
  $('#motivoRecusa').val('');
}

function resetFuncionarioSelecao() {
  // se você usa esses campos como “selecionador”
  $("#funcionarioFiltro").val("");
  $("#matriculaFunc").val("");
  $("#nomeColaborador").val("");

  // meta/ocultos
  $("#codFilial").val("");
}

function resetModais() {
  $("#modalAtivos").hide();
  $("#modalAssinatura").hide();
}

function resetEstadoInterno() {
  STATE.parcelas = [];
  STATE.funcionarioSelecionado = null;
}

function resetAll({ keepUser=false } = {}) {
  resetModais();
  resetTablesAndResumo();
  resetCamposNovosDesconto();
  resetFilesAndImages();
  resetAssinaturas();
  resetEstadoInterno();

  // por último, esconde painéis auxiliares que eventualmente fiquem abertos
  $("#tblNovosAtivos tbody").empty();
}

// ============ HOOKS AUTOMÁTICOS ============

// 1) A cada reload/volta pelo BFCache, limpa tudo mas mantém usuário logado
document.addEventListener('DOMContentLoaded', () => {
  resetAll({ keepUser: true });
});

window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    resetAll({ keepUser: true });
  }
});

// 2) Quando o funcionário é desselecionado ou alterado
$(document).on('change', '#funcionarioFiltro, #matriculaFunc', function() {
  const temValor = ($(this).val() || '').trim().length > 0;
  if (!temValor) {
    resetAll({ keepUser: true });
  } else {
    // trocou para outro funcionário? limpe dependências também:
    resetTablesAndResumo();
    resetCamposNovosDesconto();
    resetFilesAndImages();
    resetAssinaturas();
    resetEstadoInterno();
  }
});

// 3) Exporte para uso manual quando quiser (ex.: botão "Limpar")
window.resetAllLancamento = resetAll;
