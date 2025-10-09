function displayFields(form,customHTML){

	var ATIVIDADE = getValue('WKNumState');
	var FORMMODE = form.getFormMode();
	var numProcess = getValue("WKNumProces");
	var dataDia = getCurrentDate();

	var ZERO = 0;
	var INICIO = 4;
	var ANALISE_ALMOXARIFADO = 37;
	var ANALISE_GESTOR = 7;

	customHTML.append("<script>");
	customHTML.append("     function getWKNumState(){ return " + ATIVIDADE + "};");
	customHTML.append("\n 	var FORM_MODE	= 	'" + form.getFormMode() 	+"';");
	customHTML.append("\n </script>");
	
	var emailWKUser = ""
	var usuarioWKUser = getValue("WKUser");
	var constraintColleague1 = DatasetFactory.createConstraint('colleaguePK.colleagueId', usuarioWKUser, usuarioWKUser, ConstraintType.MUST);
	var datasetColleague = DatasetFactory.getDataset('colleague', null, new Array(constraintColleague1), null);
	if (datasetColleague.rowsCount > 0){
		emailWKUser = datasetColleague.getValue(0, 'mail');
		usuarioWKUser = datasetColleague.getValue(0, 'colleagueName');
	}
	
	if (ATIVIDADE == ZERO || ATIVIDADE == INICIO){
		form.setValue("data_abertura", dataDia);
		form.setValue("responsavel_abertura", usuarioWKUser);
		form.setValue("email_responsavel", emailWKUser);
	}
	if (ATIVIDADE == ANALISE_GESTOR){
		form.setValue("responsavel_analise", usuarioWKUser);
		form.setValue("data_analise_gestor", dataDia);
	}
	if (ATIVIDADE == ANALISE_ALMOXARIFADO){
		form.setValue("responsavelGerenteAlmoxarifado", usuarioWKUser);
		form.setValue("data_gerenteAlmoxarifado", dataDia);
	}
	if (FORMMODE == "VIEW" || FORMMODE == "MOD"){
		var tipo = form.getValue("tipo_solicitacao");
		if (tipo == "COMPRA"){
			form.setVisibleById("panel_compra", true);
			form.setVisibleById("panel_frota", false);

		}else if (tipo == "FROTA"){
			form.setVisibleById("panel_frota", true);
			form.setVisibleById("panel_compra", false);
		}
		form.setVisibleById("ajudaGestor", false);
		var integracao = form.getValue("integracao_status");
		if (integracao != ""){
			form.setVisibleById("panel_integracao", true);
		}else {
			form.setVisibleById("panel_integracao", false);
		}
    }
}

function getCurrentDate(){
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1) < 10 ? '0' + (today.getMonth() + 1)	: (today.getMonth() + 1);
    const day = today.getDate() < 10 ? '0' + today.getDate() : today.getDate();	
    const hour = today.getHours() < 10 ? '0' + today.getHours() : today.getHours();
    const minute = today.getMinutes() < 10 ? '0' + today.getMinutes() : today.getMinutes();
    const second = today.getSeconds() < 10 ? '0' + today.getSeconds() : today.getSeconds();
    const currentHour = hour + ":" + minute + ":" + second;
    const currentDate = day + '/' + month + '/' + year;
    const currentTime = currentDate + " - " + currentHour;
    return currentTime;
}