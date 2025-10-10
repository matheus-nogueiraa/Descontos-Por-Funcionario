function parseDateTimeES5(dateStr, timeStr) {
    dateStr = (dateStr || "").trim();
    timeStr = (timeStr || "").trim();

    // Hora padrão se vier vazia
    if (!timeStr) timeStr = "00:00:00";

    // Normaliza hora para HH:MM:SS
    var hParts = timeStr.split(":");
    var h = parseInt(hParts[0], 10) || 0;
    var m = parseInt(hParts[1], 10) || 0;
    var s = parseInt(hParts[2], 10) || 0;

    var y, mo, d;

    // yyyy-mm-dd
    if (dateStr.indexOf("-") !== -1) {
        var dParts = dateStr.split("-");
        y = parseInt(dParts[0], 10);
        mo = parseInt(dParts[1], 10);
        d = parseInt(dParts[2], 10);
    }
    // dd/mm/yyyy (fallback)
    else if (dateStr.indexOf("/") !== -1) {
        var dParts2 = dateStr.split("/");
        d = parseInt(dParts2[0], 10);
        mo = parseInt(dParts2[1], 10);
        y = parseInt(dParts2[2], 10);
    } else {
        return null; // formato desconhecido
    }

    if (isNaN(y) || isNaN(mo) || isNaN(d) || isNaN(h) || isNaN(m) || isNaN(s)) {
        return null;
    }

    // Importante: mês é 0-based
    return new Date(y, mo - 1, d, h, m, s);
}

function diffToTextES5(ms) {
    if (ms < 0) ms = -ms; // se quiser tratar futuro como positivo
    var seg = Math.floor(ms / 1000);
    var min = Math.floor(seg / 60);
    var hor = Math.floor(min / 60);
    var dia = Math.floor(hor / 24);

    hor = hor % 24;
    min = min % 60;
    seg = seg % 60;

    return dia + "dia(s) " + hor + "hora(s) " + min + "minuto(s) " + seg + "segundo(s)";
}

// ---- Uso no seu código ----
function servicetask29(attempt, message) {
    try {
        log.info('INICIO DESCONTOS POR FUNCIONÁRIO - ATIVIDADE ENVIA WF GERENTE/DIRETOR **********************');

        var numFluig = hAPI.getCardValue("solicitacao_fluig");
        var nomeColaborador = (hAPI.getCardValue("nomeColaborador") + "").trim();
        var tipoDesconto = (hAPI.getCardValue("tipoDesconto") + "").trim();
        var descricao = (hAPI.getCardValue("descricao") + "").trim();
        var valTotalDesconto = (hAPI.getCardValue("valorEpi") + "").trim();
        var dataSolicitacao = (hAPI.getCardValue("dataSolicitacao") + "").trim(); // yyyy-mm-dd
        var horaSolicitacao = (hAPI.getCardValue("horaSolicitacao") + "").trim(); // HH:MM:SS ou HH:MM
        var dtInclusao = dataSolicitacao + " - " + horaSolicitacao;

        var dataHoraSolicitacao = parseDateTimeES5(dataSolicitacao, horaSolicitacao);

        if (!dataHoraSolicitacao || isNaN(dataHoraSolicitacao.getTime())) {
            throw new Error("Data/hora de solicitação inválida(s): '" + dataSolicitacao + "' '" + horaSolicitacao + "'");
        }

        var agora = new Date();
        var diffMs = agora.getTime() - dataHoraSolicitacao.getTime();
        var tempoPendente = diffToTextES5(diffMs);

        log.info('nomeColaborador: ' + nomeColaborador);
        log.info('tipoDesconto: ' + tipoDesconto);
        log.info('descricao: ' + descricao);
        log.info('valTotalDesconto: ' + valTotalDesconto);
        log.info('dtInclusao: ' + dtInclusao);
        log.info('tempoPendente: ' + tempoPendente);
        log.info('numFluig: ' + numFluig);

        var qtdEmailsEnviados = (hAPI.getCardValue("qtdEmailsEnviados") + "").trim();
        if (qtdEmailsEnviados == "" || qtdEmailsEnviados == null) qtdEmailsEnviados = "0";
        log.info('qtdEmailsEnviados: ' + qtdEmailsEnviados);

        hAPI.setCardValue('qtdEmailsEnviados', (parseInt(qtdEmailsEnviados, 10) + 1) + "");
        // enviaEmailAtraso(wkproces);

        log.info('FINAL 2 DESCONTOS POR FUNCIONÁRIO - ATIVIDADE ENVIA WF GERENTE/DIRETOR **********************');
    } catch (error) {
        log.warn("--servicetask29-- error: " + error);
        log.warn("--servicetask29-- error.message: " + error.message);
        log.warn("--servicetask29-- error.lineNumber: " + error.lineNumber);
        hAPI.setTaskComments(getValue("WKUser"), getValue('WKNumProces'), 0, "Erro no envio do WF para Gerente/Diretor: " + error.message);
    }
}

function getCurrentDate() {
    return new java.text.SimpleDateFormat("yyyy-MM-dd").format(new java.util.Date());
}

function getCurrentTime() {
    return new java.text.SimpleDateFormat("HH:mm").format(new java.util.Date());
}

function sendMailProtheusSuccess(wkproces, funcionarioMatricula) {
    var numFluig = hAPI.getCardValue("solicitacao_fluig");

    var soliEmail = hAPI.getCardValue("email_responsavel");
    var sender = "fluig.workflow";
    var serverUrl = fluigAPI.getPageService().getServerURL();
    var processInstanceID = serverUrl + "/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=" + wkproces;
    var parametros = new java.util.HashMap();
    var destinatarios = new java.util.ArrayList();
    var subject = "";
    var codCentroCusto = hAPI.getCardValue("codigo_ccusto");
    var listEmailsCentroCusto = getListEmailCentroCusto(codCentroCusto);
    try {
        subject = " Admissão de funcionário realizada - Fluig: " + wkproces + "";
        parametros.put("subject", subject);
        parametros.put("processUrl", processInstanceID);
        parametros.put("numeroFluig", numFluig);
        parametros.put("nomeFunc", funcionarioNome);
        parametros.put("cpfFunc", funcionarioCPF);
        parametros.put("matriculaProtheus", funcionarioMatricula);
        parametros.put("dataAdmissao", funcionarioDataAdmissao);
        parametros.put("funcaoFunc", funcionarioFuncao);
        parametros.put("ccustoFunc", funcionarioCCusto);
        destinatarios.add(soliEmail);
        destinatarios.add("dpmatriz@elcop.eng.br");

        log.info("Lista de e-mails do centro de custo: ");
        log.dir(listEmailsCentroCusto);

        // Adiciona emails dos usuários do centro de custo como destinatários.
        for (var j = 0; j < listEmailsCentroCusto.length; j++) {
            log.info("Adicionando destinatario: ");
            log.info(listEmailsCentroCusto[j] + "")

            destinatarios.add(listEmailsCentroCusto[j] + "");
        }

        notifier.notify(sender, "admissao_realizada", parametros, destinatarios, "text/html");
    } catch (e) {
        log.warn("--sendMailProtheusSucess - catch e: " + e);
        log.warn("--sendMailProtheusSucess - catch e.message: " + e.message);
        log.warn("--sendMailProtheusSucess - catch lineNumber: " + e.lineNumber);
    }
}