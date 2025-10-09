function afterProcessCreate(processId){
	hAPI.setCardValue('solicitacao_fluig', processId);

    hAPI.setCardValue('timeInicioProcesso', getTimestamp());
}

function getTimestamp() {
    return new java.util.Date().getTime();
}