/**
 * Obtém a lista de filiais e preenche um campo select.
 * @param {string} inputId - ID do campo select para preenchimento.
 */
async function getFuncionarios(inputId) {
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
                _initialValue: 'false',
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
                const listaFuncionarios = `${element.RA_FILIAL} - ${element.CCODIGO} - ${element.CDESCRICAO}`;
                novoArrayFuncionarios.push(listaFuncionarios);
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
        onSelect: (autocomplete, item) => {
            setInputValue(`#${inputId}`, item.description || '');
        },
        onRemove: () => {
            setInputValue(`#${inputId}`, '');
        },
    }, 'tagAutocomplete');
}

async function getFiliais(inputId) {
    $(`#${inputId}`).find('option').remove();

    const requestData = {
        url: `${WCMAPI.serverURL}/api/public/ecm/dataset/datasets`,
        method: 'POST',
    };
    const data = {
        name: 'ds_get_filiais_protheus',
        fields: [],
        constraints: [],
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
            $(`#${inputId}`).append('<option value="" selected>Todas</option>');
            jsonParse.content.values.forEach((element) => {
                $(`#${inputId}`).append(
                    `<option value="${element.M0_CODFIL?.trim()} - ${element.M0_FILIAL?.trim()} - ${element.M0_FULNAME?.trim()}">${element.M0_CODFIL?.trim()} - ${element.M0_FILIAL?.trim()} - ${element.M0_FULNAME?.trim()}</option>`
                );
            });
        } else {
            console.error('Lista de Filiais retornou vazia!');
        }
    } catch (error) {
        console.error('Erro ao obter lista de Filiais:', error);
    }
}

async function getCentroCusto(inputId, optionSelected) {
    $(`#${inputId}`).find('option').remove();

    const requestData = {
        url: `${WCMAPI.serverURL}/api/public/ecm/dataset/datasets`,
        method: 'POST',
    };
    const data = {
        name: 'dsConsultaCentroCustoProtheus',
        fields: [],
        constraints: [],
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
            $(`#${inputId}`).append('<option value="" selected>Todos</option>');
            jsonParse.content.values.forEach((element) => {
                $(`#${inputId}`).append(
                    `<option value="${element.CCODIGO?.trim()} - ${element.CDESCRICAO?.trim()}">${element.CCODIGO?.trim()} - ${element.CDESCRICAO?.trim()}</option>`
                );
            });

            if (optionSelected) {
                $(`#${inputId}`).val(optionSelected);
            }
        } else {
            console.error('Lista de Centro de Custos retornou vazia!');
        }
    } catch (error) {
        console.error('Erro ao obter lista de Centro de Custos:', error);
    }
}

const initAutoComplete = (options, autoType) => {
    if (!options.name) {
        throw new Error('Undefined name for autocomplete.');
    }
    if (!options.source) {
        throw new Error('Undefined source for autocomplete.');
    }

    window[options.name] = FLUIGC.autocomplete(`#${options.name}`, {
        source: substringMatcher(options.source),
        displayKey: 'description',
        type: autoType,
        tagClass: 'tag-gray',
        maxTags: 1,
        onMaxTags: () => {
            FLUIGC.toast({
                message: 'Apenas um item pode ser selecionado...',
                type: 'warning',
                timeout: 2000,
            });
        },
    })
        .on('fluig.autocomplete.itemAdded', (event) => {
            if (options.onSelect) {
                options.onSelect(window[options.name], event.item);
            }
        })
        .on('fluig.autocomplete.itemUpdated', (event) => {
            if (options.onSelect) {
                options.onSelect(window[options.name], event.item);
            }
        })
        .on('fluig.autocomplete.itemRemoved', (event) => {
            if (options.onRemove) {
                options.onRemove(window[options.name], event.item);
            }
        });
};

const substringMatcher = (strs) => {
    return function findMatches(q, cb) {
        const matches = [];
        const substrRegex = new RegExp(q, 'i');

        strs.forEach((str) => {
            if (substrRegex.test(str)) {
                matches.push({ description: str });
            }
        });

        cb(matches);
    };
};

const setInputValue = (selector, value) => {
    const input = document.querySelector(selector);
    if (input) {
        input.value = value;
    }
};