$(document).ready(function () {
    getFiliais('codFilialFiltro');
    changeLoader("hide");
    $('#panelDescontos').hide();
})

var MyWidget = SuperWidget.extend({
    //variáveis da widget
    variavelNumerica: null,
    variavelCaracter: null,

    //método iniciado quando a widget é carregada
    init: function () {
        var self = this;

        // Consultar valor atual do dataset ao carregar
        this.consultarParametroInicial();

        // Listener para mudança de estado
        $('#permitirAprovacao').on('change', function () {
            var isChecked = $(this).is(':checked');
            if ($('#permitirAprovacao').prop('disabled')) return; // Evita múltiplos cliques

            self.setLoading(true);
            self.updateSwitchColor(isChecked);

            // Define valores baseado no ambiente (teste vs produção)
            var isTestEnvironment = window.location.origin.includes(':8443');
            var documentId = isTestEnvironment ? 341793 : 486590;
            var cardId = isTestEnvironment ? 341794 : 486718;

            self.atualizarParametroAprovacao(isChecked, documentId, cardId);
        });
    },
    // Adiciona/Remove loading e desabilita o switch
    setLoading: function (isLoading) {
        if (isLoading) {
            if ($('#switchLoading').length === 0) {
                $('#switchWrapper').append('<span id="switchLoading" class="ml-2"><i class="fluigicon fluigicon-spinner fluigicon-spin"></i></span>');
            }
            $('#permitirAprovacao').prop('disabled', true);
            $('#switchMsg').html('<i class="text-info">Atualizando...</i>');
        } else {
            $('#switchLoading').remove();
            $('#permitirAprovacao').prop('disabled', false);
        }
    },

    //BIND de eventos
    bindings: {
        local: {
            'execute': ['click_executeAction']
        },
        global: {}
    },

    executeAction: function (htmlElement, event) {
    },

    // Método para atualizar a cor do switch baseado no estado
    updateSwitchColor: function (isEnabled) {
        var switchWrapper = $('#switchWrapper');

        if (isEnabled) {
            // Habilitado = Verde
            switchWrapper.removeClass('switch-danger').addClass('switch-success');
        } else {
            // Desabilitado = Vermelho
            switchWrapper.removeClass('switch-success').addClass('switch-danger');
        }

        console.log('Cor atualizada - Habilitado:', isEnabled, 'Classe aplicada:', isEnabled ? 'switch-success' : 'switch-danger');
    },

    // Método para consultar o valor inicial do parâmetro
    consultarParametroInicial: function () {
        var self = this;

        var isTestEnvironment = window.location.origin.includes(':8443');
        var metadataid = isTestEnvironment ? "341794" : "486718";

        var constraints = [
            DatasetFactory.createConstraint('metadata#id', metadataid, metadataid, ConstraintType.MUST)
        ];

        var dataset = DatasetFactory.getDataset('ds_parametro_aprovacao_descontos', null, constraints, null);

        if (dataset && dataset.values.length > 0) {
            var valorInicial = dataset.values[0].permitirAprovacao;
            var valorBoolean = valorInicial === true || valorInicial === 'true';

            setTimeout(function () {
                $('#permitirAprovacao').prop('checked', valorBoolean);
                self.updateSwitchColor(valorBoolean);
            }, 100);
        } else {
            setTimeout(function () {
                $('#permitirAprovacao').prop('checked', false);
                self.updateSwitchColor(false);
            }, 100);
        }
    },

    // Método para atualizar o parâmetro de aprovação via formulário
    atualizarParametroAprovacao: function (permitirAprovacao, documentId, cardId) {
        var self = this;
        var dataAtual = new Date();
        var dataFormatada =
            dataAtual.toLocaleDateString('pt-BR') + ' ' +
            dataAtual.toLocaleTimeString('pt-BR');

        var valorCheckbox = permitirAprovacao ? true : false;

        var payload = {
            values: [
                { fieldId: "dataAtualizacao", value: dataFormatada },
                { fieldId: "permitirAprovacao", value: valorCheckbox }
            ]
        };

        $.ajax({
            url: window.location.origin +
                '/ecm-forms/api/v2/cardindex/' + documentId + '/cards/' + cardId,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(payload)
        })
            .done(function (data) {
                console.log('Formulário atualizado com sucesso', data);
                $('#switchMsg').html('<i class="text-success">✓ Parâmetro atualizado</i>');

                // Limpar mensagem após 3 segundos
                setTimeout(function () {
                    $('#switchMsg').html('');
                }, 3000);
            })
            .fail(function (err) {
                console.error('Erro ao atualizar formulário', err);
                $('#switchMsg').html('<i class="text-danger">✗ Erro ao atualizar</i>');

                // Limpar mensagem após 3 segundos
                setTimeout(function () {
                    $('#switchMsg').html('');
                }, 3000);
            })
            .always(function () {
                self.setLoading(false);
            });
    }


});


