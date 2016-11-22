var count = 0;

var a = function(){
	console.log("a "+ count);
	b();
}

var b = function(){
	if(count <= 10){
		count++;
		console.log("b "+count);
		a();
	}
	else{
		console.log("end");
	}
}

a();