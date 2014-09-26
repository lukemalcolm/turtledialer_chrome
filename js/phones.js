function YealinkT2x(settings) {
	this.protocol = settings.protocol;
	this.host = settings.host;
	this.port = settings.port;
	this.username = settings.username;
	this.password = settings.password;
	this.account = settings.account;
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
YealinkT2x.prototype.calls_log = function() {
	var url_to_call = 
		this.protocol + '://' +
		this.username + ':' + this.password + '@' + 
		this.host + '/cgi-bin/ConfigManApp.com?Id=34';
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url_to_call, true);
	xhr.onreadystatechange = function() {
		console.log(xhr.readyState);
	  if (xhr.readyState == 4) {
	  	var page_content = xhr.responseText;
	  	var start_index = page_content.indexOf('Cfgdata2="') + 10;
	  	if (start_index > 10) {
	  		var end_index = page_content.indexOf('"', start_index);
	  		var data = page_content.substring(start_index, end_index).split('þ');
	  		for (var i =0; i < data.length; i++) {
	  			console.log(data[i].split('ÿ'));
	  		}
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

YealinkT2x.prototype.phonebook = function(phonebookrequest) {
	var url_to_call = 
		this.protocol + '://' +
		this.username + ':' + this.password + '@' + 
		this.host + '/cgi-bin/ConfigManApp.com?Id=28&form=1';
	Papa.parse(
		url_to_call,
		{
			download: true,
			header: true,
			delimiter: ',',
			error: function(err) {
				phonebookrequest.error(err);
			},
			complete: function(results, file) {
				var items = {}
				for (var i = 0; i < results.data.length; i++) {
					items[results.data[i].DisplayName] = {
						'gravatar': 'http://www.gravatar.com/avatar/00000000000000000000000000000000.png?d=mm&s=96',
						'numbers': []
					};
					if (results.data[i].OfficeNumber != '') {
						items[results.data[i].DisplayName]['numbers'].push({ 
							'source': 'phone',
							'kind': 'work',
							'number': results.data[i].OfficeNumber
						});
					}
					if (results.data[i].MobilNumber != '') {
						items[results.data[i].DisplayName]['numbers'].push({ 
							'source': 'phone',
							'kind': 'mobile',
							'number': results.data[i].MobilNumber
						});
					}
					if (results.data[i].OtherNumber != '') {
						items[results.data[i].DisplayName]['numbers'].push({ 
							'source': 'phone',
							'kind': 'other',
							'number': results.data[i].OtherNumber
						});
					}
				}
				console.log(items);
				phonebookrequest.success(items);
			}
		}
	);
}