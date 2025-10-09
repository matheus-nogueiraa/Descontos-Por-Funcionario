/*
 *
 *
 * fields_required.js
 *
 *
*/


var beforeSendValidate = function(numState,nextState){
    inputsDisabled();

    var msg = "";
    var activity = getWKNumState();
    var tipo_solicitacao = $('input[name="tipo_solicitacao"]:checked').val();
    var codigo_grupo = $("#codigo_grupo").val();
    var prioridade_solicitacao = $("#prioridade_solicitacao").val();
    var tblcompra = $("table#tabela_itens_compras tr td [id^='codigo_material_compras___']");
    var tblfrota = $("table#tabela_itens_frota tr td [id^='ccusto_ordem_servico___']");
    var status_gerenteAlmoxarifado = $("#resultado_gerenteAlmoxarifado").val();
    var obs_gerenteAlmoxarifado = $("#gerenteAlmoxarifado_obs").val();
    var status_gestor = $("#resultado_analise_gestor").val();
    var obs_gestor = $("#gestor_obs").val();

    if (activity == 0 || activity == 4){
        if (tipo_solicitacao == undefined){ 
            msg += "Tipo de solicitação";
        }
        else if (prioridade_solicitacao == "" || prioridade_solicitacao == null){
            msg += "Prioridade da Solicitação"
        }
        else if (tipo_solicitacao == "COMPRA"){
            if (codigo_grupo == "" || codigo_grupo == null){
                msg += "Responsável pela aprovação da compra";
            }else if (tblcompra.length == 0){
                msg += "Nenhum item foi adicionado na tabela de compra";
            }else if (tblcompra.length != 0){
                for(i=0; i < tblcompra.length; i++){
                    var idx = tblcompra[i].id.split('___');
                    if ($("#descricao_material_compras___"+idx[1]).val() == null || $("#descricao_material_compras___"+idx[1]).val() == ""){
                        msg += "Material";
                    }
                    else if ($("#quantidade_material_compras___"+idx[1]).val() == null || $("#quantidade_material_compras___"+idx[1]).val() == ""){
                        msg += "Quantidade";
                    }
                    else if ($("#descricao_ccusto_compras___"+idx[1]).val() == null || $("#descricao_ccusto_compras___"+idx[1]).val() == ""){
                        msg += "Centro de custo";
                    }
                    else if ($("#data_necessidade_compras___"+idx[1]).val() == null || $("#data_necessidade_compras___"+idx[1]).val() == ""){
                        msg += "Data da necessidade";
                    }
                }
            }
        }else if (tipo_solicitacao == "FROTA"){
            if (tblfrota.length == 0){
                msg += "Nenhum item foi adicionado na tabela de ordem de serviço";
            }else if (tblfrota.length != 0){
                for (i=0; i < tblfrota.length; i++){
                    var idx = tblfrota[i].id.split('___');
                    if ($("#ordem_servico___"+idx[1]).val() == null || $("#ordem_servico___"+idx[1]).val() == ""){
                        msg += "Ordem de serviço";
                    }
                    else if ($("#descricao_material_frota___"+idx[1]).val() == null || $("#descricao_material_frota___"+idx[1]).val() == ""){
                        msg += "Material";
                    }
                    else if ($("#quantidade_material_frota___"+idx[1]).val() == null || $("#quantidade_material_frota___"+idx[1]).val() == ""){
                        msg += "Quantidade";
                    }
                    else if ($("#data_necessidade_frota___"+idx[1]).val() == null || $("#data_necessidade_frota___"+idx[1]).val() == ""){
                        msg += "Data da necessidade";
                    }
                }
            }
        }
    }

    if (activity == 37){
        if (status_gerenteAlmoxarifado == "" || status_gerenteAlmoxarifado == null){
            msg += "Status da análise Gerente Almoxarifado";
        }else if ((status_gerenteAlmoxarifado == "Reprovado" && obs_gerenteAlmoxarifado == "" || obs_gerenteAlmoxarifado == null)){
            msg += "Observação do Gerente de Almoxarifado";
        }else if ((status_gerenteAlmoxarifado == "Corrigir" && obs_gerenteAlmoxarifado == "" || obs_gerenteAlmoxarifado == null)){
            msg += "Observação do Gerente de Almoxarifado";
        }
    }

    if (activity == 7){
        if (status_gestor == "" || status_gestor == null){
            msg += "Status da análise";
        }else if ((status_gestor == "Reprovado" && obs_gestor == "" || obs_gestor == null)){
            msg += "Observação do gestor";
        }else if ((status_gestor == "Corrigir" && obs_gestor == "" || obs_gestor == null)){
            msg += "Observação do gestor";
        }
    }

    // custom msg
    if (msg != ""){
        customMsg(msg.toString());
        return false;
    }
}

function customMsg(paramMsg){
    var msg = paramMsg;
    showSweetTimerAlert("Campo Obrigatório!<br><b>"+msg+"</b>", "warning");
}