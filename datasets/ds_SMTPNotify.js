/**
 *
 * @desc        Envia email através do Fluig conforme template pré cadastrado
 * @copyright   2017 upFlow.me
 * @version     1.0.0
 *
 * @param       {array String} fields - Parâmetros de envio de email
                                        INDEX0 = Template de email (Ex.: 'PCT_007_INICIO');
                                        INDEX1 = Assunto do Email (Ex.: '[ePacto] - Teste de Email');
                                        INDEX2 = Matrícula do remetente do Email (Ex.: 'upflowadmin');
                                        INDEX3 = Array com a lista dos destinatários (Ex.: ['helbert_campos', 'ana.alice']);
                                        INDEX4 = Objeto com a lista dos parâmetros (Ex.: {numero:9999,nomelocal:'Nome do Espaço'});
 * @param       {array Constraint} constraints - Não utilizado. Informar null
 * @param       {array String} sortFields - Não utilizado. Informar null
 * @return      {dataset} Retorna o resultado do envio do email
 *
 */

function createDataset(fields, constraints, sortFields) {
    log.info('uf-log | Chamada do DataSet ds_SMTPNotify.js');
    
    var TEMPLATE = "report_notify";
    var ASSUNTO = "Relatório de Processo"; 
    var REMETENTE = "admin@brz.eng.br"; 
    var DESTINATARIOS = "mateusvidal.dev@gmail.com"; 
    var PARAMETROS;
    
    var dst = new java.util.ArrayList();   // lista de destinatários
    var cpm = new java.util.HashMap();   // mapa com parâmetros do template
    
    // resgata as variaveis passadas através do parâmetro fields do DataSet
    if (fields == null) return exibeErro('Parâmetro fields em branco. Informe o TEMPLATE, ASSUNTO, REMETENTE, DESTINATÁRIOS e PARÂMETROS');
    try {
        
        TEMPLATE = fields[0];
		if (TEMPLATE == undefined) throw 'Informe o TEMPLATE de email.';
        
        ASSUNTO = fields[1];
		if (ASSUNTO == undefined) throw 'Informe o ASSUNTO do email.';
        
        REMETENTE = fields[2];
		if (REMETENTE == undefined) throw 'Informe o REMETENTE para envio do email.';
        
		DESTINATARIOS = fields[3];		// array via string
		if (DESTINATARIOS == undefined) throw 'Informe um array de destinatários via String.';
		DESTINATARIOS = JSON.parse(DESTINATARIOS);
		if (DESTINATARIOS.length <= 0) throw 'Informe no mínimo um destinatários.';
        
		PARAMETROS = fields[4];		// parâmetros em JSON via string
		if (PARAMETROS == undefined) throw 'Informe os dados via String JSON.';
		PARAMETROS = JSON.parse(PARAMETROS);

        // informativo da chamada no log
        log.info("uf-log | Dados da chamada ao serviço de email:");
        log.info("uf-log | CODIGO-TEMPLATE: "+TEMPLATE);
        log.info("uf-log | ASSUNTO: "+ASSUNTO);
        log.info("uf-log | MATRICULA-REMETENTE: "+REMETENTE);
        log.info("uf-log | DESTINATARIOS: "+fields[3]);
        log.info("uf-log | PARAMETROS: "+fields[4]);
        
        
    } catch(e) {
        return exibeErro('Erro nos parâmetros passados através do fields do DataSet (linha: ' + e.lineNumber + '): '+ e);    // faz a chamada da função que exibe o erro
    }
    
	// cria a lista de acordo com o objeto JSON informado
	try {
		
		// faz o loop criando os destinatários
        DESTINATARIOS.forEach(function (matricula) {
            dst.add(matricula);
        });
        
	} catch(e) {
        return exibeErro('Erro ao criar DESTINATARIOS (linha: ' + e.lineNumber + '): '+ e);    // faz a chamada da função que exibe o erro
    };
    
	// cria a lista de acordo com o objeto JSON informado
	try {
        
        // o assunto é envido junto aos parâmetros
        cpm.put("subject", ASSUNTO);
        
        // faz o loop entre os campos do template
        for (var key in PARAMETROS) {
           cpm.put(key, PARAMETROS[key]);
        }
        
	} catch(e) {
        return exibeErro('Erro ao criar PARAMETROS (linha: ' + e.lineNumber + '): '+ e);    // faz a chamada da função que exibe o erro
    };

	try {
        
		//Envia e-mail
        notifier.notify(REMETENTE, TEMPLATE, cpm, dst, "text/html");

		var dataset = DatasetBuilder.newDataset();	// cria um novo DataSet para resposta do erro
		dataset.addColumn("INFO");	// 1=Erro na requisição; 0=Requisição realizada com sucesso
		dataset.addColumn("MSG");	// Mensagem curta a ser exibida para o usuário final
		dataset.addColumn("DETALHES");	// Mensagem detalhada a ser analisada pelo administrador
		dataset.addRow(new Array(0, 'Email enviado com sucesso!', ''));	// cria apenas uma linha com a resposta
		return dataset;	// retorna o erro como resposta do DataSet

	} catch (e) {
        return exibeErro('Erro ao enviar o email através do método padrão Fluig (linha: ' + e.lineNumber + '): '+ e.message);    // faz a chamada da função que exibe o erro
	}

}

/**
 * @desc 	Exibe a mensagem de erro do console do Servidor e retorna uma coluna única com o erro para o usuário
 * @param	{string} msg - Mensagem de erro que será gravada no log e exibida ao usuário
 */
function exibeErro(msg) {
    if (msg == null || msg == '') msg = "Erro desconhecido, verifique o log do servidor.";	// se mensagem de erro não foi definida
    var msgErro = "ds_SMTPNotify: " + msg;	// incrementa a mensagem de erro vinda do código
    log.error('uf-log | '+msgErro);	// grava log no arquivo 'server.log' do JBOSS
    dataset = DatasetBuilder.newDataset();	// cria um novo DataSet para resposta do erro
    dataset.addColumn("ERRO");	// 1=Erro; 0=Sucesso
    dataset.addColumn("MSG");	// coluna com mensagem do erro para exibição ao usuário final
    dataset.addColumn("DETALHES");	// Mensagem detalhada a ser analisada pelo administrador
    dataset.addRow(new Array('1', 'Ocorreu um erro ao enviar o email de notificação.', msgErro));	// cria apenas uma linha com a mensagem de erro
    return dataset;	// retorna o erro como resposta do DataSet
}