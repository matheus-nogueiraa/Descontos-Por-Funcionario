var MyWidget = SuperWidget.extend({
    tablesIds: [ 'tabelaDescontos' ],

    init: function () {
        this.setupInputs();
        this.setupButtons();
    },

    setupInputs: function () {
        getFuncionarios('codFuncionario');
        getFilias('codFilial');
    },

    setupButtons: function () {
        $('#btn-buscar').on('click', () => this.buscarFuncionario());
        $('#btn-limpar').on('click', () => this.limparTela());
    },

    buscarFuncionario: function () {
        const funcionarios = this.getFuncionariosMock();
        const codFuncionario = $('#codFuncionario').val();
        const nomeFuncionario = codFuncionario.split(' - ')[ 1 ] ? codFuncionario.split(' - ')[ 1 ].trim() : codFuncionario.trim();

        if (!nomeFuncionario) {
            showSweetAlert('Atenção', 'Digite o nome ou código do funcionário.', 'warning');
            $('#painelFuncionario').hide();
            return;
        }

        const funcionario = funcionarios.find(f => f.nome.toUpperCase() === nomeFuncionario.toUpperCase());
        if (funcionario) {
            this.preencherDadosFuncionario(funcionario);
            this.processDataTable(funcionario.produtos, funcionario.salario);
            $('#btn-limpar').show();
            $('#painelFuncionario').show();
        } else {
            showSweetAlert('Atenção', 'Funcionário não encontrado.', 'info');
            this.limparTela();
        }
    },

    preencherDadosFuncionario: function (funcionario) {
        $('#dadosFuncionario').html(`
            <h4>Funcionário: ${funcionario.nome}</h4>
            <h4>CPF: ${funcionario.cpf}</h4>
            <h4>Salário: ${funcionario.salario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h4>
        `);
        $('#salario').val((funcionario.salario * 0.10).toFixed(2));
    },

    limparTela: function () {
        $('#codFuncionario').val('');
        $('#dadosFuncionario').html('');
        $('#tabelaDescontos').html('');
        $('#valorTotalResumo').text('');
        $('#parcelasTotaisResumo').text('');
        $('#valorParcelaMensalResumo').text('');
        $('#btn-limpar').hide();
        $('#painelFuncionario').hide();
    },

    processDataTable: function (produtos, salario) {
        const tetoMensal = salario * 0.10;
        let filaProdutos = produtos.map(p => ({ ...p, restante: p.valor }));

        
        while (filaProdutos.some(p => p.restante > 0)) {
            let valorRestanteNoMes = tetoMensal;
            filaProdutos.forEach(p => {
                if (p.restante > 0 && valorRestanteNoMes > 0) {
                    let valorParcela = Math.min(p.restante, valorRestanteNoMes);
                    if (!p.valorParcelas) p.valorParcelas = [];
                    p.valorParcelas.push(valorParcela);
                    p.restante -= valorParcela;
                    valorRestanteNoMes -= valorParcela;
                }
            });
        }

        // Monta os dados para a tabela de produtos
        const produtosComParcelas = filaProdutos.map((p, idx) => ({
            ordem: idx + 1,
            produto: p.nome,
            valor: p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            parcelas: p.valorParcelas.length
        }));

        const columns = [
            { title: '#', data: 'ordem' },
            { title: 'EPI', data: 'produto' },
            { title: 'Valor', data: 'valor' }
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

        // Cálculo do resumo geral
        const valorTotal = produtos.reduce((acc, p) => acc + p.valor, 0);
        const parcelasTotais = Math.ceil(valorTotal / tetoMensal); // Corrigido para calcular o total de parcelas corretamente
        const todasParcelas = filaProdutos.flatMap(p => p.valorParcelas);
        const valorParcelaMensal = Math.max(...todasParcelas);

        // Preenche a tabela de resumo geral
        $('#valorTotalResumo').text(valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
        $('#parcelasTotaisResumo').text(parcelasTotais);
        $('#valorParcelaMensalResumo').text(valorParcelaMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    },

    getFuncionariosMock: function () {
        return [
            {
                nome: "ADAN GUILHERME RODRIGUES",
                cpf: "70223160156",
                cargo: "INST ELETRICO B",
                salario: 2361.93,
                produtos: [
                    { nome: "Ferramenta", valor: 180.00 },
                    { nome: "Bota de Segurança", valor: 250.00 }
                ]
            },
            {
                nome: "ALESSANDRO DA CUNHA FERNANDES",
                cpf: "05893614143",
                cargo: "ELETRICISTA IV",
                salario: 1676.8,
                produtos: [
                    { nome: "Uniforme", valor: 120.00 }
                ]
            },
            {
                nome: "ADENILSON GOMES BARBOSA",
                cpf: "06252592110",
                cargo: "AGENTE COMERCIAL DE LEITURA",
                salario: 1518.00,
                produtos: [
                    { nome: "Celular", valor: 900.00 }
                ]
            },
            {
                nome: "ALDEMIR DA SILVA DOS SANTOS",
                cpf: "06789915109",
                cargo: "AGENTE COMERCIAL DE LEITURA",
                salario: 1518.00,
                produtos: [
                    { nome: "Tablet", valor: 700.00 }
                ]
            },
            {
                nome: "ADAO ARAUJO LEITE FILHO",
                cpf: "37778280841",
                cargo: "INST ELETRICISTA",
                salario: 2132.84,
                produtos: [
                    { nome: "Bota de Segurança", valor: 250.00 }
                ]
            },
            {
                nome: "ADMAR OLIVEIRA FEITOSA",
                cpf: "12345678900",
                cargo: "INST ELETRICISTA",
                salario: 2132.84,
                produtos: [
                    { nome: "Bota de Segurança", valor: 250.00 },
                    { nome: "Tablet", valor: 700.00 },
                    { nome: "Celular", valor: 900.00 },
                    { nome: "Uniforme", valor: 120.00 }
                ]
            }
        ];
    }
});