function changeLoader(stateElement) {
    if (stateElement == "show") {
        $('#filterButton').text("Consultando Descontos...").attr("disabled", true);
        $('#loaderTable').show();
        $('#panelDescontos').hide();

    }
    else if (stateElement == "hide") {
        $('#filterButton').text('Consultar Descontos').attr("disabled", false);
        $('#loaderTable').hide();
        $('#panelDescontos').show();
    }
}

async function loadTable() {

    changeLoader("show");

    const codFilialFiltro = $('#codFilialFiltro')?.val()?.split(' - ')[0];
    const matriculaFiltro = $('#matriculaFiltro').val();
    const statusAtualProcesso = $('#statusAtualProcesso')?.val();
    const dataInclusaoDeFiltro = $('#dataInclusaoDeFiltro').val();
    const dataInclusaoAteFiltro = $('#dataInclusaoAteFiltro').val();

    try {
        //comando para apagar datatable, caso tenha conteudo    
        if ($.fn.dataTable.isDataTable('#datapanelDescontos')) {
            $('#datapanelDescontos').DataTable().clear();
            $('#datapanelDescontos').DataTable().destroy();
            $('#datapanelDescontos').empty();
            $('#datapanelDescontos').addClass("usa-table views-table views-view-table cols-8 sticky-enabled sticky-table");
            $('#datapanelDescontos').css("width", "100%");
        }

        let myData = new Array();
        let constraints = new Array();
        let columnsProcesso = [];

        constraints.push(DatasetFactory.createConstraint('userSecurityId', 'admin', 'admin', ConstraintType.MUST));

        if (codFilialFiltro) {
            constraints.push(DatasetFactory.createConstraint('codFilial', codFilialFiltro, codFilialFiltro, ConstraintType.MUST));
        }

        if (matriculaFiltro) {
            constraints.push(DatasetFactory.createConstraint('matriculaColaborador', matriculaFiltro, matriculaFiltro, ConstraintType.MUST));
        }

        if (statusAtualProcesso && statusAtualProcesso != 'EM_ANDAMENTO') {
            constraints.push(DatasetFactory.createConstraint('atividadeAtual', statusAtualProcesso, statusAtualProcesso, ConstraintType.MUST));
        }

        if (statusAtualProcesso == 'EM_ANDAMENTO') {
            constraints.push(DatasetFactory.createConstraint('atividadeAtual', "27", "27", ConstraintType.MUST_NOT));
            constraints.push(DatasetFactory.createConstraint('atividadeAtual', "10", "10", ConstraintType.MUST_NOT));
        }

        if (dataInclusaoDeFiltro || dataInclusaoAteFiltro) {
            constraints.push(DatasetFactory.createConstraint('dataSolicitacao', dataInclusaoDeFiltro || '1999-01-01', dataInclusaoAteFiltro || '2999-01-01', ConstraintType.MUST));
        }

        DatasetFactory.getDataset('ds_form_lancamento_desconto_funcionario', null, constraints, null, {
            success: function (dataset) {
                if (!dataset?.values) {
                    FLUIGC.toast({
                        title: 'Erro ao consultar Descontos!',
                        message: "Reveja os Filtros.",
                        type: 'warning',
                        timeout: "slow"
                    });

                    changeLoader("hide");
                    $('#panelDescontos').hide();
                    return;
                }

                dataset.values.forEach(element => {
                    myData.push([
                        element.solicitacao_fluig,
                        element.dataSolicitacao,
                        element.codFilial,
                        element.matriculaColaborador,
                        element.grupoAprovadorCC?.split(':')?.slice(2)?.join(' - ')?.trim() || '',
                        element.nomeColaborador?.split(' - ')?.slice(2)?.join(' - ')?.trim() || '',
                        getStatusProcesso(element.atividadeAtual),
                        `
                        <i class="flaticon flaticon-doc icon-lg text-info iconAction"
                            aria-hidden="true" title="Visualizar Documentos"
                            onclick="consultaDocumentosProcesso(${element.solicitacao_fluig})"></i>
                        <i class="flaticon flaticon-link icon-lg  text-primary iconAction"
                            aria-hidden="true" title="Visualizar Processo" 
                            onclick="acessarSolicitacao(${element.solicitacao_fluig})"></i>
                        `

                    ]);
                });

                columnsProcesso = [
                    { 'title': 'Nº Fluig' },
                    { 'title': 'Data Envio Fluig' },
                    { 'title': 'Filial' },
                    { 'title': 'Matrícula' },
                    { 'title': 'Centro de Custo' },
                    { 'title': 'Colaborador' },
                    { 'title': 'Status Processo' },
                    { 'title': 'Visualizar Atestado' }
                ]

                $('#datapanelDescontos').DataTable({
                    "language": {
                        "sEmptyTable": "Nenhum Desconto Encontrado",
                        "sInfo": "Mostrando de _START_ até _END_ de _TOTAL_ registros",
                        "sInfoEmpty": "Mostrando 0 até 0 de 0 registros",
                        "sInfoFiltered": "(Filtrados de _MAX_ registros)",
                        "sInfoPostFix": "",
                        "sInfoThousands": ".",
                        "sLengthMenu": "_MENU_ resultados por página",
                        "sLoadingRecords": "Carregando...",
                        "sProcessing": "Processando...",
                        "sZeroRecords": "Nenhum Desconto Encontrado",
                        "sSearch": "Filtrar conteudo ",
                        "oPaginate": {
                            "sNext": "Próximo",
                            "sPrevious": "Anterior",
                            "sFirst": "Primeiro",
                            "sLast": "Último"
                        }
                    },
                    "lengthChange": true,
                    "lengthMenu": [[10, 25, 50, -1], [10, 25, 50, "All"]],
                    dom: 'lBfrtip',
                    buttons: [
                        {
                            extend: 'excel',
                            text: 'Download',
                            title: `Relatório de Descontos`,
                            className: 'btn btn-default'
                        }
                    ],
                    data: myData,
                    columns: columnsProcesso,
                    columnDefs: [],
                    "order": [[0]] // Ordena a primeira coluna de forma crescente

                });

                changeLoader("hide");
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR, textStatus, errorThrown);
                changeLoader("hide");

                FLUIGC.toast({
                    title: 'Erro na Consulta do Dataset!',
                    message: 'Contate a equipe técnica.',
                    type: 'warning',
                    timeout: 'slow'
                });
            }
        });

    } catch (error) {
        changeLoader("hide");
        console.error("Erro na consulta do dataset: " + error)
    }
}

