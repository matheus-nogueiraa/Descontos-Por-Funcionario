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
}

async function getFilias(inputId) {
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
      $(`#${inputId}`).append('<option value="" disabled>Selecione uma filial</option>');
      let selectedOption = null;

      jsonParse.content.values.forEach((element) => {
        const optionValue = `${element.M0_CODFIL?.trim()} - ${element.M0_FILIAL?.trim()} - ${element.M0_FULNAME?.trim()}`;
        const option = `<option value="${optionValue}">${optionValue}</option>`;
        $(`#${inputId}`).append(option);

        // Verifica se a filial começa com "0101" e define como selecionada
        if (element.M0_CODFIL?.trim() === "0101") {
          selectedOption = optionValue;
        }
      });

      // Seleciona a opção que começa com "0101", se encontrada
      if (selectedOption) {
        $(`#${inputId}`).val(selectedOption);
      }
    } else {
      console.error('Lista de Filiais retornou vazia!');
    }
  } catch (error) {
    console.error('Erro ao obter lista de Filiais:', error);
  }
}

async function getMateriais(inputId) {
  const novoArrayEpiList = [];
  const requestData = {
    url: `${WCMAPI.serverURL}/api/public/ecm/dataset/datasets`,
    method: 'POST',
  };
  const data = {
    name: 'dsConsultaProduto',
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
        _field: 'TIPOPRD',
        _initialValue: 'M1;M2;M3',
        _finalValue: 'M1;M2;M3',
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
        novoArrayEpiList.push({
          description: `${element.CCODIGO?.trim()} - ${element.CDESCRICAO.trim()}`,
          CCODIGO: element.CCODIGO?.trim(),
          CDESCRICAO: element.CDESCRICAO?.trim()
        });
      });
    } else {
      console.error("Lista de EPI's retornou vazia!");
    }
  } catch (error) {
    console.error("Erro ao obter lista de EPI's:", error);
  }

  initAutoComplete({
    name: inputId,
    source: novoArrayEpiList,
    search: [ 'CCODIGO', 'CDESCRICAO' ],
    onSelect: async (autocomplete, item) => {
      const dsEPIsList = item.description;
      setInputValue(`#${inputId}`, dsEPIsList);
      pegaFornecedoresEpi(inputId, dsEPIsList);
    },
    onRemove: (autocomplete, item) => {
      setInputValue(`#${inputId}`, '');
      limpaSelectFornecedoresEpi(inputId);
    },
  }, 'tagAutocomplete');
}


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

