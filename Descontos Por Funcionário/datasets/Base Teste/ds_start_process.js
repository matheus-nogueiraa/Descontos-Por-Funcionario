function defineStructure() {

}

function onSync(lastSyncDate) {

}

function createDataset(fields, constraints, sortFields) {
    log.info('ds_start_process - *******************************');
    log.dir(constraints);

    var dataset = DatasetBuilder.newDataset();

    dataset.addColumn('status');
    dataset.addColumn('mensagem');
    dataset.addColumn('idProcess');

    var serviceHelper = getECMWorkflowEngineServiceHelper();
    var service = getECMWorkflowEngineService(serviceHelper);

    // Onde vai os dados do formulário
    var cardData = serviceHelper.instantiate('net.java.dev.jaxb.array.StringArrayArray');

    var processId = ""
    var choosedState = 0;
    var comments = "";

    var attachments = [];

    if (constraints != null) {
        for (var i = 0; i < constraints.length; i++) {

            // Nome do processo a ser iniciado
            if (constraints[i].fieldName == "processId") {
                processId = constraints[i].initialValue
            }
            // Atividade para qual será movimentada a solicitação
            if (constraints[i].fieldName == "choosedState") {
                choosedState = constraints[i].initialValue
            }
            // Comentário da movimentação
            if (constraints[i].fieldName == "comments") {
                comments = constraints[i].initialValue
            }
            // Campo do Formulário
            if (constraints[i].fieldName == "formField") {
                if (!constraints[i].initialValue) continue;

                var field = serviceHelper.instantiate('net.java.dev.jaxb.array.StringArray');

                field.getItem().add(constraints[i].initialValue); // Nome do Campo
                field.getItem().add(constraints[i].finalValue || ""); // Valor do Campo

                cardData.getItem().add(field);
            }
            // Anexo
            if (constraints[i].fieldName == "attachment") {
                attachments.push({
                    base64: constraints[i].initialValue,
                    name: constraints[i].finalValue
                });
            }
        }
    }

    try {

        if (!processId || !choosedState) {
            dataset.addRow(["ERROR", "O processId e choosedState São Obrigatórios!"]);
            return dataset;
        }

        //configure os dados do seu usuário integrador
        var INTEGRADOR = {
            matricula: fluigAPI.getTenantService().getTenantData(["userLoginWorkflow"]).get("userLoginWorkflow").trim(),
            senha: fluigAPI.getTenantService().getTenantData(["userPassWorkflow"]).get("userPassWorkflow").trim(),
            empresa: getValue("WKCompany") || "1"
        };

        // Lista das matrículas de usuários que irão receber a atividade. Normalmente é um usuário, mas no caso de um consenso podem ser vários
        var colleagueIds = createStringArray(serviceHelper);

        // Usuário que ficará como o inicializador da solicitação. O usuário integrador precisa ter personificação caso seja um usuário diferente do integrador
        var userId = INTEGRADOR.matricula;

        // Se vai completar a tarefa inicial (true) ou não, vai apenas salvar a solicitação para gerar um código e preencher o formulário, anexos e comentários
        var completeTask = true;

        // Lista de anexos. Mesmo que não seja enviado nenhum, é necessário enviar a lista vazia
        var attachments = createProcessAttachmentDtoArray(serviceHelper, attachments);

        // Apontamentos da solicitação. Não é mais utilizado, mas por compatibilidade é necessário enviar a lista vazia
        var appointments = createProcessTaskAppointmentDtoArray(serviceHelper);

        // Se a movimentação é feita como usuário responsável pela atividade ou como gestor do processo
        var managerMode = false;

        // Chama o serviço para iniciar a solicitação e recebe o retorno
        // O retorno do startProcess é um String[][], ou no Soap, um StringArrayArray
        var retornoStartProcess = service.startProcess(
            INTEGRADOR.matricula,
            INTEGRADOR.senha,
            INTEGRADOR.empresa,
            processId,
            choosedState,
            colleagueIds,
            comments,
            userId,
            completeTask,
            attachments,
            cardData,
            appointments,
            managerMode
        );

        var retorno = stringArrayArrayToSimpleObject(retornoStartProcess);

        if (retorno.ERROR) {
            // Interrompe a execução ou movimentação e retorna um erro com a resposta do serviço
            dataset.addRow(["ERROR", "Solicitação não iniciada: " + retorno.ERROR]);
        } else {
            // Imprime o código da solicitação criada pelo serviço e depois imprime todos os dados que foram retornados
            dataset.addRow(["SUCCESS", "Solicitação " + retorno.iProcess + " criada com sucesso!", retorno.iProcess]);
        }
    } catch (error) {
        dataset.addRow(["ERROR", "Solicitação não iniciada. Erro: " + error, ""]);
    }

    return dataset;
}

function getECMWorkflowEngineServiceHelper() {
    // conforme o cadastro do fluig
    var SERVICOS = {
        workflowEngineService: "ECMWorkflowEngineService"
    }

    return ServiceManager.getService(SERVICOS.workflowEngineService).getBean();
}

