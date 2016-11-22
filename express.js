var express = require('express')
var app = express()
var azure = require("azure");
var connectionString ="Endpoint=sb://test806003586.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=Op1irpLtHBbGyR0sA4nWBQkCtp1xIJiIrpPfiozjusY=",
		azure = require('azure');
	
var msgReceived = 0;
var batchNo = 0;
var msgQueueId =0;

var doWork = function(batchSize,batchNo){
	var i; 
	var serviceBusService = azure.createServiceBusService(connectionString);
	var qName = 'testqueue2';
	
	//node does this async
	for(i=0; i < batchSize; i++){	  
		
		/*
		serviceBusService.receiveQueueMessage(qName, function(error, receivedMessage){
			if(!error){
				// Message received and deleted
				//console.log(receivedMessage.body);
				msgReceived++;
				console.log("+batch "+batchId+" msg "+msgReceived);
			}
			else{
				console.log("-batch "+batchId+" msg "+msgReceived);
			}
		});
		*/
		(function(msgId,batchId){
			serviceBusService.receiveQueueMessage(qName, { isPeekLock: true }, function(error, lockedMessage){
				if(!error){
					// Message received and locked
					serviceBusService.deleteMessage(lockedMessage, function (deleteError){
						if(!deleteError){
							// Message deleted
							//msgReceived++;
							console.log("+batch "+batchId+" msg "+msgId);
						}
						else{
							console.log("delete error batch "+batchId+" msg "+msgId);
							//msgReceived++;
						}
					});
				}
				else{
					console.log("-batch "+batchId+" msg "+msgId);
					//msgReceived++;
				}
				
				msgReceived++;
			});
		})(msgQueueId,batchNo);
		msgQueueId++;
	}
};

app.get('/count', function (req, res) {
   res.send('started batch '+batchNo + "queued "+msgQueueId +" received " +msgReceived);
})

app.get('/', function (req, res) {

	var start = function(){
		  console.log("queued "+msgQueueId +" received " +msgReceived);
		  var diff = msgQueueId - msgReceived ;
		  //need to get queue length
		  //nodejs sdk does noe support this 
		  
		  if(0 <= diff && diff < 500){
			  batchNo++;
			  doWork(100,batchNo);
			  //res.send('started batch '+batchNo + "queued "+msgQueueId +" received " +msgReceived);
			  console.log('started batch '+batchNo + "queued "+msgQueueId +" received " +msgReceived);
		  }
		  else{
			//res.send('load '+ (msgQueueId - msgReceived));
			console.log('load '+ (msgQueueId - msgReceived));
		  }
	 }; 

 setInterval(start,3000);
 res.send("Started");
 
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})