/*
Copyright 2014 Francesco Faraone

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

function YealinkT20P(settings) {
	this.protocol = settings.protocol;
	this.host = settings.host;
	this.port = settings.port;
	this.username = settings.username;
	this.password = settings.password;
	this.account = settings.account;
}


YealinkT20P.prototype.dial = function(dialrequest) {
	console.log('dialing: ' + dialrequest.phonenumber);
	var url_to_call = 
		this.protocol + '://' +
		this.username + ':' + this.password + '@' + 
		this.host + ':' + this.port + '/cgi-bin/ConfigManApp.com?Id=34&Command=1&Number=' + 
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
YealinkT20P.prototype.callsLog = function(logrequest) {
	var url_to_call = 
		this.protocol + '://' +
		this.username + ':' + this.password + '@' + 
		this.host + ':' + this.port + '/cgi-bin/ConfigManApp.com?Id=34';
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
	  		var months = {
	  			'Jan': '01',
	  			'Feb': '02',
	  			'Mar': '03',
	  			'Apr': '04',
	  			'May': '05',
	  			'Jun': '06',
	  			'Jul': '07',
	  			'Aug': '08',
	  			'Sep': '09',
	  			'Oct': '10',
	  			'Nov': '11',
	  			'Dec': '12'
	  		}
	  		var log = []
	  		for (var i =0; i < data.length; i++) {
	  			var item = data[i].split('ÿ');
	  			if (item.length < 7) {
	  				continue;
	  			}
	  			var date_parts = item[1].split(',')[1].split(' ');
	  			var date = ('00' + date_parts[2]).slice(-2) + '/' + months[date_parts[1]];
	  			var time = item[2];
	  			var number = item[6];
	  			var ts = months[date_parts[1]] + ('00' + date_parts[2]).slice(-2) + time.replace(':', '');
	  			var kind = null;
	  			switch (item[0]) {
	  				case '1':
	  					kind = 'outgoing';
	  					break;
	  				case '2':
	  					kind = 'incoming';
	  					break;
	  				case '3':
	  					kind = 'missed';
	  					break;
	  			}
	  			if (kind != null) {
					log.push({
						'kind': kind,
						'date': date,
						'time': time,
						'ts': parseInt(ts),
						'number': number
					});
	  			}
	  		}
	  		logrequest.success(log);
	  	}
	  }
	}
	xhr.send();	
}
YealinkT20P.prototype.hangup = function(hanguprequest) {
	console.log('hangup');
	var url_to_call = 
		this.protocol + '://' +
		this.username + ':' + this.password + '@' + 
		this.host + ':' + this.port + '/cgi-bin/ConfigManApp.com?Id=34&Command=3';
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

YealinkT20P.prototype.phonebook = function(phonebookrequest) {
	var url_to_call = 
		this.protocol + '://' +
		this.username + ':' + this.password + '@' + 
		this.host + ':' + this.port + '/cgi-bin/ConfigManApp.com?Id=28&form=1';
	console.log('phonebook url: ' + url_to_call);
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
				console.log('phonebook results');
				console.log(items);
				phonebookrequest.success(items);
			}
		}
	);
}

function YealinkT28P(settings) {
	this.protocol = settings.protocol;
	this.host = settings.host;
	this.port = settings.port;
	this.username = settings.username;
	this.password = settings.password;
	this.account = settings.account;
	this.sessionid = null;
}

YealinkT28P.prototype.login = function(callback) {
	var url_to_call = 
		this.protocol + '://' +
		this.host + ':' + this.port + '/servlet?p=login&q=login';
	var params = 'username=' + this.username + '&pwd=' + this.password;
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url_to_call, true);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.withCredentials = true;
	xhr.crossDomain = true;
	xhr.onreadystatechange = function() {
		console.log(xhr.readyState);
		if (xhr.readyState == 4) {
			callback();
	  }
	}
	xhr.send(params);		
}

YealinkT28P.prototype.dial = function(dialrequest) {
	console.log('dialing: ' + dialrequest.phonenumber);
	var url_to_call = 
		this.protocol + '://' +
		this.host + ':' + this.port + '/servlet?p=contacts-callinfo&q=call&num=' + 
		dialrequest.phonenumber + '&acc=0';
	console.log(url_to_call);
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url_to_call, true);
	xhr.onreadystatechange = function() {
	  if (xhr.readyState == 4) {
	  	if (xhr.responseText != 'call success') {
	  		dialrequest.failure();
	  	} else {
	  		dialrequest.success();
	  	}
	  }
	}
	this.login(function() {
		xhr.send();
	});	
}

YealinkT28P.prototype.callsLog = function(logrequest) {
	var url_to_call = 
		this.protocol + '://' +
		this.host + ':' + this.port + '/servlet?p=contacts-callinfo&q=load';
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url_to_call, true);
	xhr.onreadystatechange = function() {
		console.log(xhr.readyState);
	  if (xhr.readyState == 4) {
	  	var page_content = xhr.responseText;
  		var months = {
  			'Jan': '01',
  			'Feb': '02',
  			'Mar': '03',
  			'Apr': '04',
  			'May': '05',
  			'Jun': '06',
  			'Jul': '07',
  			'Aug': '08',
  			'Sep': '09',
  			'Oct': '10',
  			'Nov': '11',
  			'Dec': '12'
  		}
	  	var log = [];
	  	$(['CallDialedListContent', 'CallMissedListContent', 'CallReceivedListContent']).each(function(idx, sel) {
		  	$(page_content).find('#' + sel + ' table tr').each(function(idx, val) {
		  		var date = null;
		  		var time = null;
		  		var number = null;
		  		var kind = null;
		  		var ts = null;
		  		$(this).find('td').each(function(idx, obj) {
		  			var txt = $(this).text();
		  			switch (idx) {
		  				case 1:
		  					//txt = txt.replace(/ +/g, ' ').replace(/\n|\r/g, '');
		  					txt = txt.substring(txt.indexOf(') T("') + 5);
		  					var m = txt.substring(0, txt.indexOf('"'));
		  					txt = txt.substring(txt.indexOf('T("') + 3);
		  					var d = txt.substring(0, txt.indexOf('"'));
		  					date = d + '/' + months[m]
		  					ts = months[m] + d;
		  					break;
		  				case 2:
		  					time = txt;
		  					ts = ts + time.replace(':', '');
		  					break;
		  				case 5:
		  					number = txt.substring(0, txt.indexOf('@'));
		  					break;
		  			}
		  		});
		  		switch (sel) {
		  			case 'CallDialedListContent':
		  				kind = 'outgoing';
		  				break;
		  			case 'CallMissedListContent':
		  				kind = 'missed';
		  				break;
		  			case 'CallReceivedListContent':
		  				kind = 'incoming';
		  		}
		  		if (!number) {
		  			return true;
		  		}
		  		log.push({
					'kind': kind,
					'ts': parseInt(ts),
					'date': date,
					'time': time,
					'number': number
				});
		  	});
	  	});
		log.sort(function(a, b) {
			return b['ts'] - a['ts'];
		})
	  	console.log(log);
	  	logrequest.success(log);
	  }
	}
	this.login(function() {
		xhr.send();
	});
}
YealinkT28P.prototype.hangup = function(hanguprequest) {
	console.log('hangup');
	var url_to_call = 
		this.protocol + '://' +
		this.host + ':' + this.port + '/servlet?p=contacts-callinfo&q=hangup';
	console.log('hangup url: ' + url_to_call);
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url_to_call, true);
	xhr.onreadystatechange = function() {
		console.log(xhr.readyState);
	  if (xhr.readyState == 4) {
	  	console.log(xhr.responseText);
	  	if (xhr.responseText != 'Hang Up Success!') {
	  		hanguprequest.failure();
	  	} else {
	  		hanguprequest.success();
	  	}
	  }
	}
	this.login(function() {
		xhr.send();	
	});
}	

YealinkT28P.prototype.phonebook = function(phonebookrequest) {
	var url_to_call = 
		this.protocol + '://' +
		this.host + ':' + this.port + '/servlet?p=contacts-preview&q=exportcvs';

	this.login(function() {
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
						items[results.data[i].display_name] = {
							'gravatar': 'http://www.gravatar.com/avatar/00000000000000000000000000000000.png?d=mm&s=96',
							'numbers': []
						};
						if (results.data[i].office_number != '') {
							items[results.data[i].display_name]['numbers'].push({ 
								'source': 'phone',
								'kind': 'work',
								'number': results.data[i].office_number
							});
						}
						if (results.data[i].mobile_number != '') {
							items[results.data[i].display_name]['numbers'].push({ 
								'source': 'phone',
								'kind': 'mobile',
								'number': results.data[i].mobile_number
							});
						}
						if (results.data[i].other_number != '') {
							items[results.data[i].display_name]['numbers'].push({ 
								'source': 'phone',
								'kind': 'other',
								'number': results.data[i].other_number
							});
						}
					}
					console.log(items);
					phonebookrequest.success(items);
				}
			}
		);
	});
}