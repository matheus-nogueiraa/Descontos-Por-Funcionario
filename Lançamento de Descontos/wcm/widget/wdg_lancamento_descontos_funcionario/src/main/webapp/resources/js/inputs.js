/**
 * Obtém a lista de funcionários e inicializa o autocomplete.
 * @param {string} inputId - ID do campo de input para o autocomplete preencher.
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
    search: ['RA_FILIAL', 'CCODIGO', 'CDESCRICAO'],
    onSelect: async (autocomplete, item) => {
      const dsFuncionario = item.description;
      console.log('--initAutoComplete-- dsFuncionario:', dsFuncionario);
      setInputValue(`#${inputId}`, dsFuncionario);
    },
    onRemove: (autocomplete, item) => {
      setInputValue(`#${inputId}`, '');
    },
  }, 'tagAutocomplete');
}

/**
 * Inicializa o autocomplete com as opções fornecidas.
 * @param {Object} options - Opções de configuração do autocomplete.
 * @param {string} options.name - Nome do campo de autocomplete.
 * @param {Array} options.source - Fonte de dados para o autocomplete.
 * @param {Array} options.search - Colunas de busca no autocomplete.
 * @param {Function} [options.onSelect] - Função chamada ao selecionar um item.
 * @param {Function} [options.onRemove] - Função chamada ao remover um item.
 * @param {string} autoType - Tipo de autocomplete (opcional).
 * @throws {Error} Lança um erro se `name`, `source` ou `search` não forem fornecidos.
 */
const initAutoComplete = (options, autoType) => {
  if (!options.name) {
    throw new Error('Undefined name for autocomplete.');
  }
  if (!options.source) {
    throw new Error('Undefined source for autocomplete.');
  }
  if (!options.search) {
    throw new Error('Undefined search for autocomplete.');
  }

  // Inicializa o autocomplete
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
      onSelectAutoComplete(event.item, false);
    })
    .on('fluig.autocomplete.itemUpdated', (event) => {
      onSelectAutoComplete(event.item, false);
    })
    .on('fluig.autocomplete.itemRemoved', (event) => {
      onSelectAutoComplete(event.item, true);
    });

  /**
   * Define os valores selecionados nos campos de input.
   */
  const setSelected = () => {
    const inputs = document.querySelectorAll(`[data-autocomplete="${options.name}"]`);
    const data = {};

    inputs.forEach((input) => {
      if (input.value.trim() !== '') {
        const fieldId = input.getAttribute('id').replace(`${options.name}_`, '');
        data[fieldId] = input.value;
      }
    });

    if (window[options.name] && Object.keys(data).length > 0) {
      window[options.name].add(data);
    }
  };

  /**
   * Manipula a seleção ou remoção de um item no autocomplete.
   * @param {Object} item - Item selecionado ou removido.
   * @param {boolean} removed - Indica se o item foi removido.
   */
  const onSelectAutoComplete = (item, removed) => {
    const inputs = document.querySelectorAll(`[data-autocomplete="${options.name}"]`);

    if (!removed) {
      // Concatena os valores das colunas de busca
      const inputValue = options.search
        .map((searchColumn, index) => {
          return index === options.search.length - 1
            ? item[searchColumn]
            : `${item[searchColumn]} - `;
        })
        .join('');

      setInputValue(`#${options.name}`, inputValue);

      // Preenche os campos relacionados
      inputs.forEach((input) => {
        const fieldId = input.getAttribute('id').replace(`${options.name}_`, '');
        if (item[fieldId]) {
          setInputValue(`#${input.getAttribute('id')}`, item[fieldId]);
        }
      });

      // Chama a função onSelect, se definida
      if (options.onSelect) {
        options.onSelect(window[options.name], item);
      }
    } else {
      // Limpa os campos ao remover um item
      setInputValue(`#${options.name}`, '');
      inputs.forEach((input) => {
        const fieldId = input.getAttribute('id').replace(`${options.name}_`, '');
        if (item[fieldId]) {
          setInputValue(`#${input.getAttribute('id')}`, '');
        }
      });

      // Chama a função onRemove, se definida
      if (options.onRemove) {
        options.onRemove(window[options.name], item);
      }
    }
  };

  // Define os valores iniciais
  setSelected();
};

/**
 * Função para buscar correspondências no autocomplete.
 * @param {Array} strs - Lista de strings para busca.
 * @returns {Function} Função que retorna as correspondências.
 */
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

/**
 * Define o valor de um campo de input.
 * @param {string} selector - Seletor do campo de input.
 * @param {string} value - Valor a ser definido.
 */
const setInputValue = (selector, value) => {
  const input = document.querySelector(selector);
  if (input) {
    input.value = value;
  }
};

async function autoSelect(inputId, selectValue) {
  if (window[inputId]) {
    window[inputId].removeAll();
  }

  if (selectValue) {
    const selectedItem = {
      description: selectValue,
    };


    if (window[inputId]) {
      window[inputId].add(selectedItem);
      const event = new CustomEvent('fluig.autocomplete.itemAdded', { detail: { item: selectedItem } });
      document.querySelector(`#${inputId}`).dispatchEvent(event);
    }
  }
}