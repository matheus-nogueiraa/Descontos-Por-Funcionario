function servicetask29(attempt, message) {
    try {
        log.info('INICIO DESCONTOS POR FUNCIONÁRIO - ATIVIDADE ENVIA WF GERENTE/DIRETOR **********************');

        log.info('Data Execução: '+getCurrentDate());
        log.info('Hora Execução: '+getCurrentTime());

        log.info('FIM DESCONTOS POR FUNCIONÁRIO - ATIVIDADE ENVIA WF GERENTE/DIRETOR **********************');
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