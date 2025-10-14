const ATIVIDADES = {
    ZERO: '0',
    INICIO: '4',
    APROV_GERENTE: '22'
}

var beforeSendValidate = function (numState, nextState) {
    let msg = '';

    if (numState == ATIVIDADES.ZERO || numState == ATIVIDADES.INICIO) {
        msg += 'Este processo deve ser iniciado exclusivamente pela Página Pública de Lançamentos de Descontos. Feche esta tela e utilize a página oficial.';
    }
    else if (numState == ATIVIDADES.APROV_GERENTE) {
        const rdAprovaDescGerente = $('input[name="rdAprovaDescGerente"]:checked')?.val()?.trim() || '';
        const obsAnaliseAprovadorGerente = $('#obsAnaliseAprovadorGerente')?.val()?.trim() || '';

        if (!rdAprovaDescGerente) {
            msg += 'Aprovar Desconto?';
        }
        else if (rdAprovaDescGerente == 'abonar' && !obsAnaliseAprovadorGerente) {
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

function showSweetTimerAlert(msg, icon) {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top',
        showConfirmButton: false,
        timer: 6000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    })
    Toast.fire({
        icon: icon,
        html: msg
    });
}