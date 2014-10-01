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

/********************************************
 Global variables
*********************************************/

var config = new Config();
var phone = null;
var number_utils = null;
var contacts = null;
var contacts_reverse = null;
var calls_log = null;
var context_menu_id = null;

var missed_calls_count = 0;

/********************************************
 Contacts and calls log management functions
*********************************************/
var getGmailContacts = function() {
	var deferred = $.Deferred();
	var gmail = new GMail();
	gmail.getGmailContacts({
		success: function(res) {
			deferred.resolve(res);
		},
		error: function(err) {
			deferred.reject(err);
		}
	});
	return deferred.promise();
};

var getPhoneContacts = function(phone) {
	var deferred = $.Deferred();
	phone.phonebook({
		success: function(res) {
			deferred.resolve(res);
		},
		error: function(err) {
			deferred.reject(err);
		}
	});
	return deferred.promise();
}

var mergeContacts = function(set1, set2) {
	var biggest = set1;
	var smallest = set2;
	if (Object.keys(set1).length < Object.keys(set2).length) {
		biggest = set2;
		smallest = set1;
	} 
	for (var key in smallest) {
		if (biggest.hasOwnProperty(key)) {
			for (var i = 0; i < smallest[key]['numbers'].length; i++) {
				var exists = false;
				for (var k = 0; k < biggest[key]['numbers'].length; k++) {
					var bn = biggest[key]['numbers'][k]['number'];
					var sn = smallest[key]['numbers'][i]['number'];
					if (number_utils.formatPhoneNumber(bn) == number_utils.formatPhoneNumber(sn)) {
						exists = true;
						break;
					}
				}
				if (!exists) {
					biggest[key]['numbers'].push(smallest[key]['numbers'][i]);	
				}
			}
		} else {
			biggest[key] = smallest[key];
		}
	}
	return biggest;
}

var reverseContacts = function(data) {
	var reversed = {}
	for (var key in data) {
		for (var i = 0; i < data[key]['numbers'].length; i++) {
			reversed[number_utils.formatPhoneNumber(data[key]['numbers'][i]['number'])] = key;
		}
	}
	return reversed;
}

var retrieveContacts = function() {
	var phone_contacts = {};
	var gmail_contacts = {};
	var d = getPhoneContacts(phone);
	d.done(function(data) {
		phone_contacts = data;
	});
	d.fail(function(err) {
		console.log('get_phone_contacts fail: ' + err);
	});
	d.always(function() {
		if (config.getSettings().gmail) {
			var d1 = getGmailContacts();
			d1.done(function(data) {
				gmail_contacts = data;
				console.log('get_gmail_contacts succeded');
			});
			d1.fail(function(err) {
				console.log('get_gmail_contacts fail: ' + err);
			});
			d1.always(function() {
				console.log('all done!');
				contacts = mergeContacts(phone_contacts, gmail_contacts);
				contacts_reverse = reverseContacts(contacts);
				start();
			});
		} else {
			contacts = mergeContacts(phone_contacts, gmail_contacts);
			contacts_reverse = reverseContacts(contacts);
			start();
		}
	});	
}
var getCallsLog = function(phone) {
	var deferred = $.Deferred();
	phone.callsLog({
		success: function(res) {
			deferred.resolve(res);
		},
		error: function(err) {
			deferred.reject(err);
		}
	});
	return deferred.promise();
}
var updateCallsLog = function(data) {
	var log = [];
	for (var i = 0; i < data.length; i++) {
		var item = data[i];
		var name = '-';
		var num_for_lookup = number_utils.formatPhoneNumber(item['number']);
		if (contacts_reverse.hasOwnProperty(num_for_lookup)) {
			name = contacts_reverse[num_for_lookup];
		}
		log.push({
			'kind': item['kind'],
			'date': item['date'],
			'time': item['time'],
			'name': name,
			'number': item['number']
		});
	}
	return log;	
}
var flipDate = function(date) {
	return parseInt(date.substring(3) + date.substring(0,2));
}
var checkMissedCalls = function(phone) {
	var d = getCallsLog(phone);
	d.done(function(data) {
		var log = updateCallsLog(data);
		var most_recent_missed = null;
		for (var i = 0; i < calls_log.length; i++) {
			if (calls_log[i]['kind'] == 'missed') {
				most_recent_missed = calls_log[i];
				break;
			}
		}
		calls_log = log;
		if (most_recent_missed != null) {
			var current_date = most_recent_missed['date'];
			var date_to_check = flipDate(current_date);
			var time_to_check = most_recent_missed['time'].replace(':', '');
			
			for (var i = 0; i < log.length; i++) {
				if (log[i]['kind'] == 'missed') {
					var date = flipDate(log[i]['date']);
					var time = log[i]['time'].replace(':', '');
					if (date == date_to_check && time == time_to_check) {
						if (missed_calls_count > 0) {
							chrome.browserAction.setBadgeText({text: '' + missed_calls_count});
							chrome.browserAction.setBadgeBackgroundColor({color: '#cc0000'});
							//notifyMissedCalls(missed_calls_count);
						}
						return;
					}
					missed_calls_count++;
				}
			}
		} else {
			//count missed
		}
	});
}
/********************************************
 Extension function
*********************************************/
var dialSelectedNumber = function(e) {
	dial(e.selectionText);
}
var onRequest = function(request, sender, sendResponse) {
	if (request.action == 'select') {
		var number = number_utils.parsePhoneNumber(request.selection);
		if (number) {
			context_menu_id = chrome.contextMenus.create({
				"title": chrome.i18n.getMessage('mnu_dial', [number]),
				"contexts": ["selection"],
				"onclick": dialSelectedNumber
			}, function() { console.log('context menu created '); });			
		}
	}
	if (request.action == 'unselect') {
		if (context_menu_id) {
			chrome.contextMenus.remove(context_menu_id, function() {
				context_menu_id = null;
			});			
		}
	}
}

var initialize = function() {
	chrome.browserAction.disable();
	if (config.check()) {
		phone_class = config.getSettings().phone;
		phone = new this[phone_class](config.getSettings());
		number_utils = new NumberUtils(config.getSettings().country);
		retrieveContacts();
	}
}
var start = function() {
	var d = getCallsLog(phone);
	d.done(function(data) {
		calls_log = updateCallsLog(data);
		for (var i = 0; i < calls_log.length; i++) {
			if (calls_log[i]['kind'] == 'missed') {
				missed_calls_count++;
			}
		}
		if (missed_calls_count > 0) {
			chrome.browserAction.setBadgeText({text: '' + missed_calls_count});
			chrome.browserAction.setBadgeBackgroundColor({color: '#cc0000'});
		}
	});
	d.always(function() {
		chrome.browserAction.enable();
		chrome.extension.onRequest.addListener(onRequest);
		setInterval(function() {
			checkMissedCalls(phone);
		}, 10000);
	});
}

var dial = function(phone_number) {
	phone_number = number_utils.preparePhoneNumber(phone_number);
	phone.dial({
		phonenumber: phone_number,
		success: function() { notifyDialing(phone_number); },
		failure: function() { notifyDialFailure(phone_number); }
	});
}

config.load(initialize);