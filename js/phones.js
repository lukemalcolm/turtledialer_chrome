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

"use strict";


var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
	'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

var lp2 = function(val) {
	return ('00' + val).slice(-2);
}
var m2n = function(val) {
	return lp2($.inArray(val, MONTHS) + 1);
}

var parsePhonebook = function(response) {
	var lines = response.split('\n');
	var header = lines[0].split(',');
	var items = {}
	$.each(lines, function(i, value) {
		if (i == 0) {
			return true;
		}
		var fields = value.split(',');
		if (fields.length < 4) {
			return true;
		}
		var displayName = fields[0].substring(0, fields[0].length);
		var officeNumber = fields[1].substring(0, fields[1].length);
		var mobileNumber = fields[2].substring(0, fields[2].length);
		var otherNumber = fields[3].substring(0, fields[3].length);
		if (displayName.substring(0, 1) == '"') {
			displayName = displayName.substring(1, displayName.length - 1);
			officeNumber = officeNumber.substring(1, officeNumber.length - 1);
			mobileNumber = mobileNumber.substring(1, mobileNumber.length - 1);
			otherNumber = otherNumber.substring(1, otherNumber.length - 1);
		}
		items[displayName] = {
			'gravatar': 'http://www.gravatar.com/avatar/00000000000000000000000000000000.png?d=mm&s=96',
			'numbers': []
		};
		if (officeNumber != '') {
			items[displayName]['numbers'].push({ 
				'source': 'phone',
				'kind': 'work',
				'number': officeNumber
			});
		}
		if (mobileNumber != '') {
			items[displayName]['numbers'].push({ 
				'source': 'phone',
				'kind': 'mobile',
				'number': mobileNumber
			});
		}
		if (otherNumber != '') {
			items[displayName]['numbers'].push({ 
				'source': 'phone',
				'kind': 'other',
				'number': otherNumber
			});
		}
	});
	return items;
}

function YealinkT20P(settings) {
	this.protocol = settings.protocol;
	this.host = settings.host;
	this.port = settings.port;
	this.username = settings.username;
	this.password = settings.password;
	this.configuredLines = 0;
	this.baseUrl = 
		this.protocol + '://' +
		this.host + ':' + this.port + 
		'/cgi-bin/ConfigManApp.com';
	this.checkLines();
}

