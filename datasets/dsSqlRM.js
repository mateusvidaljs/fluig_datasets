/**
 * Dataset genérico de consulta SQL no RM.
 * Depêndencia: Dataset DSConnector.
 *
 * @param fields: Array com o nome das colunas a serem retornadas pelo dataset.
 * @param constraints: Array com as contraints. 
 *                     As constraints obrigatórias são: codSentenca, codColigada, codAplicacao.
 *                     As demais constraints, de parâmetro, também devem ser informadas. Basta o nome da constraint ser igual ao nome do parâmetro.
 * @param sortFields: null
 * @returns Dataset com dados do RM.
 */
function createDataset(fields, constraints, sortFields) {
	log.info('@ds_generic_rm_sql diz: Inicio');
	if(validate(fields, constraints) == false) return;
	
	var serviceName = 'wsConsultaSQL'; /* TOTVS_CONSSQL */ //Serviço criado no ECM para acessar o WebService - JLLE: TOTVS_CONSSQL
	var servicePackage = 'br.com.totvs.WsConsultaSQL'; //Pacote do serviço
	var dataset = DatasetBuilder.newDataset();
	var constraintsValue = '';
	var connect = DatasetFactory.getDataset('dsConnector', null, null, null);
	var jsonObj = {};
	
	//Adiciona as colunas no dataset
	for(var i = 0; i < fields.length; i++){
		dataset.addColumn(fields[i].toUpperCase());
	}
	
	//Pega e valida um array associativo com os valores que serao utilizados na consulta
	constraintsValue = getConstraints(constraints);	
	if(validateConstraints(constraintsValue) == false) return;
	
	//Efetua a consulta no RM
	jsonObj = request(serviceName, servicePackage, constraintsValue, connect);
	
	if(jsonObj.length > 0){
		for(var i=0;i<jsonObj.length;i++){
			var row = [];
			for(var j=0;j<fields.length;j++){
				var field = fields[j]; 
				var tags = getTagsByName(jsonObj[i],field); 
				var regex = new RegExp('(<'+field+'>|<\/'+field+'>)','g');
				row.push(tags[0].replace(regex,''));
			}
			dataset.addRow(row);
		}
	}
	else log.info("@ds_generic_rm_sql diz: TAG resultado inexistente");
	log.info("QUANTIDADE DE REGISTROS: "+dataset.rowsCount);
	return dataset; 	
}

/**
 * Valida os parametros recebidos na chamada do dataset.
 * 
 * @param fields: fields recebido na chamada do dataset.
 * @param constraints: constraints recebido na chamada do dataset.a
 * @returns {Boolean}: Quando valido retorna true, senao false.
 */
function validate(fields, constraints){
	if(fields == null){
		log.info('@ds_generic_rm_sql diz: Nenhuma coluna foi informada!');
		return false;
	}
	
	if(constraints == null){
		log.info('@ds_generic_rm_sql diz: Nenhuma constraint foi informada!');
		return false;
	}
	
	return true;
}

/**
 * Retorna um array associativo gerado a partir das constraints recebidas na chamada do dataset.
 * 
 * @param constraints: constraints recebido na chamada do dataset.
 * @returns {'sentenceId':'value','companyId':'value','applicationId':'value','parameters':'stringXML'}.
 */
function getConstraints(constraints){
	var consts = {};
	consts['parameters'] = '';
	
	for(var i=0;i<constraints.length;i++) {
		var name = constraints[i].fieldName.toUpperCase();
		var value = constraints[i].initialValue;
		
		log.info("@name: " + name + " Value: " + value);
		
		if (name == 'CODSENTENCA') consts['sentenceId'] = value;
		else if(name == 'COMPANYID') consts['companyId'] = value;
		else if(name == 'CODAPLICACAO') consts['applicationId'] = value;
		else {
			//consts['parameters'] += name + '=' + value + ';';
			
			var exists = false;
			if (consts['parameters'] != "") { 
				var params = consts['parameters'].split(";");
				for (var j = 0; j < params.length; j++) {
					if (params[j].toString().indexOf(name + "=") != -1) {
						params[j] = name + '=' + value;
						exists = true;
					}
				}
				consts['parameters'] = params.join(";");
			}
			
			if (!exists) {
				consts['parameters'] += name + '=' + value + ';';
			}
			
			log.info("params: " + consts['parameters']);
		}

	}		
	
	log.info("PARAMS: " + consts['parameters']);
	
	return consts;
}

/**
 * Valida as constraints obrigatorias.
 * 
 * @param constraintsValue: Array associativo com os valores das constraints.
 * @returns {Boolean}: Quando valido retorna true, senao false.
 */
function validateConstraints(constraintsValue){
	if(constraintsValue['sentenceId'] == '' || constraintsValue['companyId'] == '' || constraintsValue['applicationId'] == ''){
		log.info('@ds_generic_rm_sql diz: As constraints codSentenca, codColigada e codAplicacao são obrigatórias!');
		return false;
	}
	
	return true;
}

/**
 * Faz a consulta ao RM e retorna um JSON com o resultado.
 * 
 * @param serviceName: Nome do servico cadastrado no ECM.
 * @param servicePackage: Pacote do servico cadastrado no ECM.
 * @param constraintsValue: Array associativo com os valores das constraints.
 * @param connect: Retorno do dataset DSConnector.
 * @returns {}: Retorno da consulta ao RM.
 */
function request(serviceName, servicePackage, constraintsValue, connect){
	try{
		var json = [];
	/*var instance = service.instantiate(servicePackage);
		var ws = instance.getWsConsultaSQLSoap();
		var result = ws.realizarConsultaSQLAuth(constraintsValue['sentenceId'], 
												constraintsValue['companyId'], 
												constraintsValue['applicationId'],
												connect.getValue(0, 'INTEGRADOR'),
												connect.getValue(0, 'SENHA'), 
												constraintsValue['parameters']);*/
		
		//Nova Autenticação
		var workflowEngine = ServiceManager.getServiceInstance(serviceName);
        var serviceHelper = workflowEngine.getBean();
        var wsConsultaSQL = serviceHelper.instantiate("br.com.totvs.WsConsultaSQL");
        var iwsConsultaSQL = wsConsultaSQL.getRMIwsConsultaSQL();
        log.info("AQUI?");
        var authenticatedService = serviceHelper.getBasicAuthenticatedClient(iwsConsultaSQL, "br.com.totvs.IwsConsultaSQL", connect.getValue(0, 'INTEGRADOR'), connect.getValue(0, 'SENHA'));
        log.info(">>>> Conexao RM: OK");
		var result = authenticatedService.realizarConsultaSQL(constraintsValue['sentenceId'], parseInt(constraintsValue['companyId']), constraintsValue['applicationId'], constraintsValue['parameters']);
		log.info('@ds_generic_rm_sql diz: XML retornada pelo RM: ' + result);
		
		return getTagsByName(result, 'Resultado');
	}catch(e){
		log.info('@ds_generic_rm_sql diz: Erro ao executar o dataset DsGeneric: '+e.message);
		return;
	}
}

function getTagsByName(stringXML, tagName){
	var linarize = stringXML.replace("\n","").replace("\r","");
	var regex = new RegExp('<'+tagName+'>(.*?)<\/'+tagName+'>','g');
	var tags = linarize.match(regex);
	if(tags == null){
		log.warn('@ds_generic_rm_sql diz: Tag '+tagName+' nao foi encontrada no retorno da consulta.');
		return [''];
	}
	else return tags;
}
