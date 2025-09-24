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
            id: '520',
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
        {
            id: '450',
            desc: 'Adiantamento Salarial'
        }
    ]
}

var MyWidget = SuperWidget.extend({
    tablesIds: ['tabelaDescontos'],

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
            const dataAtual = new Date();
            const anoAtual = String(dataAtual.getFullYear());
            const mesAtual = String(dataAtual.getMonth() + 1).padStart(2, '0');
            const periodoAtual = '202506' // `${anoAtual?.trim()}${mesAtual?.trim()}`

            $('#periodoAtual').text(periodoAtual)
            $('#codFilial').val(filial);
            $('#matriculaFunc').val(matricula);
            $('#nomeColaborador').val(funcionario)

            this.preencherDadosFuncionario(dataset, periodoAtual);
            this.processDataTable(filial, matricula, parseFloat(dataset?.values[0]?.RA_SALARIO) || 0, periodoAtual);
            $('#btn-limpar').show();
            $('#painelFuncionario').show();
        } else {
            showSweetAlert('Atenção', 'Funcionário não encontrado.', 'info');
            this.limparTela();
        }
    },

    preencherDadosFuncionario: function (dataset, periodoAtual) {
        $('#dadosFuncionario').html(`
            <h4>Funcionário: ${dataset?.values[0]?.RA_NOME}</h4>
            <h4>CPF: ${dataset?.values[0]?.RA_CIC}</h4>
            <h4>Salário: ${parseFloat(dataset?.values[0]?.RA_SALARIO).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h4>
            <h4>Período Atual: ${periodoAtual}</h4>
        `);
        $('#salario').val(parseFloat(dataset?.values[0]?.RA_SALARIO).toFixed(2)); // Salário total
        $('#salario10').val((parseFloat(dataset?.values[0]?.RA_SALARIO) * 0.10).toFixed(2)); // 10% do salário
    },

    limparTela: function () {
        $('#funcionarioFiltro').val('');
        $('#dadosFuncionario').html('');
        $('#tabelaDescontos').html('');
        $('#valorTotalResumo').text('');
        $('#dezPorCentroSalario').text('');
        $('#valorParcelaMensalResumo').text('');
        $('#btn-limpar').hide();
        $('#painelFuncionario').hide();

        $('#periodoAtual').text('');
        $('#valDezPorCentroSalario').val('');
        $('#codFilial').val('');
        $('#nomeColaborador').val('');
    },

    processDataTable: function (filial, matricula, salario, periodoAtual) {
        const constraintsIncidencias = [];

        constraintsIncidencias.push(DatasetFactory.createConstraint("filial", filial, filial, ConstraintType.MUST));
        constraintsIncidencias.push(DatasetFactory.createConstraint("matricula", matricula, matricula, ConstraintType.MUST));

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

            if (element?.codPeriodo?.trim() == periodoAtual) {
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

        $('#tabelaDescontos').DataTable({
            destroy: true,
            paging: false,
            searching: false,
            ordering: false,
            info: false,
            autoWidth: false,
            columns: columns,
            data: produtosComParcelas
        });

        const dezPorCentroSalario = salario * 0.1
        $('#valDezPorCentroSalario').val(dezPorCentroSalario);

        // Preenche a tabela de resumo geral
        $('#valorTotalResumo').text(valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
        $('#valorParcelaMensalResumo').text(valorPeriodo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
        $('#dezPorCentroSalario').text(dezPorCentroSalario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    },
});