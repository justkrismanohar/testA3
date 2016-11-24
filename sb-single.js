(function(){

	const os = require('os');
	const hostName = os.hostname();
	
	var express = require('express')
	var app = express()
	//var azure = require("azure");
	var azure = require('azure-sb');
	var azureStorage = require('azure-storage');
	var connectionString ="Endpoint=sb://test806003586.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=Op1irpLtHBbGyR0sA4nWBQkCtp1xIJiIrpPfiozjusY=";
	var tableStorageKey ="33MfV7gjfiTBwArgm36pHRi7tik8BUbmUUE1MIEN5sWUgahPLIm5WImfPrcB2aJfdCrJW6h4N+Mlha8oXkcxbg==";
	var storageAccount ="defaultstorage806003586";
	var tableService = azureStorage.createTableService(storageAccount,tableStorageKey);

	var msgReceived = 0;
	var batchNo = 0;
	var msgQueueId =0;
	var serviceBusService = azure.createServiceBusService(connectionString);
	var qName = 'testqueue2';

	var checkMessageCount = function (queueName,sbService){
		sbService.getQueue(queueName, function(err, queue){
			if (err) {
				console.log('Error on get queue length: ', err);
			} else {
				// length of queue (active messages ready to read)
				var length = queue.CountDetails['d2p1:ActiveMessageCount'];
				console.log(length + ' messages currently in the queue');
				return length;
			}
		});
	}

	var saveToTable = function(eType,data){
		var entGen = azureStorage.TableUtilities.entityGenerator;
		var date  = (new Date).toISOString();
		//console.log(entGen.String(date));	
		var entity = {
		  PartitionKey: entGen.String(hostName) ,
		  RowKey: entGen.String(date),
		  ErrorType: entGen.String(eType.toString()),
		  Json:entGen.String(JSON.stringify(data))
		};
		
		var count = 0;
		
		var trySave = function(data){	
			tableService.insertEntity('Messages', entity, function(error, result, response) {
			  if (!error) {
				// result contains the ETag for the new entity
				//console.log(result);				
			  }
			  else{
				count++;
				console.log("Table-Storage-error-Retry "+count+" of 10");
				console.log(error);
				if(count < 10){
					trySave(data);
				}
			  }
			});
		};
		
		trySave(data);
		//console.log("END CALL 1");
		//trySave(data);
	};
	
	var doWork = function(batchSize,batchNo){
		var i; 
		//node does this async
		for(i=0; i < batchSize; i++){	  
		
			(function(msgId,batchId){
				serviceBusService.receiveQueueMessage(qName, { isPeekLock: true }, function(error, lockedMessage){
					if(!error){
						// Message received and locked
						//console.log(lockedMessage);
						//Check if valid
						//If falid process
						//If not valid store failure in azure table. 
						
						if(msgId % 300 == 0){
							//a simulated failure
							saveToTable("Message-Failure",lockedMessage);
						}						
						
						//Delete message from queue
						serviceBusService.deleteMessage(lockedMessage, function (deleteError){
							
							if(msgId % 500 == 0){
								//a simulated failure
								saveToTable("Delete-Failure",lockedMessage);
							}
							
							if(!deleteError){
								// Message deleted
								//msgReceived++;
								//console.log("+batch "+batchId+" msg "+msgId);
							}
							else{
								//console.log("delete error batch "+batchId+" msg "+msgId);
								//msgReceived++;
							}
						});
					}
					else{
						//If failed, the message will still be on the queue and some
						//other consumer will get it
						
						//console.log("-batch "+batchId+" msg "+msgId);
						//msgReceived++;
					}
					
					msgReceived++;
				});
			})(msgQueueId,batchNo);
			msgQueueId++;
		}
	};

	/*
	app.get('/count', function (req, res) {
		var serviceBusService = azure.createServiceBusService(connectionString);
		var qName = 'testqueue2';

		 serviceBusService.getQueue(qName, function(err, queue){
			if (err) {
				console.log('Error on get queue length: ', err);
			} else {
				// length of queue (active messages ready to read)
				var length = queue.CountDetails['d2p1:ActiveMessageCount'];
				res.send('started batch '+batchNo + "queued "+msgQueueId +" received " +msgReceived +" length " + length);
				//return length;
			}
		});
		
	   //res.send('started batch '+batchNo + "queued "+msgQueueId +" received " +msgReceived);
	})
	*/



	//app.get('/', function (req, res) {

		var runBatch = function(length){
			  //console.log("queued "+msgQueueId +" received " +msgReceived);
			  
			  if(length > 0){
				  var diff = msgQueueId - msgReceived ;
				  var max = 1000 - diff;
				  
				  batchNo++;
				  if(length < max){
					  doWork(length,batchNo);
				  }
				  else{
					  doWork(max,batchNo);
				  }
				  //res.send('started batch '+batchNo + "queued "+msgQueueId +" received " +msgReceived);
				  console.log('started batch '+batchNo + "queued "+msgQueueId +" received " +msgReceived +" length " + length);
			  }
			  else{
				//res.send('load '+ (msgQueueId - msgReceived));
				console.log('load '+ (msgQueueId - msgReceived) +" length " + length);
			  }
		};
		
		var start = function(){
			var diff = msgQueueId - msgReceived ;
			if(diff <= 200){
				var serviceBusService = azure.createServiceBusService(connectionString);
				var qName = 'testqueue2';	
				
				 serviceBusService.getQueue(qName, function(err, queue){
					if (err) {
						console.log('Error on get queue length: ', err);
					} else {
						// length of queue (active messages ready to read)
						var length = queue.CountDetails['d2p1:ActiveMessageCount'];
						console.log(length + ' messages currently in the queue');
						runBatch(length);
						//return length;
					}
				});
			}
			  
		 }; 

	 //setInterval(start,3000);
	 //res.send("Started");
	 
	//})
	//console.log("Starting consumer");

	//setInterval(start,3000);

	app.get('/table', function (req, res) {
		saveToTable("test","Hello World!");
		res.send("okay");
	})

	app.listen(3000, function () {
	  console.log(hostName+' Example app listening on port 3000!');
	  setInterval(start,3000);
	})
})();