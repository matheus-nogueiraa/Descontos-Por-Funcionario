$(document).ready(function () {
    getFiliais('codFilialFiltro');
    getFuncionarios('matriculaFiltro');
    changeLoader("hide");
    $('#panelDescontos').hide();
})

var MyWidget = SuperWidget.extend({
    //método iniciado quando a widget é carregada
    init: function () {
        initFiltroDatas();
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
        },
        global: {}
    },
});

function initFiltroDatas() {
    const dataDeHoje = new Date().toISOString().split('T')[0];
    const dataDe = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0];
    $('#dataDe').val(dataDe);
    $('#dataAte').val(dataDeHoje);
}

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
    const matriculaSelecionada = $('#matriculaFiltro').val();
    const matriculaFiltro = matriculaSelecionada?.includes(' - ')
        ? matriculaSelecionada.split(' - ')[1]?.trim()
        : matriculaSelecionada;
    const statusAtualProcesso = $('#statusAtualProcesso')?.val();
    const dataDe = $('#dataDe').val(); // yyyy-mm-dd
    const dataAte = $('#dataAte').val(); // yyyy-mm-dd

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

        constraints.push(DatasetFactory.createConstraint('tipoDesconto', 'ALMOXARIFADO', 'ALMOXARIFADO', ConstraintType.MUST));

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

        // Filtro de data feito client-side: dataSolicitacao no formulário está em dd/mm/yyyy
        const dataDeParsed = dataDe ? new Date(dataDe + 'T00:00:00') : null;
        const dataAteParsed = dataAte ? new Date(dataAte + 'T23:59:59') : null;

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
                    // Filtra por data client-side (dataSolicitacao = dd/mm/yyyy)
                    if (dataDeParsed || dataAteParsed) {
                        const partes = (element.dataSolicitacao || '').split('/');
                        if (partes.length === 3) {
                            const dataElemento = new Date(partes[2] + '-' + partes[1] + '-' + partes[0] + 'T00:00:00');
                            if (dataDeParsed && dataElemento < dataDeParsed) return;
                            if (dataAteParsed && dataElemento > dataAteParsed) return;
                        } else {
                            return; // data inválida, ignora
                        }
                    }

                    const ARQUIVO_SENSIVEL = 'relatorio_desconto_lancado';
                    const constraintsAnexos = [
                        DatasetFactory.createConstraint('userSecurityId', 'admin', 'admin', ConstraintType.MUST),
                        DatasetFactory.createConstraint('processid', element.solicitacao_fluig, element.solicitacao_fluig, ConstraintType.MUST)
                    ];
                    const dsAnexos = DatasetFactory.getDataset('ds_process_attachments_files', null, constraintsAnexos, null);
                    const docsVisiveis = (dsAnexos?.values || []).filter(d => !d.fileName?.toLowerCase().includes(ARQUIVO_SENSIVEL));

                    const icones = docsVisiveis.map(function (doc) {
                        var nome = (doc.fileName || 'Documento').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        var url = (doc.downloadUrl || '').replace(/"/g, '&quot;');
                        return '<a href="' + url + '" target="_blank" rel="noopener noreferrer" title="' + nome + '" style="text-decoration:none;">'
                            + '<i class="flaticon flaticon-doc icon-lg text-info iconAction" style="pointer-events:none;"></i>'
                            + '</a>';
                    }).join(' ');

                    myData.push([
                        element.solicitacao_fluig,
                        element.dataSolicitacao,
                        element.codFilial,
                        element.matriculaColaborador,
                        element.grupoAprovadorCC?.split(':')?.slice(2)?.join(' - ')?.trim() || '',
                        element.nomeColaborador?.split(' - ')?.slice(2)?.join(' - ')?.trim() || '',
                        element.codVerba || '',
                        element.tipoDesconto || '',
                        element.valorEpi || '',
                        getStatusProcesso(element.atividadeAtual),
                        icones || '<span class="text-muted">-</span>'
                    ]);
                });

                columnsProcesso = [
                    { 'title': 'Nº Fluig' },
                    { 'title': 'Data Envio Fluig' },
                    { 'title': 'Filial' },
                    { 'title': 'Matrícula' },
                    { 'title': 'Centro de Custo' },
                    { 'title': 'Colaborador' },
                    { 'title': 'Verba' },
                    { 'title': 'Tipo' },
                    { 'title': 'Desconto Total' },
                    { 'title': 'Status Processo' },
                    { 'title': 'Documentos' }
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

// Converte yyyy-mm-dd (input type=date) para dd/mm/yyyy (formato salvo pelo Fluig)
function isoParaFluig(strDate) {
    if (!strDate) return '';
    const [year, month, day] = strDate.split('-');
    return `${day}/${month}/${year}`;
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