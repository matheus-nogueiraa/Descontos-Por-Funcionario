const ATIVIDADES = {
    ZERO: '0',
    INICIO: '4',
    APROV_GERENTE: '22'
}

let beforeSendValidate = function (numState, nextState) {
    let msg = '';

    if (numState == ATIVIDADES.ZERO || numState == ATIVIDADES.INICIO) {
        msg += 'Este processo deve ser iniciado exclusivamente pela Página Pública de Lançamentos de Descontos. Feche esta tela e utilize a página oficial.';
    }
    else if (numState == ATIVIDADES.APROV_GERENTE) {
        const rdAprovaDescGerente = $('#rdAprovaDescGerente')?.val()?.trim() || '';
        const obsAnaliseAprovadorGerente = $('#obsAnaliseAprovadorGerente')?.val()?.trim() || '';

        if (!rdAprovaDescGerente){
            msg += 'Aprovar Desconto?';
        }
        else if (rdAprovaDescGerente == 'abonar' && !obsAnaliseAprovadorGerente){
            msg += 'Observação do Aprovador';
        }
    }

    if (msg != '') {
        customMsg(msg.toString());
        return false;
    }
}

function customMsg(paramMsg) {
    var msg = paramMsg;
    showSweetTimerAlert("Campo Obrigatório!<br><b>" + msg + "</b>", "warning");
}