(function(){		
	var express = require('express')
	var app = express()

	app.get('/bare', function (req, res) {
		res.sendStatus(200);
	})
	
	app.listen(80, function () {
	  console.log(hostName+' Listening on port 3000!');
	  intervalId = setInterval(start,intervalInS);
	  
	})
	
})();