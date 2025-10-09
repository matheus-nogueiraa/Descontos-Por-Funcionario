/*
 *
 *
 * functions.js
 *
 *
*/

function getFluigUser(){
    $.ajax({
        url: '/api/public/2.0/users/getCurrent', 
        type: "GET",
    }).done(function(data) {
        let login = data.content.code;
        let full_name = data.content.fullName;
        let ccusto = data.content.extData.ccusto;
        let superior = data.content.extData.nomegestor;
        let filial = data.content.extData.codfilial;
        let departamento = data.content.extData.nomedepto;
        let code_matricula = data.content.code;
        $("#ccusto_solicitante").val(ccusto);
        $("#superior_solicitante").val(superior);
        $("#filial_solicitante").val(filial);
        $("#depto_solicitante").val(departamento);
        $("#hidden_soli_matricula").val(code_matricula); 
    });
}

function clickTipoSolicitacao(){
    if (FORM_MODE == "ADD"){
        $('input:radio[name="tipo_solicitacao"]').change(function() {
            if ($("input[name='tipo_solicitacao']:checked")) {
                var tipo_solicitacao = $('input[name="tipo_solicitacao"]:checked').val();
                if (tipo_solicitacao == "COMPRA") {
                    $("#panel_compra").show();
                    $("#panel_frota").hide();
                    window['zoom_area_responsavel'].clear();
                    $('table[tablename=tabela_itens_frota] tbody tr').not(':first').remove();
                    rowsCountFrotas();
                    showSweetTimerAlert("Solicitação de compra", "warning");
                    if ($("#qtd_itens_compras").val() != 0 ){
                        $(".alertaCompraTableNull").hide();
                    }else {
                        $(".alertaCompraTableNull").show();
                    }
                }
                if (tipo_solicitacao == "FROTA") {
                    $("#panel_frota").show();
                    $("#panel_compra").hide();
                    $("#codigo_grupo").val("");
                    $('table[tablename=tabela_itens_compras] tbody tr').not(':first').remove();
                    rowsCountCompras();
                    showSweetTimerAlert("Ordem de serviço", "warning");
                    
                    if ($("#qtd_itens_frota").val() != 0 ){
                        $(".alertaFrotaTableNull").hide();
                    }else {
                        $(".alertaFrotaTableNull").show();
                    }
                }
            } 
        });
    }
}

/* pai x filho */
function addItemCompras() {
    wdkAddChild('tabela_itens_compras');
    contadorLinhas();
    rowsCountCompras();
    $(".alertaCompraTableNull").hide();

    var tblcompra = $("table#tabela_itens_compras tr td [id^='descricao_material_compras___']");
    for(i=0;i<tblcompra.length;i++){
        var idx = tblcompra[i].id.split('___');
        var dias = 10;
        var dataHoje = new Date();
        var calendarioFluig = FLUIGC.calendar("#data_necessidade_compras___" +idx[1]);
        dataHoje.setDate(dataHoje.getDate() + dias);
        calendarioFluig.setMinDate(dataHoje);

        $("#data_necessidade_compras___" + idx[1]).click(function() {
            $(this).val("");
        });
        $("#data_necessidade_compras___" + idx[1]).keyup(function() {
            formatarData($(this));
            validarDataMaiorOuIgualHoje($(this));
        });
    }
}

function DeleteItemCompras(oElement) {
    fnWdkRemoveChild(oElement);
    contadorLinhas();
    rowsCountCompras();

    if ($("#qtd_itens_compras").val() != 0 ){
        $(".alertaCompraTableNull").hide();
    }else {
        $(".alertaCompraTableNull").show();
    }
}
function rowsCountCompras() {
    var cont = 0;
    $('input[id^=codigo_material_compras___]').each(function () {
        this.id = $(this).attr('id');
        this.value = $(this).val();
        cont++;
    });
    $("#qtd_itens_compras").val(cont);
}

function contadorLinhas(){
    var tbl = $("table#tabela_itens_compras tr td [id^='descricao_material_compras___']");
    for (i=0;i<tbl.length;i++){
        var idx = tbl[i].id.split('___');
    }
    if (tbl.length != 0){
        $("#numero_linha___"+ idx[1]).val(tbl.length);
    }
}


function AddItemFrotas() {
    wdkAddChild('tabela_itens_frota');
    contadorLinhasFrotas();
    rowsCountFrotas();
    $(".alertaFrotaTableNull").hide();

    var tblcompra = $("table#tabela_itens_frota tr td [id^='descricao_material_frota___']");
    for(i=0;i<tblcompra.length;i++){
        var idx = tblcompra[i].id.split('___');
        var dias = 10;
        var dataHoje = new Date();
        var calendarioFluig = FLUIGC.calendar("#data_necessidade_frota___" +idx[1]);
        dataHoje.setDate(dataHoje.getDate() + dias);
        calendarioFluig.setMinDate(dataHoje);
    }

}
function DeleteItemFrotas(oElement) {
    fnWdkRemoveChild(oElement);
    contadorLinhasFrotas();
    rowsCountFrotas();

    if ($("#qtd_itens_frota").val() != 0 ){
        $(".alertaFrotaTableNull").hide();
    }else {
        $(".alertaFrotaTableNull").show();
    }
}
function rowsCountFrotas() {
    var cont = 0;
    $('input[id^=codigo_material_frota___]').each(function () {
        this.id = $(this).attr('id');
        this.value = $(this).val();
        cont++;
    });
    $("#qtd_itens_frota").val(cont);
}