YealinkT20P.prototype.checkLines = function() {
	$.ajax({
		url: this.baseUrl,
		type: 'GET',
		data: {
			'Id': '1'
		},
		dataType: 'html',
		username: this.username,
		password: this.password,
			success: function(response) {
		  	var startIndex = response.indexOf('Cfgdata="') + 9;
		  	if (startIndex > 9) {
		  		var endIndex = response.indexOf('"', startIndex);
		  		var data = response.substring(startIndex, endIndex).split('þ');
		  		if (data[11].indexOf('REGISTERED') > 0) {
		  			this.configuredLines++;
		  		}
		  		if (data[12].indexOf('REGISTERED') > 0) {
		  			this.configuredLines++;
				}
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			dialRequest.error(errorThrown);
		}
	});	
}

YealinkT20P.prototype.dial = function(dialRequest) {
	$.ajax({
		url: this.baseUrl,
		type: 'GET',
		data: {
			'Id': '34',
			'Command': '1',
			'Number': dialRequest.phoneNumber,
			'Account': dialRequest.accountId || '0'
		},
		dataType: 'text',
		username: this.username,
		password: this.password,
		success: function(response) {
			if (response == '1') {
				dialRequest.success();
			} else {
				dialRequest.error('Invalid response');
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			dialRequest.error(errorThrown);
		}
	});	
}
YealinkT20P.prototype.hangup = function(hangupRequest) {
	$.ajax({
		url: this.baseUrl,
		type: 'GET',
		data: {
			'Id': '34',
			'Command': '3'
		},
		dataType: 'text',
		username: this.username,
		password: this.password,
		success: function(response) {
			if (response == '3') {
				hangupRequest.success();
			} else {
				hangupRequest.error('Invalid response');
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			hangupRequest.error(errorThrown);
		}
	});
}	
YealinkT20P.prototype.getCallLog = function(logRequest) {
	var parseCallLog = function(response) {
		var log = [];
		var callKinds = {
			'1': 'outgoing',
			'2': 'incoming',
			'3': 'missed'
		}
	  	var startIndex = response.indexOf('Cfgdata2="') + 10;
	  	if (startIndex > 10) {
	  		var endIndex = response.indexOf('"', startIndex);
	  		var data = response.substring(startIndex, endIndex).split('þ');
	  		$.each(data, function(i, value) {
	  			var item = value.split('ÿ');
	  			if (item.length < 7) {
	  				return true;
	  			}
	  			var dateParts = item[1].split(',')[1].split(' ');
	  			var date = lp2(dateParts[2]) + '/' + m2n(dateParts[1]);
	  			var time = item[2];
	  			var number = item[6];
	  			var ts = m2n(dateParts[1]) + lp2(dateParts[2]) + time.replace(':', '');
	  			if (callKinds.hasOwnProperty(item[0])) {
					log.push({
						'kind': callKinds[item[0]],
						'date': date,
						'time': time,
						'ts': parseInt(ts),
						'number': number
					});
	  			}	  			
	  		});
	  	}
	  	return log;
	}
	$.ajax({
		url: this.baseUrl,
		type: 'GET',
		data: {
			'Id': '34'
		},
		dataType: 'html',
		username: this.username,
		password: this.password,
		success: function(response) {
			logRequest.success(parseCallLog(response));
		},
		error: function(jqXHR, textStatus, errorThrown) {
			logRequest.error(errorThrown);
		}
	});
}
YealinkT20P.prototype.getPhonebook = function(phonebookRequest) {
	$.ajax({
		url: this.baseUrl,
		type: 'GET',
		data: {
			'Id': '28',
			'form': '1'
		},
		dataType: 'text',
		username: this.username,
		password: this.password,
		success: function(response) {
			phonebookRequest.success(parsePhonebook(response));
		},
		error: function(jqXHR, textStatus, errorThrown) {
			phonebookRequest.error(errorThrown);
		}
	});
}

function YealinkT21P_28P_46G(settings) {
	this.protocol = settings.protocol;
	this.host = settings.host;
	this.port = settings.port;
	this.username = settings.username;
	this.password = settings.password;
	this.account = settings.account;
	this.baseUrl = 
		this.protocol + '://' +
		this.host + ':' + this.port + '/servlet';
}

YealinkT21P_28P_46G.prototype.login = function(callback) {
	$.ajax({
		url: this.baseUrl + 
			'?p=login&q=login&username=' + this.username + 
			'&pwd=' + this.password,
		type: 'POST',
		dataType: 'html',
		success: function(response) {
			callback();
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log('error logging in: ' + errorThrown);
		}
	});		
}

YealinkT21P_28P_46G.prototype.dial = function(dialRequest) {
	var that = this;
	this.login(function() {
		$.ajax({
			url: that.baseUrl,
			type: 'GET',
			data: {
				'p': 'contacts-callinfo',
				'q': 'call',
				'num': dialRequest.phoneNumber,
				'acc': dialRequest.accountId || '0'
			},
			dataType: 'text',
			success: function(response) {
				if (response == 'call success') {
					dialRequest.success();
				} else {
					dialRequest.error(response);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				dialRequest.error(errorThrown);
			}
		});
	});
}

YealinkT21P_28P_46G.prototype.getCallLog = function(logRequest) {
	var parseCallLog = function(response) {
		var callKinds = {
			'CallDialedListContent': 'outgoing', 
			'CallMissedListContent': 'missed', 
			'CallReceivedListContent': 'incoming'
		};
		var log = [];
	  	$(Object.keys(callKinds)).each(function(idx, sel) {
		  	$(response).find('#' + sel + ' table tr').each(function(idx, val) {
		  		var date = null;
		  		var time = null;
		  		var number = null;
		  		var kind = null;
		  		var ts = null;
		  		$(this).find('td').each(function(idx, obj) {
		  			var txt = $(this).text();
		  			switch (idx) {
		  				case 1:
		  					txt = txt.substring(txt.indexOf(') T("') + 5);
		  					var m = txt.substring(0, txt.indexOf('"'));
		  					txt = txt.substring(txt.indexOf('T("') + 3);
		  					var d = txt.substring(0, txt.indexOf('"'));
		  					date = d + '/' + m2n[m]
		  					ts = m2n[m] + d;
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
		  		if (!number) {
		  			return true;
		  		}
		  		log.push({
					'kind': callKinds[sel],
					'ts': parseInt(ts),
					'date': date,
					'time': time,
					'number': number
				});
		  	});
	  	});
		log.sort(function(a, b) {
			return b['ts'] - a['ts'];
		});
		return log;		
	}

	var that = this;
	this.login(function() {
		$.ajax({
			url: that.baseUrl,
			type: 'GET',
			data: {
				'p': 'contacts-callinfo',
				'q': 'load'
			},
			dataType: 'html',
			success: function(response) {
				logRequest.success(parseCallLog(response));
			},
			error: function(jqXHR, textStatus, errorThrown) {
				logRequest.error(errorThrown);
			}
		});
	});
}
YealinkT21P_28P_46G.prototype.hangup = function(hangupRequest) {
	var that = this;
	this.login(function() {
		$.ajax({
			url: that.baseUrl,
			type: 'GET',
			data: {
				'p': 'contacts-callinfo',
				'q': 'hangup'
			},
			dataType: 'text',
			success: function(response) {
				if (response == 'Hang Up Success!') {
					hangupRequest.success();
				} else {
					hangupRequest.error(response);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				hangupRequest.error(errorThrown);
			}
		});
	});
}	

YealinkT21P_28P_46G.prototype.getPhonebook = function(phonebookRequest) {
	var that = this;
	this.login(function() {
		$.ajax({
			url: that.baseUrl,
			type: 'GET',
			data: {
				'p': 'contacts-preview',
				'q': 'exportcvs'
			},
			dataType: 'text',
			success: function(response) {
				phonebookRequest.success(parsePhonebook(response));
			},
			error: function(jqXHR, textStatus, errorThrown) {
				phonebookRequest.error(errorThrown);
			}
		});
	});
}

function GrandstreamGXP14xx(settings) {
	this.protocol = settings.protocol;
	this.host = settings.host;
	this.port = settings.port;
	this.password = settings.password;
	this.account = settings.account;
	this.sid = null;
}

GrandstreamGXP14xx.prototype.login = function(callback) {
	if (this.sid == null) {
		var url_to_call = 
			this.protocol + '://' +
			this.host + '/cgi-bin/dologin';
		var params = 'password=' + this.password;
		var xhr = new XMLHttpRequest();
		xhr.open('POST', url_to_call, true);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhr.withCredentials = true;
		xhr.crossDomain = true;
		var that = this;
		xhr.onreadystatechange = function() {
			console.log(xhr.readyState);
			if (xhr.readyState == 4) {
				var json = JSON.parse(xhr.responseText);
				console.log(json);
				that.sid = json.body.sid;
				callback(that.sid);
		  }
		}
		xhr.send(params);		
	} else {
		callback(this.sid);
	}
}

GrandstreamGXP14xx.prototype.dial = function(dialrequest) {
	var url_to_call = 
		this.protocol + '://' +
		this.host + '/cgi-bin/api-make_call';	
	var params = 'account=' + this.account + '&phonenumber=' +
				dialrequest.phonenumber + '&sid=';
	console.log(url_to_call);
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url_to_call, true);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.withCredentials = true;
	xhr.crossDomain = true;
	xhr.onreadystatechange = function() {
		console.log(xhr.readyState);
		if (xhr.readyState == 4) {
			var json = JSON.parse(xhr.responseText);
			console.log(json);
			if (json.response == 'success') {
				dialrequest.success();
			} else {
				dialrequest.failure();
			}
	  }
	}
	this.login(function(sid) {
		console.log(params + sid);
		xhr.send(params + sid);
	});
}

GrandstreamGXP14xx.prototype.callsLog = function(logrequest) {
	logrequest.success([]);
}
GrandstreamGXP14xx.prototype.hangup = function(hanguprequest) {
	var url_to_call = 
		this.protocol + '://' +
		this.host + '/cgi-bin/api-phone_operation';	
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url_to_call, true);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.withCredentials = true;
	xhr.crossDomain = true;
	xhr.onreadystatechange = function() {
		console.log(xhr.readyState);
		if (xhr.readyState == 4) {
			var json = JSON.parse(xhr.responseText);
			console.log(json);
			if (json.response == 'success') {
				hanguprequest.success();
			} else {
				hanguprequest.failure();
			}
	  }
	}
	this.login(function(sid) {
		var params = 'cmd=endcall&arg=1&sid=' + sid;
		xhr.send(params);
	});
}	

GrandstreamGXP14xx.prototype.phonebook = function(phonebookrequest) {
	var url_to_call = 
		this.protocol + '://' +
		this.host + '/export/phonebook.xml?_stamp=' + (new Date()).getTime();
	console.log(url_to_call);
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url_to_call, true);
	xhr.onreadystatechange = function() {
		console.log(xhr.readyState);
	  	if (xhr.readyState == 4) {
	  		var items = {}
	  		var xml = $($.parseXML(xhr.responseText));
	  		xml.find('Contact').each(function() {
	  			var display_name = $(this).find('FirstName').text() + ' ' + $(this).find('LastName').text();
				items[display_name] = {
					'gravatar': 'http://www.gravatar.com/avatar/00000000000000000000000000000000.png?d=mm&s=96',
					'numbers': []
				};	  			
				items[display_name]['numbers'].push({ 
					'source': 'phone',
					'kind': 'other',
					'number': $(this).find('phonenumber').text()
				});
	  		});
	  		phonebookrequest.success(items);
	  	}
	};
	xhr.send();
}