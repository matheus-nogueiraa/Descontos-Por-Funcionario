var MyWidget = SuperWidget.extend({
    var: tablesIds = [
        'tabelaDescontos'
    ],

    init: function () {
        this.setupInputs();
        this.setupButtons();
    },

    setupInputs: function () {
        this.getFuncionarios('codFuncionario')
    },

    setupButtons: function () {
        this.consultarFuncionario();
    },

    processDataTable: function (produtos, salario) {
        const columns = [
            { title: 'Produto a ser pago', data: 'produto' },
            { title: 'Valor do Produto', data: 'valor' },
            { title: '10% do Salário', data: 'desconto' },
            { title: 'QTD Parcelas', data: 'parcelas' }
        ];

        // Monta os dados para o DataTable
        const data = produtos.map(produto => {
            const desconto = salario * 0.10;
            const qtdParcelas = Math.ceil(produto.valor / desconto);
            return {
                produto: produto.nome,
                valor: produto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                desconto: desconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                parcelas: qtdParcelas
            };
        });

        // Limpa e inicializa a tabela
        $(`#tabelaDescontos`).DataTable({
            destroy: true,
            paging: true,
            pageLength: 5,
            lengthChange: false, 
            lengthMenu: false,
            searching: false,
            ordering: false,
            info: false,
            autoWidth: false,
            columns: columns,
            data: data
        });
    },
    
    getFuncionarios: async function (inputId) {
        const novoArrayFuncionarios = [];
        const requestData = {
            url: `${WCMAPI.serverURL}/api/public/ecm/dataset/datasets`,
            method: 'POST',
        };
        const data = {
            name: 'ds_consulta_funcionarios_protheus',
            fields: [],
            constraints: [
                {
                    _field: 'CDESCRICAO',
                    _initialValue: 'ALL',
                    _finalValue: 'ALL',
                    _type: 0,
                    _likeSearch: true,
                },
                {
                    _field: 'RETORNADEMITIDOS',
                    _initialValue: '',
                    _finalValue: 'false',
                    _type: 0,
                    _likeSearch: true,
                },
            ],
            order: [],
        };

        try {
            const response = await $.ajax({
                url: requestData.url,
                contentType: 'application/json',
                crossDomain: true,
                type: requestData.method,
                data: JSON.stringify(data),
            });

            const jsonParse = JSON.parse(JSON.stringify(response));
            if (jsonParse.content.values.length > 0) {
                jsonParse.content.values.forEach((element) => {
                    novoArrayFuncionarios.push({
                        CCODIGO: element.CCODIGO,
                        CDESCRICAO: element.CDESCRICAO,
                        RA_CIC: element.RA_CIC,
                        description: `${element.CCODIGO} - ${element.CDESCRICAO}`
                    });
                });
            } else {
                console.error('Lista de funcionários retornou vazia!');
            }
        } catch (error) {
            console.error('Erro ao obter lista de funcionários:', error);
        }

        initAutoComplete({
            name: inputId,
            source: novoArrayFuncionarios,
            search: [ 'CCODIGO', 'CDESCRICAO' ],
            onSelect: async (autocomplete, item) => {
                const dsFuncionario = item.description;
                setInputValue(`#${inputId}`, dsFuncionario);
            },
            onRemove: (autocomplete, item) => {
                setInputValue(`#${inputId}`, '');
            },
        }, 'tagAutocomplete');
    },

    consultarFuncionario: function () {
        const funcionarios = [
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
                    { nome: "carro", valor: 50000.00 },
                    { nome: "Bota de Segurança", valor: 250.00 },
                    { nome: "Tablet", valor: 700.00 },
                    { nome: "Celular", valor: 900.00 },
                    { nome: "Uniforme", valor: 120.00 },
                    { nome: "Ferramenta", valor: 180.00 },
                    { nome: "Bicicleta", valor: 500.00 },
                    { nome: "Notebook", valor: 3000.00 },
                    { nome: "Cadeira de Escritório", valor: 800.00 },
                    { nome: "Mesa de Escritório", valor: 1200.00 },
                    { nome: "Monitor", valor: 1500.00 }
                    
                ]
            }
        ];

        $('#btn-buscar').on('click', () => {
            const valorInput = $('#codFuncionario').val();
            const nomeFuncionario = valorInput.split(' - ')[ 1 ] ? valorInput.split(' - ')[ 1 ].trim() : valorInput.trim();
            if (!nomeFuncionario) {
                showSweetAlert('Atenção', 'Digite o nome ou código do funcionário.', 'warning');
                $('#painelFuncionario').hide();
                return;
            }
            const funcionario = funcionarios.find(f => f.nome.toUpperCase() === nomeFuncionario.toUpperCase());
            if (funcionario) {
                $('#dadosFuncionario').html(`
                <h4>Funcionário: ${funcionario.nome}</h4>
                <h4>CPF: ${funcionario.cpf}</h4>
            `);

                // Chama o DataTable para exibir os produtos
                MyWidget.processDataTable(funcionario.produtos, funcionario.salario);

                $('#btn-limpar').show();
                $('#painelFuncionario').show();
            } else {
                showSweetAlert('Atenção', 'Funcionário não encontrado.', 'info');
                $('#dadosFuncionario').html('');
                $('#tabelaDescontos').html('');
                $('#painelFuncionario').hide();
            }
        });

        $('#btn-limpar').on('click', function () {
            $('#codFuncionario').val('');
            $('#dadosFuncionario').html('');
            $('#tabelaDescontos').html('');
            $(this).hide();
            $('#painelFuncionario').hide();
        })
    }
});

