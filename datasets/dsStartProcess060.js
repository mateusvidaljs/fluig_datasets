function createDataset(fields, constraints, sortFields) {
  var dataset = DatasetBuilder.newDataset();
  dataset.addColumn('STATUS');
  dataset.addColumn('MSG');

  log.info("=================================================================== AQUI!!!!!!!!!!");
  log.dir(JSON.parse(fields[0]));

  try {
    var serviceInstance = ServiceManager.getService('workflowengineservice');
    var serviceHelper = serviceInstance.getBean();
    var serviceLocator = serviceHelper.instantiate('com.totvs.technology.ecm.workflow.ws.ECMWorkflowEngineServiceService');
    var service = serviceLocator.getWorkflowEngineServicePort();
    //let keyValueDTOArray = serviceHelper.instantiate('com.datasul.technology.webdesk.workflow.ws.KeyValueDtoArray');
    let processAttachmentDTOArray = serviceHelper.instantiate('com.totvs.technology.ecm.workflow.ws.ProcessAttachmentDtoArray');
    let processAppointmentDTOArray = serviceHelper.instantiate('com.totvs.technology.ecm.workflow.ws.ProcessTaskAppointmentDtoArray');
    var objectFactory = serviceHelper.instantiate("net.java.dev.jaxb.array.ObjectFactory");

    let userName = 'adm';
    let password = 'Sebrae@987';
    let companyId = 1;
    let processId = '060';
    let choosedState = 3;
    let colleagueIds = objectFactory.createStringArray();
    let comments = "Iniciado via dataset integrado ao WebServices";
    let userId = fields[0];
    let completeTask = true;
    let arrAttachments = new Array();
    log.info('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX OK, ANTES DA CHAMADA DA FUNCTION');
    //let campos = new java.util.HashMap();
    let campos = objectFactory.createStringArrayArray();
    let arrAppointments = new Array();
    let managerMode = false;
    var obj = JSON.parse(fields[1]);

    for(let key in obj) {
      var field = objectFactory.createStringArray();
      field.getItem().add(key); // nome do campo.
      field.getItem().add(obj[key]); // valor do campo.
      campos.getItem().add(field);
    }

    log.dir(campos);

    //processAttachmentDTOArray.setItem(arrAttachments);
    //processAppointmentDTOArray.setItem(arrAppointments);

    var retorno = service.startProcess(userName, password, companyId, processId, choosedState, colleagueIds, comments, userId, completeTask, processAttachmentDTOArray, campos, processAppointmentDTOArray, managerMode);
    log.info(retorno);
    log.info(retorno.getItem());
    log.info(retorno.getItem().get(0).getItem().get(1));

    if(retorno.getItem().size() == 1) {
      dataset.addRow(['0', retorno.getItem().get(0).getItem().get(1)]);
    }
    else {
      dataset.addRow(['1', retorno.getItem().get(5).getItem().get(1)]);
    }
  }
  catch(ex) {
    log.error(ex);
    dataset.addRow(['0', ex]);
  }

  return dataset;
}