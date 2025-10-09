function afterProcessFinish(processId){
    var currentState = getValue('WKCurrentState');
	var numProcess = getValue("WKNumProces").toString();
	var soliData = hAPI.getCardValue("data_abertura");
	var soliNome = hAPI.getCardValue("responsavel_abertura");
	var soliEmail = hAPI.getCardValue("email_responsavel");
	var soliTipo = hAPI.getCardValue("tipo_solicitacao");
	var soliGestorNome = hAPI.getCardValue("responsavel_analise");
	var soliGerenteNome = hAPI.getCardValue("responsavelGerenteAlmoxarifado");
	var soliGestorData = hAPI.getCardValue("data_analise_gestor");
	var soliGerenteData = hAPI.getCardValue("data_gerenteAlmoxarifado");
	var soliGestorObs = hAPI.getCardValue("gestor_obs");
	var soliGerenteObs = hAPI.getCardValue("gerenteAlmoxarifado_obs");
	var sender = "fluig.workflow";
	var serverUrl = fluigAPI.getPageService().getServerURL();
	var processInstanceID = serverUrl+"/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID="+numProcess;
	var parametros = new java.util.HashMap();
	var destinatarios = new java.util.ArrayList();
	var subject = "";

	if (currentState == 47){ // reprovada pelo gerente almoxarifado
        try{
			subject = " [Fluig: " + numProcess + "] -  Solicitação de compra reprovada Gerente Almoxarifado";
			parametros.put("subject", subject);
			parametros.put("processUrl", processInstanceID);
			parametros.put("numeroFluig", numProcess);
			parametros.put("dataSoli", soliData);
			parametros.put("nomeSoli", soliNome);
			parametros.put("tipoSoli", soliTipo);
			parametros.put("nomeGestor", soliGerenteNome);
			parametros.put("dataGestor", soliGerenteData);
			parametros.put("obsGestor", soliGerenteObs);
			destinatarios.add(soliEmail);
			notifier.notify(sender, "compra_solicitacao_reprovada", parametros, destinatarios, "text/html");
        } catch(e){
			log.warn("--debbug-- email para solicitação reprovada Gerente Almoxarifado - catch e: " + e);
			log.warn("--debbug-- email para solicitação reprovada Gerente Almoxarifado - catch e.message: " + e.message);
			log.warn("--debbug-- email para solicitação reprovada Gerente Almoxarifado - catch lineNumber: " + e.lineNumber);
		}
	}

	if (currentState == 12){ // reprovada
        try{
			subject = " [Fluig: " + numProcess + "] -  Solicitação de compra reprovada";
			parametros.put("subject", subject);
			parametros.put("processUrl", processInstanceID);
			parametros.put("numeroFluig", numProcess);
			parametros.put("dataSoli", soliData);
			parametros.put("nomeSoli", soliNome);
			parametros.put("tipoSoli", soliTipo);
			parametros.put("nomeGestor", soliGestorNome);
			parametros.put("dataGestor", soliGestorData);
			parametros.put("obsGestor", soliGestorObs);
			destinatarios.add(soliEmail);
			notifier.notify(sender, "compra_solicitacao_reprovada", parametros, destinatarios, "text/html");
        } catch(e){
			log.warn("--debbug-- email para solicitação reprovada - catch e: " + e);
			log.warn("--debbug-- email para solicitação reprovada - catch e.message: " + e.message);
			log.warn("--debbug-- email para solicitação reprovada - catch lineNumber: " + e.lineNumber);
		}
	}

	if (currentState == 27){ // aprovada
		try{
			subject = " [Fluig: " + numProcess + "] -  Solicitação de compra aprovada";
			parametros.put("subject", subject);
			parametros.put("processUrl", processInstanceID);
			parametros.put("numeroFluig", numProcess);
			parametros.put("dataSoli", soliData);
			parametros.put("nomeSoli", soliNome);
			parametros.put("tipoSoli", soliTipo);
			parametros.put("nomeGestor", soliGestorNome);
			parametros.put("dataGestor", soliGestorData);
			destinatarios.add(soliEmail); 
			notifier.notify(sender, "compra_solicitacao_aprovada", parametros, destinatarios, "text/html");
		} catch(e){
			log.warn("--debbug-- email para solicitação aprovada - catch e: " + e);
			log.warn("--debbug-- email para solicitação aprovada - catch e.message: " + e.message);
			log.warn("--debbug-- email para solicitação aprovada - catch lineNumber: " + e.lineNumber);
		}
	}
}