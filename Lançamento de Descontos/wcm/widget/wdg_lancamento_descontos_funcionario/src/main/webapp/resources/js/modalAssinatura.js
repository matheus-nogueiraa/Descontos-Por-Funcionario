let signaturePad;

// ====== utils ======
function parseMoney(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  let s = String(v).trim();
  if (!s) return 0;

  // mantém somente dígitos, ponto, vírgula e sinal
  s = s.replace(/[^\d.,-]/g, '');

  const hasComma = s.indexOf(',') !== -1;
  const hasDot   = s.indexOf('.') !== -1;

  if (hasComma && hasDot) {
    // padrão pt-BR: ponto milhar, vírgula decimal
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (hasComma && !hasDot) {
    // só vírgula => vírgula é decimal
    s = s.replace(',', '.');
  } // se só tem ponto, é decimal em en-US (mantém)

  const n = Number(s);
  return isFinite(n) ? n : 0;
}

function formatMoney2(v) {
  const n = parseMoney(v);
  return n.toFixed(2); // string "213.28"
}

function addMonth(periodoYYYYMM) {
  const y = Number(periodoYYYYMM.slice(0, 4));
  const m = Number(periodoYYYYMM.slice(4, 6));
  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function somaPorPeriodo(datasetValues, campoPeriodo = 'codPeriodo', campoValor = 'valor') {
  const mapa = {};
  (datasetValues || []).forEach(row => {
    const per = String(row[campoPeriodo] || '').trim();
    if (!per) return;
    const v = parseMoney(row[campoValor]);
    mapa[per] = (mapa[per] || 0) + v;
  });
  return mapa;
}
function gerarParcelasSemUltrapassarTeto(valorNovoDesconto, teto10PorCento, periodoInicial, mapaComprometido) {
  let restante = Math.max(0, parseMoney(valorNovoDesconto));
  const teto = Math.max(0, parseMoney(teto10PorCento));
  const parcelas = [];
  if (restante === 0 || teto === 0) {
    return { totalPeriodoAtual: Number((mapaComprometido[periodoInicial] || 0).toFixed(2)), parcelas, mapaComprometido };
  }
  let periodo = periodoInicial;
  while (restante > 0) {
    const ja = parseMoney(mapaComprometido[periodo] || 0);
    const livre = Math.max(0, teto - ja);
    if (livre > 0) {
      const parcela = Math.min(restante, livre);
      parcelas.push({ periodo, valor: Number(parcela.toFixed(2)) });
      mapaComprometido[periodo] = ja + parcela;
      restante = Number((restante - parcela).toFixed(2));
    }
    periodo = addMonth(periodo);
    if (parcelas.length > 240) break;
  }
  const totalPeriodoAtual = Number((mapaComprometido[periodoInicial] || 0).toFixed(2));
  return { totalPeriodoAtual, parcelas, mapaComprometido };
}

// ====== assinatura ======
function initSignaturePad(canvasId = "signature-pad") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) { console.error(`Canvas com ID "${canvasId}" não encontrado.`); return; }
  function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  signaturePad = new SignaturePad(canvas);
}

function getAssinaturaBase64() {
  if (signaturePad && !signaturePad.isEmpty()) return signaturePad.toDataURL("image/png");
  alert("A assinatura está vazia!"); return null;
}

