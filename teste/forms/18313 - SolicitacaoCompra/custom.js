/*
 *
 *
 * custom.js
 *
 *
*/

$(document).ready(function (obj) {
    const numState = getWKNumState();
    outsideTask(numState);
    panelTask(numState);
    insideTask(numState);
    if (FORM_MODE == 'VIEW') {
        $(".alertaCompraTableNull").hide();
        $(".alertaFrotaTableNull").hide();
    }
});

var atividade = {
    ZERO: 0,
    INICIO: 4,
    GERENTEALMOXARIFADO: 37,
    CORRIGIRALMOXARIFADO: 43,
    ANALISE: 7,
    CORRIGIR: 24,
    ERRO_INTEGRACAO: 21
};

function outsideTask(numState) {
    if (numState != atividade.ZERO && numState != atividade.INICIO && numState != atividade.CORRIGIR && numState != atividade.CORRIGIRALMOXARIFADO) {
        $(".alertaCompraTableNull, .alertaFrotaTableNull").hide();
        var camposInicio = [
            'tipo_solicitacao_compra',
            'tipo_solicitacao_frota',
            'btnAddItem_compra',
            'btnAnexarCotacao',
            'btnAddItem_frota',
            'zoom_area_responsavel',
            'prioridade_solicitacao',
            'obs_gerais',
            'campo_checkbox_2',
            'campo_checkbox_3',
            'campo_button'
        ]; setReadonlyElements(camposInicio);

        var compra_tableName = "tabela_itens_compras";
        var compra_indexId = "descricao_material_compras___";
        var compra_tableFields = [
            'descricao_material_compras___',
            'descricao_ccusto_compras___',
            'data_necessidade_compras___',
            'info_adicionais_item_compras___'
        ]; readonlyPaiFilho(compra_tableName, compra_indexId, compra_tableFields);

        var frota_tableName = "tabela_itens_frota";
        var frota_indexId = "descricao_material_frota___";
        var frota_tableFields = [
            'descricao_material_frota___',
            'data_necessidade_frota___',
            'info_adicionais_material_frota___'
        ]; readonlyPaiFilho(frota_tableName, frota_indexId, frota_tableFields);
    }
    if (numState != atividade.ANALISE) {
        $(".buttonHistoricoCompra, .buttonHistoricoFrota").hide();
        var camposAnalise = [
            'resultado_analise_gestor',
            'gestor_obs'
        ]; setReadonlyElements(camposAnalise);
    }
    if (numState != atividade.GERENTEALMOXARIFADO) {
        $(".buttonHistoricoCompra, .buttonHistoricoFrota").hide();
        var camposGerenteAlmoxarifado = [
            'resultado_gerenteAlmoxarifado',
            'gerenteAlmoxarifado_obs'
        ]; setReadonlyElements(camposGerenteAlmoxarifado);
    }
}

function panelTask(numState) {
    if (numState == atividade.ZERO || numState == atividade.INICIO || numState == atividade.CORRIGIR) {
        var inicio = [
            '#panel_compra',
            '#panel_frota',
            '#panel_gestor',
            '#panel_integracao',
            '#panel_gerenteAlmoxarifado'
        ]; $("" + inicio).hide();
    }
    if (numState == atividade.GERENTEALMOXARIFADO) {
        var gestor = [
            '#panel_frota',
            '#panel_gestor',
            '#panel_integracao'
        ]; $("" + gestor).hide();
    }
    if (numState == atividade.ANALISE) {
        var gestor = [
            '#panel_compra',
            '#panel_frota',
            '#panel_integracao'
        ]; $("" + gestor).hide();
    }

    if (FORM_MODE == "MOD") {
        $('#panel_gerenteAlmoxarifado').hide();

        $('#tabela_itens_compras').find('tbody').find('tr').not(':first').each((index, tr) => {
            let idTr = $(tr).attr('id');

            if (idTr.startsWith("lineProducts") && idTr.includes("___")) {
                let indexTr = idTr.split('___')[1];

                var tipoProduto = $(`#tipoProduto___${indexTr}`).val()?.trim();

                if (tipoProduto == "M1" || tipoProduto == "M2" || tipoProduto == "M3") {
                    $('#panel_gerenteAlmoxarifado').show();
                }
            }
        });
    }
}

