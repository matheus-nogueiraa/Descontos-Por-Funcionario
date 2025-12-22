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
        // Consulta ao dataset antes de aprovar
        var constraints = [
            DatasetFactory.createConstraint('metadata#id', '486718', '486718', ConstraintType.MUST),
            DatasetFactory.createConstraint('userSecurityId', 'admin', 'admin', ConstraintType.MUST)
        ];
        var dataset = DatasetFactory.getDataset('ds_parametro_aprovacao_descontos', null, constraints, null);

        var permitirAprovacao = false;
        if (dataset && dataset.values.length > 0) {
            var valorInicial = dataset.values[ 0 ].permitirAprovacao;
            permitirAprovacao = valorInicial === true || valorInicial === 'true' || valorInicial === '1' || valorInicial === 1;
        }

        if (!permitirAprovacao) {
            customMsg('Aprovação não permitida no momento.', 'error');
            return false;
        }

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

function customMsg(paramMsg, iconType = 'warning') {
    var msg = paramMsg;
    showSweetTimerAlert("Campo Obrigatório!<br><b>" + msg + "</b>", iconType);
}

function showSweetTimerAlert(msg, icon) {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top',
        showConfirmButton: false,
        timer: 10000,
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