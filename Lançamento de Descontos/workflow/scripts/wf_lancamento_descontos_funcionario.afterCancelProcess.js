function afterCancelProcess(colleagueId,processId){
    hAPI.setCardValue('atividadeAtual', '00');
    hAPI.setCardValue('timeAtividadeAtual', getTimestamp());

    hAPI.setCardValue('timeFimProcesso', getTimestamp());
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