var express = require('express')
var app = express()
var azure = require("azure");
var async = require('async');

var connectionString ="Endpoint=sb://test806003586.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=Op1irpLtHBbGyR0sA4nWBQkCtp1xIJiIrpPfiozjusY=",
		azure = require('azure');
	
var msgReceived = 0;
var batchNo = 0;

var doWork = function(batchNo){
	var batchId = batchNo;
	//var i; 
	var serviceBusService = azure.createServiceBusService(connectionString);
	var qName = 'testqueue2';
	
	//node does this async
	//for(i=0; i < batchSize; i++){	  
		
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
		console.log(serviceBusService);
		serviceBusService.receiveQueueMessage(qName, { isPeekLock: true }, function(error, lockedMessage){
			if(!error){
				// Message received and locked
				serviceBusService.deleteMessage(lockedMessage, function (deleteError){
					if(!deleteError){
						// Message deleted
						msgReceived++;
						console.log(lockedMessage);
						console.log("+batch "+batchId+" msg "+msgReceived);
						
					}
					else{
						console.log("delete error batch "+batchId+" msg "+msgReceived);
					}
				});
			}
			else{
				console.log("-batch "+batchId+" msg "+msgReceived);
			}
		});
	//}
};

var q = async.queue(function (task, callback) {
    doWork(task.batchNo);
    callback();
},1000);

q.drain = function() {
    console.log('all items have been processed');
}

app.get('/', function (req, res) {
  batchNo++;
  //doWork(100,batchNo);
  var i;
  for(i=0; i < 1; i++){
	  q.push({batchNo: batchNo}, function (err) {});
  }
  res.send('started batch '+batchNo);
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})