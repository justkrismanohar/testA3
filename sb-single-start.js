(function(){

	const os = require('os');
	const hostName = os.hostname();
	
	var express = require('express')
	var app = express()
	//var azure = require("azure");
	var azure = require('azure-sb');
	var azureStorage = require('azure-storage');
	
	/*var connectionString ="Endpoint=sb://pworkqueue.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=QTZ8jLmgPYGTzwavvMyGSRALQZlj4+z7kgf8BadWUD8=";
	*/
	var connectionString ="Endpoint=sb://workqueue.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=ORMe/l95XFxGinKH0/5V10snt3Chv/6V5RdBiWlW9tw=";

	var tableStorageKey ="iUpb4dZIo8IPna2XoX7WhtHREBk8GA1qa3XHqcXZNcoGFTIorExOcSRD0+cdy324C+JkTgdV2zvoIQU7yOmByw==";
	var storageAccount ="assignment3806003586";
	var qName = "q1";
	var tableService = azureStorage.createTableService(storageAccount,tableStorageKey);

	var msgReceived = 0;
	var batchNo = 0;
	var msgQueueId =0;
	var serviceBusService = azure.createServiceBusService(connectionString);
	
	var running = false;
	var intervalId;
	var intervalInS = 3000;
	var maxJobs = 1000;
	var port = 80;
	
	var startTime = {}, endTime = {};
	
	
	app.use(function(req, res, next) {
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
			next();
		});

		
	var getStatus = function(){
		return {start:startTime, end:endTime, maxJobs: maxJobs, running: running,interval: intervalInS, started: msgQueueId, completed: msgReceived };
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
				//if(count < 10){
				//	trySave(data);
				//}
			  }
			});
		};
		
		trySave(data);
		
	};
	
	var doWork = function(batchSize,batchNo){
		var i; 
		//node does this in async
		for(i=0; i < batchSize; i++){	  
		
			(function(msgId,batchId){
				serviceBusService.receiveQueueMessage(qName, { isPeekLock: true }, function(error, lockedMessage){

					if(!error){
						
						//Check for flag to simulate failure
						if(lockedMessage.ProductName && lockedMessage.ProductName === "Error"){
							saveToTable("Message-Failure",lockedMessage);
						}
						else{
							saveToTable("Message-Success",lockedMessage);
						}
						
						//Delete message from queue
						serviceBusService.deleteMessage(lockedMessage, function (deleteError){
							
							if(!deleteError){
							}
							else{
								//console.log("delete error batch "+batchId+" msg "+msgId);
							}
						});
					}
					else{
						//If failed, the message will still be on the queue and some
						//other consumer will get it
						
						//console.log("-batch "+batchId+" msg "+msgId);
					}
					
					msgReceived++;
				});
			})(msgQueueId,batchNo);
			msgQueueId++;
		}
	};

	var runBatch = function(length){
		  //console.log("queued "+msgQueueId +" received " +msgReceived);
		  if(length > 0){
			  var diff = msgQueueId - msgReceived ;
			  var max = maxJobs - diff;
			  
			  batchNo++;
			  if(length < max){
				  doWork(length,batchNo);
			  }
			  else{
				  doWork(max,batchNo);
			  }
			  //console.log('started batch '+batchNo + "queued "+msgQueueId +" received " +msgReceived +" length " + length);
		  }
		  else{
			//console.log('load '+ (msgQueueId - msgReceived) +" length " + length);
		  }
	};
	
	var start = function(){
			var diff = msgQueueId - msgReceived ;
			
			if(running === true && diff <= 200){
				var serviceBusService = azure.createServiceBusService(connectionString);
				
				 serviceBusService.getQueue(qName, function(err, queue){
					if (err) {
						console.log('Error on get queue length: ', err);
					} else {
						// length of queue (active messages ready to read)
						//var length = queue.CountDetails['d2p1:ActiveMessageCount'];
						
						//console.log(length + ' messages currently in the queue');
						//runBatch(length);
						runBatch(300);
					}
				});
			}
			  
		 }; 

	app.get('/count', function (req, res) {
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(getStatus()));
	})
	
	app.get('/bare', function (req, res) {
		res.sendStatus(200);
	})
	
	app.get('/test/:size', function (req, res) {
		startTime = new Date();
		intervalInS = req.params.intervalSize;
		msgQueueId = 0;
		msgReceived = 0;
		testSize = req.params.size;
		intervalId = setInterval(start,intervalInS);
		running = true;		
		res.send("okay");
	})
	
	app.get('/start', function (req, res) {
		if(!running){
			intervalInS = 50;
			maxJobs = 500;
			startTime = new Date();
			msgQueueId = 0;
			msgReceived = 0;
			intervalId = setInterval(start,intervalInS);
			running = true;
		}
		
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(getStatus()));
	})	
	
	app.get('/stop', function (req, res) {
		if(running){
			//setInterval(start,3000);
			clearInterval(intervalId);
			running = false;
			endTime = new Date();
		}
		res.setHeader('Content-Type', 'application/json');
		var status = getStatus();
		status.diffInMS = (endTime - startTime);
		res.send(JSON.stringify(status));
	})
	
	app.get('/table', function (req, res) {
		saveToTable("test","Hello World!");
		res.send("okay");
	})
	
	app.listen(port, function () {
	  console.log(hostName+' Listening on port '+port+'!');
	  intervalId = setInterval(start,intervalInS);
	  
	})
	
})();