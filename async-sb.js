var express = require('express')
var app = express()
//var azure = require("azure");
var azure = require('azure-sb');
var async = require('async');

var connectionString ="Endpoint=sb://test806003586.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=Op1irpLtHBbGyR0sA4nWBQkCtp1xIJiIrpPfiozjusY=",
		azure = require('azure');
	
var msgReceived = 0;
var batchNo = 0;
var msgQueueId =0;


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
							//console.log("+batch "+batchId+" msg "+msgId);
						}
						else{
							//console.log("delete error batch "+batchId+" msg "+msgId);
							//msgReceived++;
						}
					});
				}
				else{
					//console.log("-batch "+batchId+" msg "+msgId);
					//msgReceived++;
				}
				
				msgReceived++;
			});
		})(msgQueueId,batchNo);
		msgQueueId++;
	}
};

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

app.get('/', function (req, res) {

	var runBatch = function(length){
		  //console.log("queued "+msgQueueId +" received " +msgReceived);
		  
		  if(length > 0){
			  var diff = msgQueueId - msgReceived ;
			  var max = 500 - diff;
			  
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

 setInterval(start,3000);
 res.send("Started");
 
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})