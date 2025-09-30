function servicetask9(attempt, message) {
    try {
        log.info('INTEGRAÇÃO PROTHEUS - Lançamento de Descontos - servicetask9');

        // ---------- Coleta de campos ----------
        var codFilial = (hAPI.getCardValue('codFilial') + '').trim();
        var empresa = obterEmpresa(codFilial);
        var matricula = (hAPI.getCardValue('matriculaColaborador') + '').trim();
        var roteiro = valorOuPadrao(hAPI.getCardValue('roteiro'), 'FOL');
        var numpagto = valorOuPadrao(hAPI.getCardValue('numpagto'), '01');
        var codVerba = (hAPI.getCardValue('codVerba') + '').trim();
        var tipo1 = 'D'; // desconto
        var periodoForm = (hAPI.getCardValue('periodoAtual') + '').trim(); // espelho do período atual exibido
        var parcelas = parseParcelas((hAPI.getCardValue('parcelas_json') + '').trim());

        if (!parcelas || parcelas.length === 0) {
            throw new Error('Não há parcelas a enviar.');
        }

        // ---------- Divide em "aberto" (primeira parcela) e "futuras" (demais) ----------
        var primeiraParcela = parcelas[0];
        // periodoRef do aberto = período da primeira parcela; se vazio, tenta do form
        var periodoRefAberto = (primeiraParcela && primeiraParcela.periodo) ? (primeiraParcela.periodo + '').trim() : (periodoForm || '');
        if (!periodoRefAberto) {
            throw new Error('Período da primeira parcela não informado.');
        }

        var payloadAberto = {
            empresa: empresa,
            filial: codFilial,
            matricula: matricula,
            roteiro: roteiro,
            numpagto: numpagto,
            periodoRef: periodoRefAberto,
            verba: codVerba,
            tipo1: tipo1,
            parcelas: [primeiraParcela] // apenas 1
        };

        // Futuras = todas as parcelas cujo período seja diferente do aberto (e valor > 0)
        var restantes = [];
        for (var i = 1; i < parcelas.length; i++) {
            var p = parcelas[i] || {};
            var per = (p.periodo + '').trim();
            var val = parseMoney(p.valor);
            if (per && isFinite(val) && val > 0 && per !== periodoRefAberto) {
                restantes.push({ periodo: per, valor: Number(val.toFixed(2)) });
            }
        }

        var payloadFuturo = null;
        if (restantes.length > 0) {
            payloadFuturo = {
                empresa: empresa,
                filial: codFilial,
                matricula: matricula,
                periodoRef: periodoRefAberto, // usado pelo serviço para filtrar e excluir o período aberto
                verba: codVerba,
                // documento é opcional; se quiser, pode usar o número do processo:
                documento: (getValue('WKNumProces') + ''),
                parcelas: restantes
            };
        }

        // ---------- Idempotência: checa se já integrou com sucesso ----------
        // Campos de status e payload salvos no formulário
        var stAberto = (hAPI.getCardValue('integ_aberto_status') + '').trim();   // "OK" | "NOK" | ""
        var stFuturo = (hAPI.getCardValue('integ_futuro_status') + '').trim();   // "OK" | "NOK" | ""
        var plAbertoS = (hAPI.getCardValue('integ_aberto_payload') + '');         // json string
        var plFuturoS = (hAPI.getCardValue('integ_futuro_payload') + '');         // json string

        var plAbertoNow = safeJSONStringify(payloadAberto);
        var plFuturoNow = payloadFuturo ? safeJSONStringify(payloadFuturo) : '';

        // Não reenvia se já deu OK anteriormente com qualquer payload.
        // Se quiser reprocessar quando payload mudou, troque a lógica conforme sua política.
        var deveEnviarAberto = (stAberto !== 'OK');
        var deveEnviarFuturo = (!!payloadFuturo && stFuturo !== 'OK');

        // ---------- Envia abertas ----------
        var okAberto = false;
        var msgAberto = '';
        if (deveEnviarAberto) {
            var r1 = integracaoProtheusInvoke('/rest/RESTRH/postDescontos', payloadAberto);
            okAberto = r1.ok;
            msgAberto = r1.msg;
            hAPI.setCardValue('integ_aberto_status', okAberto ? 'OK' : 'NOK');
            hAPI.setCardValue('integ_aberto_msg', msgAberto);
            hAPI.setCardValue('integ_aberto_payload', plAbertoNow);

            if (okAberto) {
                hAPI.setTaskComments(getValue('WKUser'), getValue('WKNumProces'), 0, 'Aberto (GPEA580): OK. ' + (msgAberto || ''));
            } else {
                hAPI.setTaskComments(getValue('WKUser'), getValue('WKNumProces'), 0, 'Aberto (GPEA580): FALHA. ' + (msgAberto || ''));
            }
        } else {
            log.info('servicetask9: Aberto já OK anteriormente. Não reenviado.');
        }

        // ---------- Envia futuras ----------
        var okFuturo = false;
        var msgFuturo = '';
        if (deveEnviarFuturo) {
            var r2 = integracaoProtheusInvoke('/rest/RESTRH/descontosFuturos', payloadFuturo);
            okFuturo = r2.ok;
            msgFuturo = r2.msg;
            hAPI.setCardValue('integ_futuro_status', okFuturo ? 'OK' : 'NOK');
            hAPI.setCardValue('integ_futuro_msg', msgFuturo);
            hAPI.setCardValue('integ_futuro_payload', plFuturoNow);

            if (okFuturo) {
                hAPI.setTaskComments(getValue('WKUser'), getValue('WKNumProces'), 0, 'Futuro (GPEA110): OK. ' + (msgFuturo || ''));
            } else {
                hAPI.setTaskComments(getValue('WKUser'), getValue('WKNumProces'), 0, 'Futuro (GPEA110): FALHA. ' + (msgFuturo || ''));
            }
        } else if (payloadFuturo) {
            log.info('servicetask9: Futuro já OK anteriormente. Não reenviado.');
        } else {
            log.info('servicetask9: Não há parcelas futuras para enviar.');
        }

        // ---------- Status geral ----------
        // Se existir parcelas futuras, considera OK somente se ambos OK.
        // Se não existir, considera OK apenas se aberto OK.
        var statusGeralOK = false;
        if (payloadFuturo) {
            statusGeralOK = ((stAberto === 'OK' || okAberto) && (stFuturo === 'OK' || okFuturo));
        } else {
            statusGeralOK = (stAberto === 'OK' || okAberto);
        }
        hAPI.setCardValue('statusIntegracao', statusGeralOK ? 'OK' : 'NOK');

    } catch (error) {
        hAPI.setCardValue('statusIntegracao', 'NOK');
        log.warn('servicetask9 error: ' + error);
        log.warn('servicetask9 error.message: ' + error.message);
        log.warn('servicetask9 error.lineNumber: ' + error.lineNumber);
        hAPI.setTaskComments(getValue('WKUser'), getValue('WKNumProces'), 0, 'Erro na integração: ' + error.message);
    }
}

