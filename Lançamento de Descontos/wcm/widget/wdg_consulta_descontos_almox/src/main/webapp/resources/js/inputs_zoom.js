/**
 * Obtém a lista de filiais e preenche um campo select.
 * @param {string} inputId - ID do campo select para preenchimento.
 */
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