function servicetask9(attempt, message) {
    try {
        log.info('INTEGRAÇÃO PROTHEUS - Lançamento de Descontos');

        // --- 1. Dados do processo ---
        var codFilial    = (hAPI.getCardValue('codFilial') + '').trim();
        var empresa      = obterEmpresa(codFilial);
        var matricula    = (hAPI.getCardValue('matriculaColaborador') + '').trim();
        var codVerba     = (hAPI.getCardValue('codVerba') + '').trim();
        var tipoDesconto = (hAPI.getCardValue('tipoDesconto') + '').split(' - ')[0].trim();
        var tipoVerba    = (hAPI.getCardValue('tipoVerba') + '').split(' - ')[0].trim();
        var anoAtual = new Date().getFullYear();
        var mesAtual = new Date().getMonth() + 1;
        var periodoAtual = String(anoAtual) + (mesAtual < 10 ? '0' : '') + mesAtual; // "202604"      
        
        log.info('periodoAtual: ' + periodoAtual);

        // Valor total do desconto — distribuirParcelas vai dividir pelos meses
        // automaticamente consultando o SRK010 e respeitando o limite de 15%.
        var valorEpi = parseMoney(hAPI.getCardValue('valorEpi'));
        if (valorEpi <= 0) throw new Error('Valor do desconto não informado (valorEpi=0).');
        var parcelas = [{ periodo: periodoAtual, valor: valorEpi }];
        log.info('Valor total a distribuir: R$' + valorEpi.toFixed(2) + ' a partir do periodo ' + periodoAtual);

        // --- 2. Limite de 15% do salário ---
        var salario15 = parseMoney(hAPI.getCardValue('salario15'));
        if (salario15 <= 0) salario15 = parseMoney(hAPI.getCardValue('salario')) * 0.15;
        if (salario15 <= 0) {
            // Fallback: reconstrói a partir dos campos gravados pelo formulário antigo
            // salario15 = margemDisponivel + valorDescontosAtivos
            var margem       = parseMoney(hAPI.getCardValue('margemDisponivel'));
            var descsAtivos  = parseMoney(hAPI.getCardValue('valorDescontosAtivos'));
            salario15 = margem + descsAtivos;
            if (salario15 > 0) log.info('salario15 recalculado via margem+descontos: ' + salario15);
        }
        if (salario15 <= 0) throw new Error(
            'Salário não informado. Impossível calcular o limite de 15%.' +
            ' [salario15=' + hAPI.getCardValue('salario15') +
            ', salario=' + hAPI.getCardValue('salario') +
            ', margemDisponivel=' + hAPI.getCardValue('margemDisponivel') +
            ', valorDescontosAtivos=' + hAPI.getCardValue('valorDescontosAtivos') + ']'
        );

        // --- 3. Distribuir parcelas respeitando o limite de 15% por mês ---
        var dist = distribuirParcelas(parcelas, salario15, codFilial, matricula, periodoAtual);
        log.info('Períodos futuros (inclui período atual): ' + safeJSONStringify(dist.futuro));

        // --- 4. Roteamento por tipo de verba ---
        // DP  → postDescontos (período atual/aberto)
        // Demais (frotas, TI, almoxarifado) → descontosFuturos
        var ehDP = tipoDesconto.toLowerCase() === 'dp';
        var statusOk = true;

        if (dist.futuro.length) {
            var basePayload = {
                empresa: empresa, filial: codFilial, matricula: matricula,
                verba: codVerba, tipoVerba: tipoVerba,
                documento: (getValue('WKNumProces') + ''),
                numFluig: (hAPI.getCardValue('solicitacao_fluig') + '').trim(),
                parcelas: dist.futuro,
                periodoRef: periodoAtual 
            };

            if (ehDP) {
                // DP: envia para postDescontos
                var r1 = integracaoProtheusInvoke('/rest/RESTRH/postDescontos', basePayload);
                statusOk = r1.ok;
                hAPI.setCardValue('integ_aberto_status', statusOk ? 'OK' : 'NOK');
                hAPI.setCardValue('integ_aberto_msg', r1.msg);
                hAPI.setCardValue('integ_aberto_payload', safeJSONStringify(basePayload));
                hAPI.setTaskComments(getValue('WKUser'), getValue('WKNumProces'), 0,
                    'DP - postDescontos: ' + (statusOk ? 'OK' : 'FALHA') + '. ' + r1.msg);
            } else {
                // Demais: envia para descontosFuturos
                basePayload.periodoRef = '';
                var r2 = integracaoProtheusInvoke('/rest/RESTRH/descontosFuturos', basePayload);
                if (!r2.ok && periodoFechado(r2.msg)) {
                    basePayload = avancarPeriodosPayload(basePayload);
                    log.warn('Período fechado (futuros). Reenviando com período avançado.');
                    r2 = integracaoProtheusInvoke('/rest/RESTRH/descontosFuturos', basePayload);
                }
                statusOk = r2.ok;
                hAPI.setCardValue('integ_futuro_status', statusOk ? 'OK' : 'NOK');
                hAPI.setCardValue('integ_futuro_msg', r2.msg);
                hAPI.setCardValue('integ_futuro_payload', safeJSONStringify(basePayload));
                hAPI.setTaskComments(getValue('WKUser'), getValue('WKNumProces'), 0,
                    'Períodos Futuros: ' + (statusOk ? 'OK' : 'FALHA') + '. ' + r2.msg);
            }
        }

        hAPI.setCardValue('statusIntegracao', statusOk ? 'OK' : 'NOK');

    } catch (error) {
        hAPI.setCardValue('statusIntegracao', 'NOK');
        log.warn('servicetask9 error: ' + error.message + ' (linha ' + error.lineNumber + ')');
        hAPI.setTaskComments(getValue('WKUser'), getValue('WKNumProces'), 0, 'Erro na integração: ' + error.message);
    }
}

