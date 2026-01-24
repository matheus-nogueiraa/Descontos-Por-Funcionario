const VERBAS = {
    almoxarifado: [
        {
            id: '516',
            desc: 'Uso Indevido de Material da Empresa'
        }
    ],
    ti: [
        {
            id: '373',
            desc: 'Material de T.I.'
        }
    ],
    frotas: [
        {
            id: '522',
            desc: 'Multas de Trânsito'
        },
        {
            id: '523',
            desc: 'Avarias em Veículos'
        },
        {
            id: '525',
            desc: 'Outros Descontos (Usado para Descontos de IBUTTON, Cartão)'
        }
    ],
    dp: [
        {
            id: '440',
            desc: 'Faltas'
        },
        {
            id: '445',
            desc: 'Desconto DSR'
        },
        {
            id: '520',
            desc: 'Outros Descontos'
        },
        {
            id: '518',
            desc: 'Desconto Cartão de Benefícios'
        },
        {
            id: '521',
            desc: 'Desconto 2º via Cartão'
        },
        {
            id: '570',
            desc: 'Vale Transporte Não Utilizado'
        },
        {
            id: '571',
            desc: 'Vale Refeição Não Utilizado'
        },
        // {
        //     id: '450',
        //     desc: 'Adiantamento Salarial'
        // }
    ]
}

const DP_CODES = new Set(
    (VERBAS.dp || []).map(v => String(v.id))
);