function getECMWorkflowEngineService(serviceHelper) {
    var serviceLocator = serviceHelper.instantiate("com.totvs.technology.ecm.workflow.ws.ECMWorkflowEngineServiceService");
    return serviceLocator.getWorkflowEngineServicePort();
}

/**
 * Cria uma variável similar ao String[] que é utilizado pelo Soap
 * @param serviceHelper O wsdl que contém o mapeamento da estrutura de um objeto do tipo net.java.dev.jaxb.array.StringArray
 * @returns Um objeto do tipo net.java.dev.jaxb.array.StringArray conforme o mapeamento do wsdl
 */
function createStringArray(serviceHelper) {
    return serviceHelper.instantiate('net.java.dev.jaxb.array.StringArray');
}


/**
 * Cria uma variável similar ao String[][] que é utilizado pelo Soap
 * @param serviceHelper O wsdl que contém o mapeamento da estrutura de um objeto do tipo net.java.dev.jaxb.array.StringArrayArray
 * @returns Um objeto do tipo net.java.dev.jaxb.array.StringArrayArray conforme o mapeamento do wsdl
 */
function createStringArrayArray(serviceHelper, fields) {
    // return serviceHelper.instantiate('net.java.dev.jaxb.array.StringArrayArray');

    var cardData = serviceHelper.instantiate('net.java.dev.jaxb.array.StringArrayArray');

    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];

        var fieldParse = JSON.parse(field);

        if (!fieldParse.fieldName) continue;
        var field = serviceHelper.instantiate('net.java.dev.jaxb.array.StringArray');

        field.getItem().add(fieldParse.fieldName);
        field.getItem().add(fieldParse.fieldValue || "");

        cardData.getItem().add(field);


    }

    return cardData;
}


/**
 * Cria uma variável similar ao ProcessAttachmentDto[] que é utilizado pelo Soap
 * @param serviceHelper O wsdl que contém o mapeamento da estrutura de um objeto do tipo com.totvs.technology.ecm.workflow.ws.ProcessAttachmentDtoArray
 * @returns Um objeto do tipo com.totvs.technology.ecm.workflow.ws.ProcessAttachmentDtoArray conforme o mapeamento do wsdl
 */
function createProcessAttachmentDtoArray(serviceHelper, attachments) {
    if (attachments.length <= 0) {
        return serviceHelper.instantiate('com.totvs.technology.ecm.workflow.ws.ProcessAttachmentDtoArray');
    }
    else {
        var processAttachmentDtoArray = serviceHelper.instantiate('com.totvs.technology.ecm.workflow.ws.ProcessAttachmentDtoArray');

        for (var index = 0; index < attachments.length; index++) {
            var attachmentItem = attachments[index];

            var processAttachmentDto = serviceHelper.instantiate('com.totvs.technology.ecm.workflow.ws.ProcessAttachmentDto');
            processAttachmentDto.setDescription(attachmentItem.name);

            var attachment = serviceHelper.instantiate('com.totvs.technology.ecm.workflow.ws.Attachment');

            attachment.setFileName(attachmentItem.name);

            var arquivo = java.util.Base64.getDecoder().decode(new java.lang.String(attachmentItem.base64).getBytes("UTF-8"));

            attachment.setFilecontent(arquivo);

            attachment.setPrincipal(true);
            processAttachmentDto.getAttachments().add(attachment);
            processAttachmentDtoArray.getItem().add(processAttachmentDto);
        }

        return processAttachmentDtoArray;
    }
}

/**
 * Cria uma variável similar ao ProcessTaskAppointmentDto[] que é utilizado pelo Soap.
 *
 * Estes apontamentos não são mais usados, mas como não devemos mexer na assinatura dos métodos Soap para não quebrar os stubs já gerados é obrigatório mandar, ainda que vazio
 *
 * @param serviceHelper O wsdl que contém o mapeamento da estrutura de um objeto do tipo com.totvs.technology.ecm.workflow.ws.ProcessTaskAppointmentDtoArray
 * @returns Um objeto do tipo com.totvs.technology.ecm.workflow.ws.ProcessTaskAppointmentDtoArray conforme o mapeamento do wsdl
 */
function createProcessTaskAppointmentDtoArray(serviceHelper) {
    return serviceHelper.instantiate('com.totvs.technology.ecm.workflow.ws.ProcessTaskAppointmentDtoArray');
}

/**
 * Transforma um objeto do tipo StringArrayArray (String[][]) em um objeto Javascript
 *
 * <item>
 *   <item>campo</item>
 *   <item>valor</item>
 * </item>
 *
 * Vira:
 *
 * {'campo': 'valor'}
 *
 * @param stringArrayArray
 * @returns Um objeto do tipo javascript
 */
function stringArrayArrayToSimpleObject(stringArrayArray) {
    var objeto = {};
    for (var i = 0; i < stringArrayArray.getItem().size(); i++) {
        var item = stringArrayArray.getItem().get(i).getItem();
        objeto[item.get(0)] = item.get(1);
    }

    return objeto;
}