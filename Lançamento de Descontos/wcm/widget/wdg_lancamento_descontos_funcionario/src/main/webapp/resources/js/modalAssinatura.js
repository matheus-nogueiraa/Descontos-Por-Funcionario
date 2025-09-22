let signaturePad;

// ====== utils ======
function parseNumberBR(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  let s = String(v).trim();
  if (!s) return 0;
  s = s.replace(/[^\d,.\-]/g, '');        // remove "R$", espaços, etc.
  if (!s) return 0;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return isFinite(n) ? n : 0;
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
    const v = parseNumberBR(row[campoValor]);
    mapa[per] = (mapa[per] || 0) + v;
  });
  return mapa;
}
function gerarParcelasSemUltrapassarTeto(valorNovoDesconto, teto10PorCento, periodoInicial, mapaComprometido) {
  let restante = Math.max(0, parseNumberBR(valorNovoDesconto));
  const teto = Math.max(0, parseNumberBR(teto10PorCento));
  const parcelas = [];
  if (restante === 0 || teto === 0) {
    return { totalPeriodoAtual: Number((mapaComprometido[periodoInicial] || 0).toFixed(2)), parcelas, mapaComprometido };
  }
  let periodo = periodoInicial;
  while (restante > 0) {
    const ja = parseNumberBR(mapaComprometido[periodo] || 0);
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
  const valor = parseNumberBR($('#valorEpi').val());
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

  initSignaturePad();

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
    parseNumberBR(dezPorCentroSalario),
    periodoAtual,
    mapaComprometido
  );

  console.log('Valor novo desconto:', valor);
  console.log('Teto 10% (parseado):', parseNumberBR(dezPorCentroSalario));
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

  $('#modalAssinatura').show();
  setTimeout(() => { initSignaturePad(); }, 300);
}

function fecharModalAssinatura() { $('#modalAssinatura').hide(); }
function clearModalAssinatura() { if (signaturePad) signaturePad.clear(); }
