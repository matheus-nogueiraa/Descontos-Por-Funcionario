function afterStateEntry(sequenceId) {
    hAPI.setCardValue('atividadeAtual', sequenceId);
    hAPI.setCardValue('timeAtividadeAtual', getTimestamp());

    if (sequenceId == 10 || sequenceId == 27) { // Atividade Fim do Processo.
        hAPI.setCardValue('timeFimProcesso', getTimestamp());
    }
}

function getTimestamp() {
    return new java.util.Date().getTime();
}

function getCurrentDate() {
    return new java.text.SimpleDateFormat("yyyy-MM-dd").format(new java.util.Date());
}

function getCurrentTime() {
    return new java.text.SimpleDateFormat("HH:mm").format(new java.util.Date());
}