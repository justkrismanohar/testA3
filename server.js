var http = require("http");
var azure = require("azure");
var qName = 'testqueue';
var msgReceived = 0;


//console.log(client);
var connectionString ="Endpoint=sb://test806003586.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=Op1irpLtHBbGyR0sA4nWBQkCtp1xIJiIrpPfiozjusY=",
		azure = require('azure');
var serviceBusService = azure.createServiceBusService(connectionString);

var processMsg =  function(error, lockedMessage){
		console.log("msg "+ msgReceived);
		if(!error){
			// Message received and locked
			console.log(lockedMessage.body);
			
			serviceBusService.deleteMessage(lockedMessage, function (deleteError){
				if(!deleteError){
					// Message deleted
				}
			});
			msgReceived++;
			console.log("msg "+ msgReceived);
			work();
		}
		else{
			console.log(error);
		}
	};
	
var work = function(){
	serviceBusService.receiveQueueMessage(qName, { isPeekLock: true }, processMsg);
};

work();



console.log('done');