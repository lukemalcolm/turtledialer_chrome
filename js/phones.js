function YealinkT2x() {
	this.init();
}

YealinkT2x.prototype.init = function() {
	this.protocol = localStorage['turtle.settings.protocol']
	this.host = localStorage['turtle.settings.host'];
	this.port = localStorage['turtle.settings.port'];
	this.username = localStorage['turtle.settings.username'];
	this.password = localStorage['turtle.settings.password'];
	this.account = localStorage['turtle.settings.account'];
	this.country = 'ES';	
}

YealinkT2x.prototype.log_config = function() {
	console.log('proto: ' + this.protocol + ' host: ' + this.host);
}

YealinkT2x.prototype.dial = function(dialrequest) {
	console.log('dialing: ' + dialrequest.phonenumber);
	var url_to_call = 
		this.protocol + '://' +
		this.username + ':' + this.password + '@' + 
		this.host + '/cgi-bin/ConfigManApp.com?Id=34&Command=1&Number=' + 
		dialrequest.phonenumber + "&Account=@" +this.account;	
	console.log(url_to_call);
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url_to_call, true);
	xhr.onreadystatechange = function() {
		console.log(xhr.readyState);
	  if (xhr.readyState == 4) {
	  	console.log(xhr.responseText);
	  	if (xhr.responseText != '1') {
	  		dialrequest.failure();
	  	} else {
	  		dialrequest.success();
	  	}
	  }
	}
	xhr.send();	
}
YealinkT2x.prototype.hangup = function(hanguprequest) {
	console.log('hangup');
	var url_to_call = 
		this.protocol + '://' +
		this.username + ':' + this.password + '@' + 
		this.host + '/cgi-bin/ConfigManApp.com?Id=34&Command=3';
	console.log('hangup url: ' + url_to_call);
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url_to_call, true);
	xhr.onreadystatechange = function() {
		console.log(xhr.readyState);
	  if (xhr.readyState == 4) {
	  	console.log(xhr.responseText);
	  	if (xhr.responseText != '3') {
	  		hanguprequest.failure();
	  	} else {
	  		hanguprequest.success();
	  	}
	  }
	}
	xhr.send();	
}	
}
YealinkT2x.prototype.getPhoneBook = function() {

}