function contadorLinhasFrotas(){
    var tbl = $("table#tabela_itens_frota tr td [id^='descricao_material_frota___']");
    for (i=0;i<tbl.length;i++){
        var idx = tbl[i].id.split('___');
    }
    if (tbl.length != 0){
        $("#numero_linha_frota___"+ idx[1]).val(tbl.length);
    }
}

function formatarData(input) {
    let valor = input.val().replace(/\D/g, '');
    if (valor.length > 2 && valor.length <= 4) {
        valor = valor.replace(/^(\d{2})(\d{0,2})/, '$1/$2');
    }else if (valor.length > 4) {
        valor = valor.replace(/^(\d{2})(\d{2})(\d{0,4})/, '$1/$2/$3');
    }
    input.val(valor.slice(0, 10));
}

function validarDataMaiorOuIgualHoje(input) {
    let valor = input.val().replace(/\D/g, '');
    if (!/^(\d{2})(\d{2})(\d{4})$/.test(valor)) {
        input.val('');
        showSweetTimerAlert("Utilize o calendário para escolher a data no formato dd/mm/aaaa.", "warning");
        return;
    }
    if (valor.length === 8) {
        const dia = parseInt(valor.substring(0, 2));
        const mes = parseInt(valor.substring(2, 4)) - 1;
        const ano = parseInt(valor.substring(4, 8));
        const dataInserida = new Date(ano, mes, dia);
        const dataAtual = new Date();
        const dataLimite = new Date(dataAtual);
        dataLimite.setDate(dataLimite.getDate() + 9);
        if (dataInserida < dataLimite) {
            input.val(''); 
            showSweetTimerAlert("A data inserida está fora do intervalo permitido.", "warning");
        }
    }
}

/* zoom */
function getIndex(typeSelected) {
    var id = typeSelected.split('___');
    if (id.length == 2) {
        return id[1];
    } else {
        return id[2];
    }
}
function setSelectedZoomItem(selectedItem) {
    var index = getIndex(selectedItem['inputId']);
    if (selectedItem.inputId == "zoom_area_responsavel"){    
        $("#codigo_grupo").val(selectedItem["grupoAprovador"]);
    }
    if (selectedItem.inputId == "descricao_material_compras___"+index){     
        $("#codigo_material_compras___"+index).val(selectedItem["CCODIGO"]);
        $("#unidade_material_compras___"+index).val(selectedItem["CUNIDADE"]);
        $("#tipoProduto___"+index).val(selectedItem["CTIPO"]);
    }
    if (selectedItem.inputId == "descricao_ccusto_compras___"+index){     
        $("#codigo_ccusto_compras___"+index).val(selectedItem["CCODIGO"]);
    }
    if (selectedItem.inputId == "ordem_servico___"+index){     
        $("#ccusto_ordem_servico___"+index).val(selectedItem["CCCUSTO"]);
        $("#placa_ordem_servico___"+index).val(selectedItem["CPLACA"]);
        $("#veiculo_ordem_servico___"+index).val(selectedItem["CNOMEVEICULO"]);
    }
    if (selectedItem.inputId == "descricao_material_frota___"+index){     
        $("#codigo_material_frota___"+index).val(selectedItem["CCODIGO"]);
    }
}
function removedZoomItem(removedItem) {
    var index = getIndex(removedItem['inputId']);
    if (removedItem.inputId == "zoom_area_responsavel"){   
        $("#codigo_grupo").val('');
    }
    if (removedItem.inputId == "descricao_material_compras___"+index){      
        $("#codigo_material_compras___"+index).val("");
        $("#unidade_material_compras___"+index).val("");
        $("#tipoProduto___"+index).val("");
    }
    if (removedItem.inputId == "descricao_ccusto_compras___"+index){      
        $("#codigo_ccusto_compras___"+index).val("");
    }
    if (removedItem.inputId == "ordem_servico___"+index){      
        $("#ccusto_ordem_servico___"+index).val("");
        $("#placa_ordem_servico___"+index).val("");
        $("#veiculo_ordem_servico___"+index).val("");
    }
    if (removedItem.inputId == "descricao_material_frota___"+index){      
        $("#codigo_material_frota___"+index).val("");
    }
}

function statusAnalise(obj){
    if (obj.value == ""){
        $("#statusIcon").removeClass("fluigicon fluigicon-verified").removeClass("fluigicon fluigicon-remove").addClass("fluigicon fluigicon-question-sign");
    }else if (obj.value == "Aprovado"){
        $("#statusIcon").removeClass("fluigicon fluigicon-question-sign").removeClass("fluigicon fluigicon-remove").addClass("fluigicon fluigicon-verified");
        showSweetTimerAlert("Solicitação aprovada!", "success");
    }else if (obj.value == "Reprovado"){
        $("#statusIcon").removeClass("fluigicon fluigicon-question-sign").removeClass("fluigicon fluigicon-verified").addClass("fluigicon fluigicon-remove");
        showSweetTimerAlert("Solicitação reprovada!", "error");
    }else if(obj.value == "Corrigir"){
        $("#statusIcon").removeClass("fluigicon fluigicon-question-sign").removeClass("fluigicon fluigicon-verified").removeClass("fluigicon fluigicon-remove").addClass("fluigicon fluigicon-process");
        showSweetTimerAlert("Corrigir solicitação", "warning");
    }
}