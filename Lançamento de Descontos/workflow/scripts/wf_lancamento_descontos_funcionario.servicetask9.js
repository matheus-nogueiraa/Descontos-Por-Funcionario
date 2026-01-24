function servicetask9(attempt, message) {
    try {
        log.info('INTEGRAÇÃO PROTHEUS - Lançamento de Descontos');

        var codFilial = (hAPI.getCardValue('codFilial') + '').trim();
        var empresa = obterEmpresa(codFilial);
        var matricula = (hAPI.getCardValue('matriculaColaborador') + '').trim();
        var roteiro = valorOuPadrao(hAPI.getCardValue('roteiro'), 'FOL');
        var numpagto = valorOuPadrao(hAPI.getCardValue('numpagto'), '01');
        var codVerba = (hAPI.getCardValue('codVerba') + '').trim();
        var tipoVerba = (hAPI.getCardValue('tipoVerba') + '').split(' - ')[0].trim();
        var tipo1 = 'D';
        var periodoForm = (hAPI.getCardValue('periodoAtual') + '').trim();
        var parcelas = parseParcelas((hAPI.getCardValue('parcelas_json') + '').trim());
        
        var margemDisponivelRaw = (hAPI.getCardValue('margemDisponivel') + '').trim();
        var valorDescontosAtivosRaw = (hAPI.getCardValue('valorDescontosAtivos') + '').trim();
        var salarioRaw = (hAPI.getCardValue('salario') + '').trim();
        var salario15Raw = (hAPI.getCardValue('salario15') + '').trim();
        
        var margemDisponivel = parseMoney(margemDisponivelRaw);
        var valorDescontosAtivos = parseMoney(valorDescontosAtivosRaw);
        
        // Fallback: calcula margem a partir do salário se não vier do front
        if (margemDisponivelRaw === 'null' || margemDisponivelRaw === '' || margemDisponivel === 0) {
            var salario = parseMoney(salarioRaw);
            var salario15 = parseMoney(salario15Raw);
            
            if (salario15 > 0) {
                margemDisponivel = salario15 - valorDescontosAtivos;
            } else if (salario > 0) {
                margemDisponivel = (salario * 0.15) - valorDescontosAtivos;
            }
            
            if (margemDisponivel < 0) margemDisponivel = 0;
            log.warn('Margem calculada via fallback: ' + margemDisponivel);
        }

        if (!parcelas || parcelas.length === 0) {
            throw new Error('Não há parcelas a enviar.');
        }

        var totalLancamento = 0;
        for (var i = 0; i < parcelas.length; i++) {
            var p = parcelas[i] || {};
            var val = parseMoney(p.valor);
            if (isFinite(val) && val > 0) {
                totalLancamento += val;
            }
        }
        
        log.info('Total: ' + totalLancamento + ' | Margem: ' + margemDisponivel);

        // Divisão baseada na margem de 15% do salário
        var payloadAberto = null;
        var payloadFuturo = null;
        var valorParaAtual = 0;
        var valorParaFuturos = 0;
        
        if (margemDisponivel >= totalLancamento) {
            valorParaAtual = totalLancamento;
            valorParaFuturos = 0;
        } else if (margemDisponivel > 0) {
            valorParaAtual = margemDisponivel;
            valorParaFuturos = totalLancamento - margemDisponivel;
        } else {
            valorParaAtual = 0;
            valorParaFuturos = totalLancamento;
        }
        
        log.info('Divisão -> Atual: ' + valorParaAtual + ' | Futuros: ' + valorParaFuturos);
        
        // Construir payload para período atual
        if (valorParaAtual > 0) {
            var primeiraParcela = parcelas[0];
            var periodoRefAberto = (primeiraParcela && primeiraParcela.periodo) ? (primeiraParcela.periodo + '').trim() : (periodoForm || '');
            if (!periodoRefAberto) {
                throw new Error('Período da primeira parcela não informado.');
            }

            if (valorParaFuturos === 0) {
                var todasParcelasAtual = [];
                for (var i = 0; i < parcelas.length; i++) {
                    var p = parcelas[i] || {};
                    var per = (p.periodo + '').trim();
                    var val = parseMoney(p.valor);
                    if (per && isFinite(val) && val > 0) {
                        todasParcelasAtual.push({
                            periodo: per,
                            valor: Number(val.toFixed(2))
                        });
                    }
                }
                
                payloadAberto = {
                    empresa: empresa,
                    filial: codFilial,
                    matricula: matricula,
                    roteiro: roteiro,
                    numpagto: numpagto,
                    periodoRef: periodoRefAberto,
                    verba: codVerba,
                    tipoVerba: tipoVerba,
                    tipo1: tipo1,
                    parcelas: todasParcelasAtual
                };
            } else {
                payloadAberto = {
                    empresa: empresa,
                    filial: codFilial,
                    matricula: matricula,
                    roteiro: roteiro,
                    numpagto: numpagto,
                    periodoRef: periodoRefAberto,
                    verba: codVerba,
                    tipoVerba: tipoVerba,
                    tipo1: tipo1,
                    parcelas: [{
                        periodo: periodoRefAberto,
                        valor: Number(valorParaAtual.toFixed(2))
                    }]
                };
            }
        }

        // Construir payload para períodos futuros
        if (valorParaFuturos > 0) {
            var parcelasFuturas = [];
            var primeiraParcela = parcelas[0];
            var valorPrimeiraOriginal = parseMoney(primeiraParcela.valor);
            var periodoRefAberto = (primeiraParcela && primeiraParcela.periodo) ? (primeiraParcela.periodo + '').trim() : (periodoForm || '');
            
            if (valorParaAtual === 0) {
                for (var i = 0; i < parcelas.length; i++) {
                    var p = parcelas[i] || {};
                    var per = (p.periodo + '').trim();
                    var val = parseMoney(p.valor);
                    if (per && isFinite(val) && val > 0) {
                        parcelasFuturas.push({
                            periodo: per,
                            valor: Number(val.toFixed(2))
                        });
                    }
                }
            } else {
                var restoPrimeira = valorPrimeiraOriginal - valorParaAtual;
                if (restoPrimeira > 0) {
                    parcelasFuturas.push({
                        periodo: periodoRefAberto,
                        valor: Number(restoPrimeira.toFixed(2))
                    });
                }
                
                for (var i = 1; i < parcelas.length; i++) {
                    var p = parcelas[i] || {};
                    var per = (p.periodo + '').trim();
                    var val = parseMoney(p.valor);
                    if (per && isFinite(val) && val > 0) {
                        parcelasFuturas.push({
                            periodo: per,
                            valor: Number(val.toFixed(2))
                        });
                    }
                }
            }
            
            if (parcelasFuturas.length > 0) {
                payloadFuturo = {
                    empresa: empresa,
                    filial: codFilial,
                    matricula: matricula,
                    periodoRef: periodoForm,
                    verba: codVerba,
                    tipoVerba: tipoVerba,
                    documento: (getValue('WKNumProces') + ''),
                    parcelas: parcelasFuturas
                };
            }
        }

        // Idempotência
        var stAberto = (hAPI.getCardValue('integ_aberto_status') + '').trim();
        var stFuturo = (hAPI.getCardValue('integ_futuro_status') + '').trim();
        var deveEnviarAberto = (!!payloadAberto && stAberto !== 'OK');
        var deveEnviarFuturo = (!!payloadFuturo && stFuturo !== 'OK');

        var okAberto = false;
        var msgAberto = '';
        
        if (deveEnviarAberto) {
            var r1 = integracaoProtheusInvoke('/rest/RESTRH/postDescontos', payloadAberto);
            okAberto = r1.ok;
            msgAberto = r1.msg;
            hAPI.setCardValue('integ_aberto_status', okAberto ? 'OK' : 'NOK');
            hAPI.setCardValue('integ_aberto_msg', msgAberto);
            hAPI.setCardValue('integ_aberto_payload', safeJSONStringify(payloadAberto));
            hAPI.setTaskComments(getValue('WKUser'), getValue('WKNumProces'), 0, 
                'Período Atual (GPEA580): ' + (okAberto ? 'OK' : 'FALHA') + '. ' + msgAberto);
        } else {
            okAberto = true;
        }

        var okFuturo = false;
        var msgFuturo = '';
        
        if (deveEnviarFuturo) {
            var r2 = integracaoProtheusInvoke('/rest/RESTRH/descontosFuturos', payloadFuturo);
            okFuturo = r2.ok;
            msgFuturo = r2.msg;
            hAPI.setCardValue('integ_futuro_status', okFuturo ? 'OK' : 'NOK');
            hAPI.setCardValue('integ_futuro_msg', msgFuturo);
            hAPI.setCardValue('integ_futuro_payload', safeJSONStringify(payloadFuturo));
            hAPI.setTaskComments(getValue('WKUser'), getValue('WKNumProces'), 0, 
                'Períodos Futuros (GPEA110): ' + (okFuturo ? 'OK' : 'FALHA') + '. ' + msgFuturo);
        }

        var statusGeralOK = payloadFuturo 
            ? ((stAberto === 'OK' || okAberto) && (stFuturo === 'OK' || okFuturo)) 
            : (stAberto === 'OK' || okAberto);
        
        hAPI.setCardValue('statusIntegracao', statusGeralOK ? 'OK' : 'NOK');

    } catch (error) {
        hAPI.setCardValue('statusIntegracao', 'NOK');
        log.warn('servicetask9 error: ' + error);
        log.warn('servicetask9 error.message: ' + error.message);
        log.warn('servicetask9 error.lineNumber: ' + error.lineNumber);
        hAPI.setTaskComments(getValue('WKUser'), getValue('WKNumProces'), 0, 'Erro na integração: ' + error.message);
    }
}

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

