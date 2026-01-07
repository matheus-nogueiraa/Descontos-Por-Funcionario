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
            'execute': [ 'click_executeAction' ]
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
                setTimeout(function() {
                    $('#switchMsg').html('');
                }, 3000);
            })
            .fail(function (err) {
                console.error('Erro ao atualizar formulário', err);
                $('#switchMsg').html('<i class="text-danger">✗ Erro ao atualizar</i>');
                
                // Limpar mensagem após 3 segundos
                setTimeout(function() {
                    $('#switchMsg').html('');
                }, 3000);
            })
            .always(function () {
                self.setLoading(false);
            });
    }


});