function openModalAssinatura() {
  const descricao = $('#descricao').val().trim();
  const valor = parseMoney($('#valorEpi').val());
  const rdTipoDesconto = $('input[name="rdTipoDesconto"]:checked').val();
  const verbaNovoDesconto = $('#verbaNovoDesconto').val();

  if (!rdTipoDesconto) { toastMsg('Atenção', 'Preencha o campo Tipo de Desconto antes de prosseguir para a assinatura.', 'warning'); return; }
  if (!verbaNovoDesconto) { toastMsg('Atenção', 'Preencha o campo Verba antes de prosseguir para a assinatura.', 'warning'); return; }
  if (!descricao) { toastMsg('Atenção', 'Preencha o campo descrição antes de prosseguir para a assinatura.', 'warning'); return; }
  if (!valor || valor <= 0) { toastMsg('Atenção', 'Preencha o campo Valor total do desconto com um valor maior que zero.', 'warning'); return; }

  const input = document.getElementById('cameraInputPhotoEPI');
  const file = input?.files?.[0];
  if (!file) { toastMsg('Atenção', 'Adicione uma foto do funcionário antes de prosseguir para a assinatura.', 'warning'); return; }

  const codFilial = $('#codFilial').val();
  const matriculaFunc = $('#matriculaFunc').val();

  $('#revisaoFuncionario').html(`
    <div class="row">
        <div class="form-group col-md-6">
            <label for="filialNovoDesconto">Filial</label>
            <input type="text" name="filialNovoDesconto" id="filialNovoDesconto" value="${codFilial}" readonly class="form-control">
        </div>
        <div class="form-group col-md-6">
            <label for="matriculaNovoDesconto">Funcionário</label>
            <input type="text" name="matriculaNovoDesconto" id="matriculaNovoDesconto" value="${matriculaFunc}" readonly class="form-control">
        </div>
    </div>
    `);

  $('#revisaoEpis').html(`
    <div class="row">
        <div class="form-group col-md-6">
            <label for="descNovoDesconto">Descrição do Desconto</label>
            <input type="text" name="descNovoDesconto" id="descNovoDesconto" value="${(descricao || "").toUpperCase()}" readonly class="form-control">
        </div>
        <div class="form-group col-md-6">
            <label for="valorTotalNovoDesconto">Valor Total do Desconto</label>
            <input type="text" name="valorTotalNovoDesconto" id="valorTotalNovoDesconto" value="${valor.toFixed(2).replace('.', ',')}" readonly class="form-control">
        </div>
    </div>
    `);

  $('#revisaoTipoDesconto').html(`
    <div class="row">
        <div class="form-group col-md-6">
            <label for="tipoNovoDesconto">Tipo Desconto</label>
            <input type="text" name="tipoNovoDesconto" id="tipoNovoDesconto" value="${(rdTipoDesconto || "").toUpperCase()}" readonly class="form-control">
        </div>
        <div class="form-group col-md-6">
            <label for="verbaNovoDesconto">Verba Desconto</label>
            <input type="text" name="verbaNovoDesconto" id="verbaNovoDesconto" value="${verbaNovoDesconto}" readonly class="form-control">
        </div>
    </div>
    `);

  const dezPorCentroSalario = document.getElementById("dezPorCentroSalario")?.innerText || "";
  const periodoAtual = '202506';

  const constraintsIncidencias = [];
  constraintsIncidencias.push(DatasetFactory.createConstraint("filial", codFilial, codFilial, ConstraintType.MUST));
  constraintsIncidencias.push(DatasetFactory.createConstraint("matricula", matriculaFunc, matriculaFunc, ConstraintType.MUST));
  const datasetIncidencias = DatasetFactory.getDataset("ds_consultaIncidenciasFuncionario", null, constraintsIncidencias, null);

  console.log('datasetIncidencias:', datasetIncidencias);

  const mapaComprometido = somaPorPeriodo(datasetIncidencias?.values, 'codPeriodo', 'valor');

  console.log('mapaComprometido:', mapaComprometido);

  const { totalPeriodoAtual, parcelas } = gerarParcelasSemUltrapassarTeto(
    valor,
    parseMoney(dezPorCentroSalario),
    periodoAtual,
    mapaComprometido
  );

  console.log('Valor novo desconto:', valor);
  console.log('Teto 10% (parseado):', parseMoney(dezPorCentroSalario));
  console.log(`Total do período atual (${periodoAtual}): R$ ${totalPeriodoAtual.toFixed(2)}`);
  console.table(parcelas);

  const tabelaParcelasHtml = (() => {
    let total = 0;
    const linhas = (parcelas || []).map((p, i) => {
      total += Number(p.valor || 0);
      return `
      <tr>
        <td style="width:140px">
          <input type="text" class="form-control" name="parcelas[${i}][periodo]" value="${p.periodo}" readonly>
        </td>
        <td style="width:180px">
          <input type="text" class="form-control text-right" name="parcelas[${i}][valor]" value="${p.valor.toFixed(2).replace('.', ',')}" readonly>
        </td>
      </tr>
    `;
    }).join('');

    return `
    <div class="table-responsive">
      <table class="table table-sm table-striped mb-0">
        <thead>
          <tr>
            <th>Período</th>
            <th>Valor da Parcela (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${linhas || `<tr><td colspan="2" class="text-center">Sem parcelas</td></tr>`}
        </tbody>
        <tfoot>
          <tr>
            <th>Total</th>
            <th>
              <input type="text" class="form-control text-right" name="parcelas_total" value="${total.toFixed(2).replace('.', ',')}" readonly>
            </th>
          </tr>
        </tfoot>
      </table>
    </div>
    <input type="hidden" name="parcelas_qtd" value="${parcelas?.length || 0}">
  `;
  })();

  $('#revisaoParcelas').html(tabelaParcelasHtml);

  // MOSTRA O MODAL ANTES de inicializar os pads
  $('#modalAssinatura').show();

  // após o modal estar visível, inicializa e faz o resize dos canvases
  setTimeout(() => {
    // funcionário (sempre visível)
    if (!pads['signature-pad-func']) initPad('signature-pad-func');
    resizePadNow('signature-pad-func');

    // alternância recusa -> testemunhas (inicializa e resiza se necessário)
    onToggleRecusa();
  }, 0);

}