/* =========================================================
 * Chamada REST centralizada (idempotência controlada por campos)
 * ========================================================= */
function integracaoProtheusInvoke(endpointPath, jsonData) {
    var result = { ok: false, msg: '' };
    try {
        log.info('servicetask9 → POST ' + endpointPath);
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
        log.info('servicetask9 response raw: ' + response);

        var resultStr = response && response.getResult ? response.getResult() : '';
        log.info('servicetask9 response.getResult(): ' + resultStr);

        var parsed = {};
        if (resultStr) {
            try { parsed = JSON.parse(resultStr); } catch (e) { parsed = {}; }
        }

        var ok = parsed && parsed.status === 'success';
        result.ok = ok;
        result.msg = parsed && parsed.msg ? parsed.msg : (ok ? 'OK' : 'Falha ao integrar.');

        return result;
    } catch (e) {
        log.warn('integracaoProtheusInvoke error: ' + e.message);
        result.ok = false;
        result.msg = e.message || 'Erro inesperado.';
        return result;
    }
}

/* =========================================================
 * Helpers ES5
 * ========================================================= */

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

// Converte dinheiro/strings PT-BR "1.234,56" para Number 1234.56
function parseMoney(v) {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    var s = (v + '').trim();
    if (!s) return 0;
    s = s.replace(/[^\d.,-]/g, ''); // mantém dígito, ponto, vírgula e sinal
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