// --- 5. Integração com o Protheus ---
function integracaoProtheusInvoke(endpointPath, jsonData) {
    var result = { ok: false, msg: '' };
    try {
        log.info('POST ' + endpointPath);
        log.dir(jsonData);

        var clientService = fluigAPI.getAuthorizeClientService();
        var envName = (fluigAPI.getTenantService().getTenantData(['envName']).get('envName') + '').trim();
        var serviceCodeName = resolveServiceCode(envName);

        var data = {
            companyId: String(fluigAPI.getSecurityService().getCurrentTenantId()),
            serviceCode: serviceCodeName,
            endpoint: endpointPath,
            method: 'POST',
            timeoutService: '1000',
            params: jsonData,
            options: {
                encoding: 'UTF-8',
                mediaType: 'application/json',
                useSSL: true
            }
        };

        var response = clientService.invoke(JSON.stringify(data));
        var resultStr = response && response.getResult ? response.getResult() : '';
        var parsed = {};
        
        if (resultStr) {
            try { parsed = JSON.parse(resultStr); } catch (e) { parsed = {}; }
        }

        var ok = parsed && parsed.status === 'success';
        result.ok = ok;
        result.msg = parsed && parsed.msg ? parsed.msg : (ok ? 'OK' : 'Falha ao integrar.');

        return result;
    } catch (e) {
        log.warn('Erro integração: ' + e.message);
        result.ok = false;
        result.msg = e.message || 'Erro inesperado.';
        return result;
    }
}

// --- 6. Funções auxiliares ---
function resolveServiceCode(envName) {
    if (envName === 'PRODUCAO') return 'API_RESTRH';
    if (envName === 'TESTE') return 'REST_PROTHEUS_TST';
    return 'API_RESTRH';
}

function valorOuPadrao(v, def) {
    v = (v === null || v === undefined) ? '' : (v + '');
    v = v.trim();
    return v ? v : def;
}

function obterEmpresa(cFilial) {
    cFilial = (cFilial || '') + '';
    if (cFilial.length >= 2) return cFilial.substring(0, 2);
    return '01';
}

function parseMoney(v) {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    var s = (v + '').trim();
    if (!s) return 0;
    s = s.replace(/[^\d.,-]/g, '');
    var hasComma = s.indexOf(',') !== -1;
    var hasDot = s.indexOf('.') !== -1;
    if (hasComma && hasDot) {
        s = s.replace(/\./g, '').replace(',', '.');
    } else if (hasComma && !hasDot) {
        s = s.replace(',', '.');
    }
    var n = Number(s);
    return isFinite(n) ? n : 0;
}

function parseParcelas(jsonStr) {
    var arr = [];
    if (!jsonStr) return arr;
    try {
        var tmp = JSON.parse(jsonStr);
        if (Object.prototype.toString.call(tmp) === '[object Array]') {
            for (var i = 0; i < tmp.length; i++) {
                var p = tmp[i] || {};
                var periodo = (((p.periodo === null || p.periodo === undefined) ? '' : p.periodo) + '').trim();
                var v = parseMoney(p.valor);
                if (periodo && isFinite(v) && v > 0) {
                    arr.push({ periodo: periodo, valor: Number(v.toFixed(2)) });
                }
            }
        }
    } catch (e) {
        log.warn('parseParcelas: JSON inválido. value=' + jsonStr);
    }
    return arr;
}

function safeJSONStringify(obj) {
    try { return JSON.stringify(obj); } catch (e) { return ''; }
}

function proximoPeriodo(periodo) {
    var s = (periodo + '').trim();
    if (s.length !== 6) return s;
    var ano = parseInt(s.substring(0, 4), 10);
    var mes = parseInt(s.substring(4, 6), 10);
    mes++;
    if (mes > 12) { mes = 1; ano++; }
    return String(ano) + (mes < 10 ? '0' : '') + String(mes);
}

function avancarPeriodosPayload(payload) {
    var novo = {};
    for (var k in payload) {
        if (Object.prototype.hasOwnProperty.call(payload, k)) novo[k] = payload[k];
    }
    if (novo.periodoRef) {
        novo.periodoRef = proximoPeriodo(novo.periodoRef);
    }
    if (novo.parcelas && novo.parcelas.length > 0) {
        var ps = [];
        for (var i = 0; i < novo.parcelas.length; i++) {
            ps.push({ periodo: proximoPeriodo(novo.parcelas[i].periodo), valor: novo.parcelas[i].valor });
        }
        novo.parcelas = ps;
    }
    return novo;
}