function fecharModalAssinatura() { $('#modalAssinatura').hide(); }
function clearModalAssinatura() { if (signaturePad) signaturePad.clear(); }

// ===== múltiplos signature pads =====
const pads = {}; // { idCanvas: SignaturePad }

function initPad(idCanvas) {
  const canvas = document.getElementById(idCanvas);
  if (!canvas) return;
  // ajusta resolução
  const resize = () => {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
  };
  resize(); window.addEventListener('resize', resize);

  pads[idCanvas] = new SignaturePad(canvas, { penColor: '#000' });
}
function clearPad(idCanvas) { pads[idCanvas]?.clear(); }
function getPadBase64(idCanvas) {
  const pad = pads[idCanvas];
  if (!pad || pad.isEmpty()) return null;
  return pad.toDataURL("image/png");
}

// alternância funcionário x recusa
function onToggleRecusa() {
  const v = document.querySelector('input[name="recusaAssinatura"]:checked')?.value || 'nao';
  const showRecusa = v === 'sim';

  $('#blocoAssinaturaFuncionario').toggle(!showRecusa);
  $('#blocoTestemunhas').toggle(showRecusa);
  $('#blocoMotivoRecusa').toggle(showRecusa);

  if (showRecusa) {
    // Inicializa se ainda não existirem
    if (!pads['signature-pad-test1']) initPad('signature-pad-test1');
    if (!pads['signature-pad-test2']) initPad('signature-pad-test2');

    // Dá um tick pro layout aplicar o display e então recalcular o tamanho do canvas
    setTimeout(() => {
      resizePadNow('signature-pad-test1');
      resizePadNow('signature-pad-test2');
    }, 0);
  }
}


// inicializa pads ao abrir o modal 
function initPadsConfirmacao() {
  // funcionário sempre visível
  if (!pads['signature-pad-func']) initPad('signature-pad-func');
  onToggleRecusa();
}


// util: lê arquivo input file em base64 (promessa)
function fileToBase64(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

// coleta tudo para enviar ao backend
async function coletarConfirmacao() {
  const recusa = (document.querySelector('input[name="recusaAssinatura"]:checked')?.value === 'sim');

  if (!recusa) {
    const assinaturaFunc = getPadBase64('signature-pad-func');
    return {
      tipoConfirmacao: 'ASSINATURA_FUNC',
      motivoRecusa: null,
      assinaturaFuncionarioBase64: assinaturaFunc, // pode ser null → valide antes de enviar
      testemunhas: [],
      evidenciasExtras: []
    };
  }

  // recusa: validar testemunhas
  const t1 = {
    nome: $('#test1_nome').val()?.trim() || '',
    cpf: $('#test1_cpf').val()?.trim() || '',
    cargo: $('#test1_cargo').val()?.trim() || '',
    assinaturaBase64: getPadBase64('signature-pad-test1'),
    fotoBase64: await fileToBase64(document.getElementById('test1_foto')?.files?.[0] || null)
  };
  const t2 = {
    nome: $('#test2_nome').val()?.trim() || '',
    cpf: $('#test2_cpf').val()?.trim() || '',
    cargo: $('#test2_cargo').val()?.trim() || '',
    assinaturaBase64: getPadBase64('signature-pad-test2'),
    fotoBase64: await fileToBase64(document.getElementById('test2_foto')?.files?.[0] || null)
  };

  // evidências extras (múltiplos)
  const extras = [];
  const files = document.getElementById('evidenciasExtras')?.files || [];
  for (let i = 0; i < files.length; i++) {
    extras.push(await fileToBase64(files[i]));
  }

  return {
    tipoConfirmacao: 'RECUSA_TESTEMUNHAS',
    motivoRecusa: ($('#motivoRecusa').val() || '').trim(),
    assinaturaFuncionarioBase64: null,
    testemunhas: [t1, t2],
    evidenciasExtras: extras
  };
}

function resizePadNow(idCanvas) {
  const canvas = document.getElementById(idCanvas);
  if (!canvas) return;
  const ratio = Math.max(window.devicePixelRatio || 1, 1);

  // se ainda estiver 0 (por algum CSS), define um tamanho padrão
  const w = canvas.offsetWidth || 600;
  const h = canvas.offsetHeight || 120;

  canvas.width = w * ratio;
  canvas.height = h * ratio;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