function formatedDate(strDate) {
    if (!strDate) {
        return '';
    }

    let year = strDate.split('-')[0];
    let month = strDate.split('-')[1];
    let day = strDate.split('-')[2];

    let date = `${day}/${month}/${year}`;

    return date;

}

function getStatusProcesso(atividadeAtual) {
    if (atividadeAtual == '00') {
        mensagem = 'Processo Cancelado'
        return `<span class="text-warning">${mensagem}</span>`
    }
    else if (atividadeAtual == '22') {
        mensagem = 'Pendente Aprovação Gestor'
        return `<span class="text-danger">${mensagem}</span>`
    }
    else if (atividadeAtual == '27') {
        mensagem = 'Desconto Abonado'
        return `<span class="text-info">${mensagem}</span>`
    }
    else if (atividadeAtual == '10') {
        mensagem = 'Desconto Lançado Protheus'
        return `<span class="text-success">${mensagem}</span>`
    }
    else {
        mensagem = 'Processo Em Andamento'
        return `<span class="text-info">${mensagem}</span>`
    }
}

function consultaDocumentosProcesso(numFluig) {
    if (!numFluig) {
        FLUIGC.toast({
            title: 'Erro: ',
            message: 'Não foi possível consultar os anexos do processo. ID Inválido!',
            type: 'warning',
            timeout: 'slow'
        });

        return;
    }

    const constraintsAnexosProcesso = new Array();

    constraintsAnexosProcesso.push(DatasetFactory.createConstraint('userSecurityId', 'admin', 'admin', ConstraintType.MUST));

    constraintsAnexosProcesso.push(DatasetFactory.createConstraint('processid', numFluig, numFluig, ConstraintType.MUST))

    const datasetAnexosProcesso = DatasetFactory.getDataset('ds_process_attachments_files', null, constraintsAnexosProcesso, null);

    if (!datasetAnexosProcesso?.values?.length) {
        FLUIGC.toast({
            title: 'Erro: ',
            message: 'Não foi possível consultar os anexos do processo. Nenhum documento encontrado!',
            type: 'warning',
            timeout: 'slow'
        });

        return;
    }

    datasetAnexosProcesso.values.forEach(element => {
        const urlDoc = element?.downloadUrl || '';

        if (urlDoc) {
            window.open(urlDoc);
        }
    })
}

function acessarSolicitacao(numFluig) {
    const url = `/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=${numFluig}`;
    window.open(url, '_blank');
}