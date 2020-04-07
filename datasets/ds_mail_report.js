/*
*
*
*
*
*/

function createDataset(fields, constraints, sortFields) {
	var dataset = DatasetBuilder.newDataset();
	
	/******** Criação das colunas ************/
	const atividades = {
		1: 'Inicio',
		56: 'Triagem do Processo',
		4: 'Liberação e Montagem da Pasta',
		6: 'Formulário DAMP',
		27: 'Pendente com Imobiliaria',
		12: 'Ressarcimento do FGTS',
		10: 'Entrega da Pasta',
		15: 'Recebimento da Pasta',
		17: 'Análise e Envio para CEHOP',
		21: 'Entrega do Dossiê',
		23: 'Geração da Minuta CEF',
		31: 'Assinatura da Confissão de Dívida',
		36: 'Recolhimento do ITBI',
		38: 'Assinatura do Gerente da CEF',
		44: 'Entrega dos Documentos no Cartório',
		46: 'Entrega do Contrato na CEF',
		48: 'Finalizada',
		50: 'Finalizada'
	};

	var codatividades = [1, 56, 4, 6, 27, 12, 10, 15, 17, 21, 23, 31, 36, 38, 44, 46, 48, 50];
	var qtdatividades = [];

	/******** Criação das colunas ************/
	dataset.addColumn("IDPROCESSO");
	dataset.addColumn("CODATIVIDADE");
	dataset.addColumn("NOMEATIVIDADE");
	dataset.addColumn("QTDATIVIDADEATUAL");

	/******** Criação de parametros e chamada do dataset 'workflowProcess' ************/
	var p1 = DatasetFactory.createConstraint('processId', 'BRZ_005', 'BRZ_005', ConstraintType.MUST);
	var p2 = DatasetFactory.createConstraint('version', 10, 10, ConstraintType.MUST);
	var campos = ['workflowProcessPK.processInstanceId'];
	var arr_parametros = [p1, p2];
	var formdata = DatasetFactory.getDataset('workflowProcess', campos, arr_parametros, null);
	var counter;
	var string_table = "";
	var grupo = getGroupUsers();

	try{
		for(var i = 0; i < formdata.rowsCount; i++){
			var pdata = getProcessData(formdata.getValue(i, 'workflowProcessPK.processInstanceId'));
			qtdatividades.push(pdata.getValue(0, 'stateSequence'));
			/*
			dataset.addRow([
				'BRZ_005',
				pdata.getValue(0, 'stateSequence'),
				atividades[pdata.getValue(0, 'stateSequence')],
				pdata.getValue(0, 'stateSequence') != counter ? getQtdAtividades(qtdatividades, pdata.getValue(0, 'stateSequence')) : getQtdAtividades(qtdatividades, pdata.getValue(0, 'stateSequence')) + 1
			]);*/
			
			//counter = pdata.getValue(0, 'stateSequence');
		}

		for(j = 0; j < codatividades.length; j++){
			dataset.addRow([
				'BRZ_005',
				codatividades[j],
				atividades[codatividades[j]],
				getQtdAtividades(qtdatividades, codatividades[j])
			]);
			
			string_table += '<tr><td>' + atividades[codatividades[j]] + '</td><td>' + getQtdAtividades(qtdatividades, codatividades[j]) + '</td></tr>';
		}
	}
	catch(e){
		dataset.addRow([
			'ERRO! ',
			e.toString(),
			'',
			'',
			''
		]);
	}
	
	sendMail(string_table, grupo);
	return dataset;
}

function getProcessData(instanceid){
	try{
		var p1 = DatasetFactory.createConstraint('processHistoryPK.processInstanceId', instanceid, instanceid, ConstraintType.MUST);
		var p2 = DatasetFactory.createConstraint('returnLink', null, null, ConstraintType.MUST);
		var campos = ['stateSequence', 'returnLink', 'processHistoryPK.processInstanceId'];
		var arr_parametros = [p1, p2];
		var processdata = DatasetFactory.getDataset('processHistory', campos, arr_parametros, null);

		if(processdata){
			return processdata;
		}
	}
	catch(e){
		return e.toString();
	}
}

function getQtdAtividades(arr, atividade){
	var contar = 0; 

	for(y = 0; y < arr.length; y++) 
	{ 
		if(arr[y] == atividade){ 
			contar++; 
		}
	}

	return contar;
}

function sendMail(string_table, destinatarios){
	try{
        var mail_ds = DatasetFactory.getDataset('ds_SMTPNotify', ['report_notify', 'Relatório de Processo BRZ_005', 'Admin', '['+ destinatarios + ']', '{"row_table":"' + string_table + '"}'], null, null);
    }
    catch(err) {
        log.info(err.toString());
    }
}

function getGroupUsers(){
	try{
		log.info("RETORNO DO DATASET getGroupUsers -------------------------> ENTROU NA FUNCTION");
		var c1 = DatasetFactory.createConstraint('colleagueGroupPK.groupId', 'COMERCIAL', 'COMERCIAL', ConstraintType.MUST);
		var c2 = DatasetFactory.createConstraint('colleagueGroupPK.companyId', '1', '1', ConstraintType.MUST);
		var c3;
    	var param;
		var constraints = [c1, c2];
        var mail_ds = DatasetFactory.getDataset('colleagueGroup', null, constraints, null);
        var ds_colleague;
        
        var string_users = [];
        
        for(var w = 0; w < mail_ds.rowsCount; w++){
        	param = mail_ds.getValue(w, 'colleagueGroupPK.colleagueId');
        	c3 = DatasetFactory.createConstraint('colleaguePK.colleagueId', param, param, ConstraintType.MUST);
        	ds_colleague = DatasetFactory.getDataset('colleague', null, [c3], null);
        	
        	log.info("CONSULTOU O DATASET -------------------------> " + ds_colleague.getValue(0, 'mail'));
        	
        	string_users.push('"' + ds_colleague.getValue(0, 'mail') + '"');
        }
        
        log.info("RETORNO DO DATASET GETGROUPUSERS -------------------------> " + string_users);
        return string_users;
    }
    catch(err) {
        log.info(err.toString());
    }
}