const initAutoComplete = (options, autoType) => {
    console.log(options);

    if (!options.name) {
        throw Error('Undefined name to autocomplete.')
    }
    if (!options.source) {
        throw Error('Undefined source to autocomplete.')
    }
    if (!options.search) {
        throw Error('Undefined search to autocomplete.')
    }
    window[ options.name ] = FLUIGC.autocomplete('#' + options.name, {
        source: substringMatcher(options.source),
        displayKey: 'description',
        type: autoType,
        tagClass: 'tag-gray',
        maxTags: 1,
        onMaxTags: (item, tag) => {
            FLUIGC.toast({
                message: 'Apenas um item pode ser selecionado...',
                type: 'warning',
                timeout: 2000
            })
        }
    })
        .on('fluig.autocomplete.itemAdded', event => {
            onSelectAutoComplete(event.item, false)
        })
        .on('fluig.autocomplete.itemUpdated', event => {
            onSelectAutoComplete(event.item, false)
        })
        .on('fluig.autocomplete.itemRemoved', event => {
            onSelectAutoComplete(event.item, true)
        })
    const setSelected = () => {
        const inputs = document.querySelectorAll('[data-autocomplete="' + options.name + '"]')
        const data = {}
        inputs.forEach(input => {
            if (input.value.trim() != '') {
                data[ input.getAttribute('id').replace(options.name + '_', '') ] = input.value
            }
        })
        if (window[ options.name ] && Object.keys(data).length > 0) {
            window[ options.name ].add(data)
        }
    }
    const onSelectAutoComplete = (item, removed) => {
        const inputs = document.querySelectorAll('[data-autocomplete="' + options.name + '"]')
        if (!removed) {
            let inputValue = ''
            options.search.forEach((searchColumn, index) => {
                if (options.search.length == (index + 1)) {
                    inputValue += item[ searchColumn ]
                }
                else {
                    inputValue += item[ searchColumn ] + ' - '
                }
            })
            setInputValue('#' + options.name, inputValue)
            inputs.forEach(input => {
                if (item[ input.getAttribute('id').replace(options.name + '_', '') ]) {
                    setInputValue('#' + input.getAttribute('id'), item[ input.getAttribute('id').replace(options.name + '_', '') ])
                }
            })
            if (options.onSelect) {
                options.onSelect(window[ options.name ], item)
            }
        }
        else {
            setInputValue('#' + options.name, '')
            inputs.forEach(input => {
                if (item[ input.getAttribute('id').replace(options.name + '_', '') ]) {
                    setInputValue('#' + input.getAttribute('id'), '')
                }
            })
            if (options.onRemove) {
                options.onRemove(window[ options.name ], item)
            }
        }
    }
    setSelected();
}

const substringMatcher = (array) => {
    return function findMatches(q, cb) {
        const matches = [];
        const substrRegex = new RegExp(q, 'i');

        array.forEach(item => {
            // Busca no CCODIGO, CDESCRICAO e RA_CIC
            if (
                substrRegex.test(item.CCODIGO) ||
                substrRegex.test(item.CDESCRICAO)
            ) {
                matches.push(item);
            }
        });

        cb(matches);
    };
};


const setInputValue = (selector, value) => {
    if (document.querySelector(selector)) {
        document.querySelector(selector).value = value
    }
}