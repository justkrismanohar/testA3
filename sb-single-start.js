(function(){

	const os = require('os');
	const hostName = os.hostname();
	
	var express = require('express')
	var app = express()
	//var azure = require("azure");
	var azure = require('azure-sb');
	var azureStorage = require('azure-storage');
	var connectionString ="Endpoint=sb://workqueue.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=ORMe/l95XFxGinKH0/5V10snt3Chv/6V5RdBiWlW9tw=";
	var tableStorageKey ="I6l82t6TEogGLUUmYXFfHR+ChkRgftMh6tQJ0Fd5zzE3LKMIIG8NYLUI5hi58bNJl8LrnGS117UcEaoM09bryA==";
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
	
	var startTime = {}, endTime = {};
	
	var getStatus = function(){
		return {start:startTime, end:endTime, maxJobs: maxJobs, running: running,interval: intervalInS, started: msgQueueId, completed: msgReceived };
	}
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
			  var max = maxJobs - diff;
			  
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
			
			if(running === true && diff <= 200){
				var serviceBusService = azure.createServiceBusService(connectionString);
				//var qName = 'testqueue2';	
				
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

	app.get('/count', function (req, res) {
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(getStatus()));
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
	
	app.get('/start/:intervalSize/:max', function (req, res) {
		if(!running){
			intervalInS = req.params.intervalSize;
			maxJobs = req.params.max;
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

	app.listen(3000, function () {
	  console.log(hostName+' Listening on port 3000!');
	  intervalId = setInterval(start,intervalInS);
	  
	})
	
})();