var MyWidget = SuperWidget.extend({
    tablesIds: ['tabelaDescontos', 'tabelaFuturos'],

    init: function () {
        this.setupInputs();
        this.setupButtons();
    },

    setupInputs: function () {
        getFuncionarios('funcionarioFiltro');
        //getFilias('codFilial');
        if (window.MaskEvent && typeof MaskEvent.init === 'function') {
            MaskEvent.init();
        }
        $('#valorEpi').mask('#00.000.000.000.000,00', { reverse: true });
    },

    setupButtons: function () {
        $('#btn-buscar').on('click', () => this.buscarFuncionario());
        $('#btn-limpar').on('click', () => this.limparTela());
    },

    buscarFuncionario: function () {
        const funcionario = $('#funcionarioFiltro').val();

        if (!funcionario) {
            showSweetAlert('Atenção', 'Digite o nome ou código do funcionário.', 'warning');
            $('#painelFuncionario').hide();
            return;
        }

        const filial = funcionario.split(' - ')[0] ? funcionario.split(' - ')[0].trim() : '';
        const matricula = funcionario.split(' - ')[1] ? funcionario.split(' - ')[1].trim() : '';
        const nome = funcionario.split(' - ')[1] ? funcionario.split(' - ')[1].trim() : '';

        const constraints = [];

        constraints.push(DatasetFactory.createConstraint("filial", filial, filial, ConstraintType.MUST));
        constraints.push(DatasetFactory.createConstraint("matricula", matricula, matricula, ConstraintType.MUST));

        const dataset = DatasetFactory.getDataset("ds_consultaFuncionarioCompleto", null, constraints, null);

        if (dataset?.values?.length) {
            const constraintsPeriodoAtual = new Array();
            constraintsPeriodoAtual.push(DatasetFactory.createConstraint("filial", filial, filial, ConstraintType.MUST));
            constraintsPeriodoAtual.push(DatasetFactory.createConstraint("matricula", matricula, matricula, ConstraintType.MUST));

            const datasetPeriodoAtual = DatasetFactory.getDataset('ds_consultaPeriodoAbertoFuncionarioProtheus', null, constraintsPeriodoAtual, null);

            const dataAtual = new Date();
            const anoAtual = String(dataAtual.getFullYear());
            const mesAtual = String(dataAtual.getMonth() + 1).padStart(2, '0');

            const periodoAtual = datasetPeriodoAtual?.values[0]?.RFQ_PERIOD || `${anoAtual?.trim()}${mesAtual?.trim()}`

            preencheListaCentroCusto(dataset?.values[0]?.RA_CC?.trim() || '');

            $('#periodoAtual').text(periodoAtual);
            $('#codFilial').val(filial);
            $('#matriculaFunc').val(matricula);
            $('#nomeColaborador').val(funcionario)

            const possuiPericulosidade = (dataset?.values[0]?.RA_ADCPERI || '').trim();
            const salarioBase = parseFloat(dataset?.values[0]?.RA_SALARIO) || 0;
            const salarioBruto = possuiPericulosidade == '2' ? (salarioBase + (salarioBase * 0.30)) : salarioBase

            this.preencherDadosFuncionario(dataset, periodoAtual, salarioBruto);
            this.processDataTableActive(filial, matricula, salarioBruto, periodoAtual);
            this.processDataTableFuture(filial, matricula, periodoAtual);
            $('#btn-limpar').show();
            $('#painelFuncionario').show();
        } else {
            showSweetAlert('Atenção', 'Funcionário não encontrado.', 'info');
            this.limparTela();
        }
    },

    preencherDadosFuncionario: function (dataset, periodoAtual, salarioBruto) {
        $('#dadosFuncionario').html(`
            <h4>Funcionário: ${dataset?.values[0]?.RA_NOME}</h4>
            <h4>CPF: ${dataset?.values[0]?.RA_CIC}</h4>
            <h4>Salário Bruto: ${salarioBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h4>
            <h4>Período Atual: ${periodoAtual}</h4>
        `);
        $('#salario').val(salarioBruto.toFixed(2)); // Salário total
        $('#salario15').val((salarioBruto * 0.15).toFixed(2)); // 15% do salário
    },

    limparTela: function () {
        $('#funcionarioFiltro').val('');
        $('#dadosFuncionario').html('');
        $('#tabelaDescontos').html('');
        $('#valorTotalResumo').text('');
        $('#quinzePorCentroSalario').text('');
        $('#valorParcelaMensalResumo').text('');
        $('#btn-limpar').hide();
        $('#painelFuncionario').hide();

        $('#periodoAtual').text('');
        $('#valQuinzePorCentroSalario').val('');
        $('#codFilial').val('');
        $('#nomeColaborador').val('');
    },

    processDataTableActive: function (filial, matricula, salario, periodoAtual) {
        const constraintsIncidencias = [];

        constraintsIncidencias.push(DatasetFactory.createConstraint("filial", filial, filial, ConstraintType.MUST));
        constraintsIncidencias.push(DatasetFactory.createConstraint("matricula", matricula, matricula, ConstraintType.MUST));
        constraintsIncidencias.push(DatasetFactory.createConstraint("periodoAtual", periodoAtual, periodoAtual, ConstraintType.MUST));

        const datasetIncidencias = DatasetFactory.getDataset("ds_consultaIncidenciasFuncionario", null, constraintsIncidencias, null);

        const produtosComParcelas = [];
        let valorTotal = 0;
        let valorPeriodo = 0;

        datasetIncidencias?.values?.forEach(element => {
            produtosComParcelas.push({
                codFilial: element.codFilial,
                codProcesso: element.codProcesso,
                codPeriodo: element.codPeriodo,
                nroPagamento: element.nroPagamento,
                roteiro: element.roteiro,
                verba: `${element.codVerba} - ${element.descVerba?.trim() || ""}`,
                horas: element.horas,
                valor: element.valor,
                dtReferencia: element.dtReferencia,
                centroCusto: element.centroCusto,
                nroParcela: element.nroParcela,
                seqVerba: element.seqVerba
            });

            valorTotal += parseFloat(element.valor)
            const isDP = DP_CODES.has(String(element.codVerba));

            if (element?.codPeriodo?.trim() == periodoAtual && !isDP) {
                valorPeriodo += parseFloat(element.valor)
            }
        });

        const columns = [
            { title: 'Filial', data: 'codFilial' },
            { title: 'Processo', data: 'codProcesso' },
            { title: 'Período', data: 'codPeriodo' },
            { title: 'Pagamento', data: 'nroPagamento' },
            { title: 'Roteiro', data: 'roteiro' },
            { title: 'Verba', data: 'verba' },
            { title: 'Horas', data: 'horas' },
            { title: 'Valor', data: 'valor' },
            { title: 'Data Ref', data: 'dtReferencia' },
            { title: 'C. Custos', data: 'centroCusto' },
            { title: 'Parcela', data: 'nroParcela' },
            { title: 'Sequência', data: 'seqVerba' },
        ];

        var table = $('#tabelaDescontos').DataTable({
            destroy: true,
            paging: false,
            searching: false,
            ordering: false,
            info: false,
            autoWidth: false,
            columns: columns,
            data: produtosComParcelas
        });

        // Calcular limite de 15% do salário
        const quinzePorCentroSalario = salario * 0.15;
        $('#valQuinzePorCentroSalario').val(quinzePorCentroSalario);

        // Verificar se há descontos ativos
        var totalRegistros = table.rows().count();
        var temDescontoAtivo = totalRegistros > 0;
        
        // Verificar se o valor dos descontos ativos ultrapassa 15% do salário
        var ultrapassaLimite = valorPeriodo > quinzePorCentroSalario;
        
        // Calcular quanto ainda pode ser lançado dentro do limite de 15%
        var margemDisponivel = quinzePorCentroSalario - valorPeriodo;
        margemDisponivel = margemDisponivel > 0 ? margemDisponivel : 0;
        
        // Armazenar informações para controle
        $('#descontoAtivo').val(temDescontoAtivo ? 'true' : 'false');
        $('#ultrapassaLimite').val(ultrapassaLimite ? 'true' : 'false');
        $('#margemDisponivel').val(margemDisponivel.toFixed(2));
        $('#valorDescontosAtivos').val(valorPeriodo.toFixed(2));

        // Preenche a tabela de resumo geral
        $('#valorTotalResumo').text(valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
        $('#valorParcelaMensalResumo').text(valorPeriodo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
        $('#quinzePorCentroSalario').text(quinzePorCentroSalario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    },

    processDataTableFuture: function (filial, matricula, periodoAtual) {
        var constraintsLancFuturo = [];

        constraintsLancFuturo.push(DatasetFactory.createConstraint("filial", filial, filial, ConstraintType.MUST));
        constraintsLancFuturo.push(DatasetFactory.createConstraint("matricula", matricula, matricula, ConstraintType.MUST));
        constraintsLancFuturo.push(DatasetFactory.createConstraint("periodoAtual", periodoAtual, periodoAtual, ConstraintType.MUST));

        var datasetLancFuturos = DatasetFactory.getDataset("ds_consultaLancFuturosFuncionario", null, constraintsLancFuturo, null);

        var rows = (datasetLancFuturos && datasetLancFuturos.values) ? datasetLancFuturos.values : [];
        var dados = [];
        var total = 0;

        // helper p/ formatar YYYYMMDD -> DD/MM/YYYY
        function fmtMesDissidio(m) {
            if (!m || m.length !== 8) return m;
            return m.substring(6, 8) + '/' + m.substring(4, 6) + '/' + m.substring(0, 4);
        }

        // monta linhas normalizadas para a tabela
        for (var i = 0; i < rows.length; i++) {
            var el = rows[i] || {};

            var verbaStr = ((el.codVerba || '') + '').trim();
            var descStr = ((el.descVerba || '') + '').trim();
            var verbaFmt = verbaStr ? (verbaStr + (descStr ? (' - ' + descStr) : '')) : descStr;

            var bruto = parseFloat(el.valor || el.RK_VALORTO || 0) || 0;
            total += bruto;

            dados.push({
                codFilial: (el.codFilial || '') + '',
                codProcesso: (el.codProcesso || '') + '',
                verba: verbaFmt,
                dtVencimento: fmtMesDissidio(el.dtVencimento || el.RK_DTVENC),
                dtVencimentoSort: el.dtVencimento || el.RK_DTVENC, // Valor original para ordenação
                valorNum: bruto,
                valor: bruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            });
        }

        // atualiza totalizadores e campos auxiliares
        $('#tabelaFuturos_total').text('R$ ' + total.toFixed(2).replace('.', ','));
        $('#totalFuturosValor').text('R$ ' + total.toFixed(2).replace('.', ','));
        $('#futuros_json').val(JSON.stringify(rows || []));
        $('#futurosVazio').toggle(dados.length === 0);

        // (re)inicializa DataTable no mesmo padrão visual dos ativos
        if ($.fn.DataTable && $.fn.DataTable.isDataTable('#tabelaFuturos')) {
            $('#tabelaFuturos').DataTable().clear().destroy();
            $('#tabelaFuturos').empty(); // remove thead/tbody antigos
        }

        var columns = [
            { title: 'Filial', data: 'codFilial' },
            { title: 'Processo', data: 'codProcesso' },
            { title: 'Verba', data: 'verba' },
            { 
                title: 'Data Vencimento', 
                data: 'dtVencimento',
                type: 'string',
                orderData: [3, 3] // Usa o próprio campo para ordenação, mas com lógica customizada
            },
            { title: 'Valor', data: 'valor', className: 'text-right' }
        ];

        $('#tabelaFuturos').DataTable({
            destroy: true,
            paging: false,
            searching: false,
            ordering: true,
            info: false,
            autoWidth: false,
            columns: columns,
            data: dados,
            order: [[3, 'asc']], // Ordena pela coluna "Data Vencimento" (índice 3) em ordem crescente
            columnDefs: [
                {
                    targets: 3, // Coluna Data Vencimento
                    type: 'date-br', // Tipo customizado para datas brasileiras
                    render: function(data, type, row) {
                        if (type === 'sort' || type === 'type') {
                            // Para ordenação, usa o valor original YYYYMMDD
                            return row.dtVencimentoSort || '';
                        }
                        // Para display, usa o valor formatado
                        return data;
                    }
                }
            ],
            language: { url: '//cdn.datatables.net/plug-ins/1.11.3/i18n/pt_br.json' }
        });
    },

});

function preencheListaCentroCusto(centroCustoFuncionario) {

    $(`#centroCustoDesconto`).find('option').remove();

    $(`#centroCustoDesconto`).append(`<option selected disabled value="">Selecione o centro de custo...</option>`);

    var dsCentroCusto = DatasetFactory.getDataset("ds_consulta_cadastroAprovador", null, null, null);
    for (var i = 0; i < dsCentroCusto.values.length; i++) {
        const centroCusto = dsCentroCusto.values[i].centroCusto;

        if (centroCustoFuncionario && centroCusto.includes(centroCustoFuncionario)) {
            $(`#centroCustoDesconto`).append(`<option value="${dsCentroCusto.values[i].grupoAprovador}">${centroCusto} - ${dsCentroCusto.values[i].grupoAprovador}</option>`);
        }
    }
}
