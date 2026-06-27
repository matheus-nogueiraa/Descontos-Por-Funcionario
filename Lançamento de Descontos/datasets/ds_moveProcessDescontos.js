function createDataset(fields, constraints, sortFields) {

    // Instancia estrutura de dados para guardar dados a serem retornados
    var dataset = DatasetBuilder.newDataset();

    var username = fluigAPI.getTenantService().getTenantData(["userLoginWorkflow"]).get("userLoginWorkflow").trim(); // login do usuário.
    var password = fluigAPI.getTenantService().getTenantData(["userPassWorkflow"]).get("userPassWorkflow").trim(); // palavra de passar.
    var idIntegrador = fluigAPI.getTenantService().getTenantData(["userLoginWorkflow"]).get("userLoginWorkflow").trim()
    var companyId = getValue("WKCompany"); // código da empresa.
    var processInstanceId = ''; // número da sollecitazione.
    var choosedState = "9"; // número da atividade destino.
    var stateSequence = "44"; // atividade em que o processo está parado
    var colleagueIds = fluigAPI.getTenantService().getTenantData(["userLoginWorkflow"]).get("userLoginWorkflow").trim(); // usuário que receberá a tarefa.
    var comments = 'Movimentado Automaticamente Por API'; // comentários.
    var colleagueId = ''; // matrícula do usuário que está responsavel pela atividade
    var completeTask = true; // indica se deve completar a tarefa (true) ou somente salvar (false).
    var managerMode = false; // indica se usuário esta executando a tarefa como gestor do processo.
    var threadSequence = 0 // bagulho nada a ver.
    var numFluig = ""

    log.info("++++++++++++++++++++++++ ds_moveProcessDescontos ++++++++++++++++++++++++")

    // Tratativa de exeções
    try {
        // Determina serviço que será utilizado
        var workflowService = ServiceManager.getService('ECMWorkflowEngineService');
        // Inicializa serviço
        var serviceHelper = workflowService.getBean();
        // Instancia classe do serviço
        var engineServiceService = serviceHelper.instantiate('com.totvs.technology.ecm.workflow.ws.ECMWorkflowEngineServiceService');
        // Obtem porta de serviço para chamar métodos do serviço
        var service = engineServiceService.getWorkflowEngineServicePort();
        // Instancia classe de array de anexos
        var attachments = serviceHelper.instantiate('com.totvs.technology.ecm.workflow.ws.ProcessAttachmentDtoArray');
        // Instancia classe de array de apontamentos da tarefa
        var appointment = serviceHelper.instantiate('com.totvs.technology.ecm.workflow.ws.ProcessTaskAppointmentDtoArray');
        // Instancia classe de array de campos do formulário
        var cardData = serviceHelper.instantiate('net.java.dev.jaxb.array.StringArrayArray');
        // Instancia classe de array de usuários que receberão proxima tarefa
        var colleagueIds = serviceHelper.instantiate('net.java.dev.jaxb.array.StringArray');

        // Loop iterando em array de constraints e substituindo valores de objeto de parâmetros
        if (constraints != null) {
            for (var i = 0; i < constraints.length; i++) {

                if (constraints[i].fieldName == "numFluig") {
                    numFluig = constraints[i].initialValue;
                }
            }
        }

        processInstanceId = numFluig;

        // Pega matrícula do usuário responsável pela atividade.
        var colleagueId = getResponsibleUser(processInstanceId);

        if (
            colleagueId.indexOf("Pool:Role:") === 0 ||
            colleagueId.indexOf("Pool:Group:") === 0 ||
            colleagueId.indexOf("System:Auto") === 0
        ) {
            colleagueId = idIntegrador; // precisa ser um usuário real e apto ao papel/grupo
        }

        log.info("++++++++++++++++++++++++ colleagueId => "+colleagueId+" ++++++++++++++++++++++++")       

        log.info("++++++++++++++++++++++++ stateSequence => "+stateSequence+" ++++++++++++++++++++++++")

        // Coloca o usuário admin como responsável pela atividade para conseguir movimentar.
        assumeProcessTask(username, password, companyId, colleagueId, processInstanceId);

        // Dados do formulário. CARREGA DO FLUXO
        var cardData = service.getInstanceCardData(username,
            password,
            companyId, /*COMPANYID*/
            colleagueId,
            processInstanceId);

        // Chama o método para envio de tarefa passando os parâmetros necessários
        var retorno = service.saveAndSendTask(
            username,                            // login usuário
            password,                            // passepalavra
            companyId,                            // empresa
            processInstanceId,
            choosedState,                        // tarefa destino
            colleagueIds,                        // usuários que receberão tarefa
            comments,                            // comentário
            colleagueId,                        // usuário responsável pela movimentação
            completeTask,                        // indica se deve completar a tarefa (true) ou somente salvar (false)
            attachments,                        // anexos para a solicitação
            cardData,                            // dados para formulário
            appointment,                        // apontamentos para tarefa
            managerMode,                        // indica se usuário esta executando a tarefa como gestor do processo
            threadSequence                      // thread da tarefa (se não possuir tarefas paralelas é 0)
        );

        var registro = new Array();
        var colunas = retorno.getItem();

        // Loop em estrutura de classe String[][] de retorno de webservice
        for (var i = 0; i < colunas.size(); i++) {

            // Cria colunas em dataset
            dataset.addColumn(colunas.get(i).getItem().get(0).toString());

            // Insere valores em array
            registro.push(colunas.get(i).getItem().get(1).toString());
        }  

        registro.push("SUCCESS");
        registro.push(processInstanceId.toString());

        dataset.addColumn("status");
        dataset.addColumn("processInstanceId");

        // Insere registro em dataset
        dataset.addRow(registro);      

    } catch (error) {
        // Caso intercepte exeção retorna dataset com mensagem
        dataset.addColumn("ERROR");
        dataset.addRow([error.toString()]);
    }

    // Retorna dataset
    return dataset;
}

function assumeProcessTask(username, password, companyId, colleagueId, processInstanceId) {
    try { 
        // Obtém a instância do serviço 'WorkflowEngineService' 
        var workflowEngineServiceProvider = ServiceManager.getServiceInstance("ECMWorkflowEngineService");

        // Instancia o serviço 
        var workflowEngineServiceLocator = workflowEngineServiceProvider.instantiate("com.totvs.technology.ecm.workflow.ws.ECMWorkflowEngineServiceService");

        var workflowEngineService = workflowEngineServiceLocator.getWorkflowEngineServicePort();

        var retornoTakeProcess = workflowEngineService.takeProcessTask(username, password, companyId, colleagueId, processInstanceId, 0)

        return ["SUCCESS", retornoTakeProcess]
    } catch (error) {
        return ["ERROR", error]
    }
}

function getResponsibleUser(processInstanceId){
    var constrainsts = new Array()

    constrainsts.push(DatasetFactory.createConstraint("processTaskPK.processInstanceId", processInstanceId, processInstanceId, ConstraintType.MUST));
    constrainsts.push(DatasetFactory.createConstraint("active", "true", "true", ConstraintType.MUST));

    var dataset = DatasetFactory.getDataset("processTask", ["processTaskPK.colleagueId"], constrainsts, null);
    var userColleagueId = ""

    for (var i = 0; i < dataset.rowsCount; i++) {
        userColleagueId = dataset.getValue(i, "processTaskPK.colleagueId");
    }

    return userColleagueId;
}