function insideTask(numState) {
    if (numState == atividade.ZERO || numState == atividade.INICIO) {
        if (FORM_MODE == "ADD") {
            getFluigUser();
            clickTipoSolicitacao();
        }

        if (FORM_MODE == "MOD") {
            var tipo_solicitacao = $('input[name="tipo_solicitacao"]:checked').val();
            if (tipo_solicitacao == "COMPRA") {
                $("#panel_compra").show();
                $("#panel_frota").hide();
            } else if (tipo_solicitacao == "FROTA") {
                $("#panel_compra").hide();
                $("#panel_frota").show();
            }
        }
    }

    if (numState == atividade.CORRIGIR) {
        clickTipoSolicitacao();
        tipoSelecionado();
        correcaoGestor();
        resultadoAnalise();
    }
    if (numState == atividade.ANALISE || numState == atividade.CORRIGIRALMOXARIFADO) {
        clickModalCompra();
        clickModalFrota();
        tipoSelecionado();
        montaArrayExternoTabela();
        readonlyTableCompra();
    }
}

function montaArrayExternoTabela() {
    var array_itens = $("#array_itens").val();
    if (array_itens != null || array_itens != "") {
        var arrayItens = JSON.parse(array_itens);
        for (var i = 0; i < arrayItens.length; i++) {
            var item = arrayItens[i];
            var descricao = item.descricao;
            var quantidade = item.quantidade;
            var unidade = item?.unidade == null ? "" : item?.unidade;
            var centrocusto = item.centrocusto;
            var datanecessidade = item.datanecessidade;
            var observacao = item.observacao;
            var indexLinha = wdkAddChild('tabela_itens_compras');
            var parts_prod = descricao.split(" - ");
            var codigo_produto = parts_prod[0];
            var descricao_produto = parts_prod[1];
            var parts_ccusto = centrocusto.split(" - ", 2);
            var codigo_ccusto = parts_ccusto[0];
            var descricao_ccusto = parts_ccusto[1];
            $("#zoom_area_responsavel").val($("#ccusto_solicitante").val());
            $("#numero_linha___" + indexLinha).val(i + 1);
            $("#codigo_material_compras___" + indexLinha).val(codigo_produto);
            $("#descricao_material_compras___" + indexLinha).val(descricao_produto);
            $("#quantidade_material_compras___" + indexLinha).val(quantidade);
            $("#unidade_material_compras___" + indexLinha).val(unidade);
            $("#codigo_ccusto_compras___" + indexLinha).val(codigo_ccusto);
            $("#descricao_ccusto_compras___" + indexLinha).val(centrocusto);
            $("#data_necessidade_compras___" + indexLinha).val(datanecessidade);
            $("#info_adicionais_item_compras___" + indexLinha).val(observacao);
        }
    }
    $("#qtd_itens_compras").val(arrayItens.length);
}



function tipoSelecionado() {
    var tipo = $('input[name="tipo_solicitacao"]:checked').val();
    if (tipo == "COMPRA") {
        $("#panel_compra").show();
        $("#panel_frota").hide();
    } else if (tipo == "FROTA") {
        $("#panel_frota").show();
        $("#panel_compra").hide();
    }
}

function correcaoGestor() {
    var gestor = $("#resultado_analise_gestor").val();
    if (gestor == "Corrigir") {
        $("#panel_gestor").show();
    } else {
        $("#panel_gestor").hide();
    }

    if ($("#qtd_itens_compras").val() != 0) {
        $(".alertaCompraTableNull").hide();
    } else {
        $(".alertaCompraTableNull").show();
    }

    if ($("#qtd_itens_frota").val() != 0) {
        $(".alertaFrotaTableNull").hide();
    } else {
        $(".alertaFrotaTableNull").show();
    }
}