// ================================================================
//  REGRA DOS 15%
//
//  O desconto de um funcionário em um mês não pode ultrapassar
//  15% do salário. Se o mês estiver cheio, o excedente é jogado
//  automaticamente para o mês seguinte, e assim por diante.
// ================================================================

// Verbas do DP que ficam fora do limite de 15% (faltas, DSR, etc.)
var VERBAS_FORA_LIMITE = { '440': 1, '445': 1, '520': 1, '518': 1, '521': 1, '570': 1, '571': 1 };

// ----------------------------------------------------------------
//  distribuirParcelas
//
//  Recebe as parcelas solicitadas e as distribui respeitando o
//  limite de 15% por mês. TODOS os itens vão para a lista "futuro"
//  (inclusive o período atual), pois o envio é feito sempre via
//
//  Se o período atual atingir 15%, o excedente é parcelado
//  automaticamente para o mês seguinte, e assim por diante.
//
//  Consulta RGB010 e SRK010 em tempo real ANTES de montar o
//  payload — garantia de que o estado real do Protheus é usado,
//  mesmo quando dois chamados são abertos antes de qualquer envio.
// ----------------------------------------------------------------
function distribuirParcelas(parcelas, salario15, filial, matricula, periodoAtual) {
    var ocupado = carregarOcupacaoPorPeriodo(filial, matricula, periodoAtual);
    var futuro  = [];

    for (var i = 0; i < parcelas.length; i++) {
        var restante  = parcelas[i].valor;
        var periodo   = parcelas[i].periodo;
        var seguranca = 60; // máximo 60 meses de avanço (evita loop infinito)

        while (restante > 0.005 && seguranca-- > 0) {
            var disponivel = Math.max(0, salario15 - (ocupado[periodo] || 0));
            var aEnviar    = Math.min(restante, disponivel);

            if (aEnviar > 0.005) {
                var item = { periodo: periodo, valor: Number(aEnviar.toFixed(2)) };
                futuro.push(item);
                ocupado[periodo] = (ocupado[periodo] || 0) + aEnviar;
                restante = Number((restante - aEnviar).toFixed(2));
            }

            if (restante > 0.005) periodo = proximoPeriodo(periodo);
        }
    }

    return { aberto: [], futuro: futuro };
}

// ----------------------------------------------------------------
//  carregarOcupacaoPorPeriodo
//
//  Retorna { "YYYYMM": totalJáOcupado, ... } consultando o SRK010
//  via DatasetFactory.
//
//  ds_consultaLancFuturosFuncionario retorna colunas nesta ordem:
//    0: codFilial   1: codProcesso   2: matricula   3: codVerba
//    4: descVerba   5: dtVencimento  6: valor
//
//  No Fluig (Rhino), ds.values[j] é java.lang.Object[] → acesso
//  obrigatório por índice numérico + '' + para converter para JS string.
// ----------------------------------------------------------------
function carregarOcupacaoPorPeriodo(filial, matricula, periodoAtual) {
    var ocupado = {};
    try {
        var c = [
            DatasetFactory.createConstraint('filial',       filial,       filial,       ConstraintType.MUST),
            DatasetFactory.createConstraint('matricula',    matricula,    matricula,    ConstraintType.MUST),
            DatasetFactory.createConstraint('periodoAtual', periodoAtual, periodoAtual, ConstraintType.MUST)
        ];
        var ds = DatasetFactory.getDataset('ds_consultaLancFuturosFuncionario', null, c, null);

        var rowCount = (ds && ds.values) ? ds.values.length : 0;
        log.info('[SRK010] rowCount=' + rowCount);

        for (var j = 0; j < rowCount; j++) {
            var row    = ds.values[j];
            // Índices fixos pela ordem das colunas do SELECT no dataset
            var verba  = ('' + row[3]).trim(); // codVerba  (RK_PD)
            var dtVenc = ('' + row[5]).trim(); // dtVencimento (RK_DTVENC)
            var vValor = ('' + row[6]).trim(); // valor (RK_VALORTO)

            log.info('[SRK010] row[' + j + '] verba=' + verba + ' dtVenc=' + dtVenc + ' valor=' + vValor);

            if (dtVenc.length >= 6 && !VERBAS_FORA_LIMITE[verba]) {
                var per = '' + dtVenc.substring(0, 6);
                ocupado[per] = (ocupado[per] || 0) + parseMoney(vValor);
                log.info('[SRK010] ocupado[' + per + '] = ' + ocupado[per]);
            }
        }
    } catch (e) {
        log.warn('carregarOcupacaoPorPeriodo: ' + e.message);
    }

    log.info('[ocupado por periodo] ' + safeJSONStringify(ocupado));
    return ocupado;
}

// Retorna true se o Protheus recusou por período já fechado
function periodoFechado(msg) {
    return msg && (msg.indexOf('PERISCLOSE') !== -1 || msg.indexOf('REGNOIS') !== -1);
}
