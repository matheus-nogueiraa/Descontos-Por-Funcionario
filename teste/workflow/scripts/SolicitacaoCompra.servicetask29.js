function servicetask29(attempt, message) {
	var processo = getValue("WKNumProces");
	var campos = hAPI.getCardData(processo);
	var contador = campos.keySet().iterator();
	var tipoSoli = hAPI.getCardValue('tipo_solicitacao');
	var prioridade_solicitacao = (hAPI.getCardValue('prioridade_solicitacao') + "").trim();

	log.info("DEBUG SERVICETASK 29 SOL COMPRA +++++++++++++++")

	if (tipoSoli == "COMPRA") {
		var valoresCompra = new Array();
		while (contador.hasNext()) {
			var id = contador.next();
			if (id.match(/codigo_material_compras___/)) {
				var campo = campos.get(id);
				var seq = id.split("___");
				var centrocusto = campos.get("codigo_ccusto_compras___" + seq[1]);
				var codigoMarca = " ";
				var dataNecessidade = campos.get("data_necessidade_compras___" + seq[1]).split('/').reverse().join('-');
				var codProduto = campos.get("codigo_material_compras___" + seq[1]);
				var quant = campos.get("quantidade_material_compras___" + seq[1]);
				var obsItem = campos.get("info_adicionais_item_compras___" + seq[1]);
				var solicitante = campos.get("responsavel_abertura");
				var numeroSoli = campos.get("solicitacao_fluig");

				valoresCompra.push({
					'CCC': "" + centrocusto,
					'CCODFABRICA': "" + codigoMarca,
					'CDATANECESSITA': "" + dataNecessidade,
					'COBS': "FLUIG: " + numeroSoli + " - " + obsItem,
					'CPRODUTO': "" + codProduto,
					'NQUANT': 1 * parseFloat(quant),
					'CCONTATO': "" + solicitante,
					'NUMFLUIG': "" + numeroSoli,
					'CNUMOS': "      ",
				});
			}
		}

		var fields = new Array(
			JSON.stringify(valoresCompra),
			solicitante,
			dataNecessidade.substring(0, 10),
			prioridade_solicitacao
		);

		var codEmpresa = (hAPI.getCardValue('codEmpresa') + "").trim();
		var codFilial = (hAPI.getCardValue('codFilial') + "").trim();
		var c1 = DatasetFactory.createConstraint("codEmpresa", codEmpresa, codEmpresa, ConstraintType.MUST);
		var c2 = DatasetFactory.createConstraint("codFilial", codFilial, codFilial, ConstraintType.MUST);
		var constraints = new Array(c1, c2);

		var dataset = DatasetFactory.getDataset('dsGravaSolicitacaoCompra', fields, constraints, null);
		var retorno_dataset = dataset.getValue(0, "RETORNO");
		var num_protheus = dataset.getValue(0, "PROTHEUS");

		log.info('retorno_dataset +++++++++++++++++++++++++')
		log.dir(retorno_dataset)

		var s_erro = "ERRO";
		var s_sucesso = "SUCESSO";
		if (retorno_dataset.substring(0, 1) != "S") {
			hAPI.setCardValue('integracao_status', s_erro);
			hAPI.setCardValue('integracao_msg', retorno_dataset);
			hAPI.setCardValue('numProtheus', num_protheus);
		} else if (retorno_dataset.substring(0, 1) == "S") {
			hAPI.setCardValue('integracao_status', s_sucesso);
			hAPI.setCardValue('integracao_msg', retorno_dataset);
			hAPI.setCardValue('numProtheus', num_protheus);
		}
	}

	if (tipoSoli == "FROTA") {
		var valoresFrota = new Array();
		while (contador.hasNext()) {

			var id = contador.next();
			if (id.match(/codigo_material_frota___/)) {
				var campo = campos.get(id);
				var seq = id.split("___");
				var centrocusto = campos.get("ccusto_ordem_servico___" + seq[1]);
				var dataNecessidade = campos.get("data_necessidade_frota___" + seq[1]).split('/').reverse().join('-');
				var ordemservico = campos.get("ordem_servico___" + seq[1]);
				var codProduto = campos.get("codigo_material_frota___" + seq[1]);
				var quant = campos.get("quantidade_material_frota___" + seq[1]);
				var obsItem = campos.get("info_adicionais_material_frota___" + seq[1]);
				var solicitante = campos.get("responsavel_abertura");
				var numeroSoli = campos.get("solicitacao_fluig");

				valoresFrota.push({
					'CCC': "" + centrocusto,
					'CDATANECESSITA': "" + dataNecessidade,
					'CNUMOS': "" + ordemservico,
					'COBS': "FLUIG: " + numeroSoli + " - " + obsItem,
					'CPRODUTO': "" + codProduto,
					'NQUANT': 1 * parseFloat(quant),
					'CCONTATO': "" + solicitante,
				});
			}
		}

		var fields = new Array(
			JSON.stringify(valoresFrota),
			solicitante,
			ordemservico,
			dataNecessidade.substring(0, 10)
		);

		var dataset = DatasetFactory.getDataset('dsGravaSolicitacaoCompra', fields, null, null);
		var retorno_dataset = dataset.getValue(0, "RETORNO");
		var num_protheus = dataset.getValue(0, "PROTHEUS");
		var s_erro = "ERRO";
		var s_sucesso = "SUCESSO";
		if (retorno_dataset.substring(0, 1) != "S") {
			hAPI.setCardValue('integracao_status', s_erro);
			hAPI.setCardValue('integracao_msg', retorno_dataset);
			hAPI.setCardValue('numProtheus', num_protheus);
		} else if (retorno_dataset.substring(0, 1) == "S") {
			hAPI.setCardValue('integracao_status', s_sucesso);
			hAPI.setCardValue('integracao_msg', retorno_dataset);
			hAPI.setCardValue('numProtheus', num_protheus);
		}
	}
}