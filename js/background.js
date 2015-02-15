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

var config = null;
var phone = null;
var numUtils = null;
var contacts = null;
var contacts_reverse = null;
var contacts_search = null;
var calls_log = null;
var context_menu_id = null;

var missed_calls_count = 0;
var initialized = false;
var profileEmail = null;


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
	phone.getPhonebook({
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
	$.each(smallest, function(key, value) {
		if (biggest.hasOwnProperty(key)) {
			$.each(value['numbers'], function(idx1, val1) {
				var exists = false;
				$.each(biggest[key]['numbers'], function(idx2, val2) {
					if (numUtils.formatPhoneNumber(val1['number']) == numUtils.formatPhoneNumber(val2['number'])) {
						exists = true;
						return false;
					}
				});
				if (!exists) {
					biggest[key]['numbers'].push(val1);
				}
			});
		} else {
			biggest[key] = value;	
		}
	});
	console.log('******merged******');
	console.log(biggest);
	console.log('******end******');
	return biggest;
}

var reverseContacts = function(data) {
	var reversed = {}
	$.each(data, function(key, value) {
		$.each(value['numbers'], function(idx1, val1) {
			reversed[numUtils.formatPhoneNumber(val1['number'])] = key;
		});
	});
	console.log('******searcheable******');
	console.log(reversed);
	console.log('******end******');
	return reversed;
}
var createSearchableContacts = function(data) {
	var serchable = []
	$.each(data, function(key, value) {
		$.each(value['numbers'], function(idx1, val1) {
			var num = numUtils.formatPhoneNumber(val1['number']);
			serchable.push({
				searchable: key + ' ' + num,
				content: num,
				description: 'Call to ' + key + ' ' + num,
				contact: data[key]
			});
		});
	});
	console.log('******searcheable******');
	console.log(serchable);
	console.log('******end******');
	return serchable;
}
var retrieveContacts = function(callback) {
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
				contacts_search = createSearchableContacts(contacts);
				config.set('contacts', contacts, callback);
			});
		} else {
			contacts = mergeContacts(phone_contacts, gmail_contacts);
			contacts_reverse = reverseContacts(contacts);
			contacts_search = createSearchableContacts(contacts);
			config.set('contacts', contacts, callback);
		}
	});	
}
var getCallsLog = function(phone) {
	var deferred = $.Deferred();
	phone.getcallLog({
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
		var num_for_lookup = numUtils.formatPhoneNumber(item['number']);
		if (contacts_reverse.hasOwnProperty(num_for_lookup)) {
			name = contacts_reverse[num_for_lookup];
		}
		log.push({
			'kind': item['kind'],
			'date': item['date'],
			'time': item['time'],
			'ts': item['ts'],
			'name': name,
			'number': item['number']
		});
	}
	return log;	
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
		console.log('calls log retrieved, try to store');
		config.set('calls_log', calls_log, function() {
			console.log('calls log stored !');
			var current_missed_count = missed_calls_count;
			if (most_recent_missed != null) {
				var ts_to_check = most_recent_missed['ts'];
				for (var i = 0; i < log.length; i++) {
					if (log[i]['kind'] == 'missed') {
						if (log[i]['ts'] == ts_to_check) {
							if (missed_calls_count > 0) {
								chrome.browserAction.setBadgeText({text: '' + missed_calls_count});
								chrome.browserAction.setBadgeBackgroundColor({color: '#cc0000'});
								if (current_missed_count < missed_calls_count) {
									notifyMissedCalls(missed_calls_count - current_missed_count);
								}
								config.set('missed_calls_count', missed_calls_count, function() {
									console.log('missed count stored');
								});
							}
							return;
						}
						missed_calls_count++;
					}
				}
			} else {
				for (var i = 0; i < calls_log.length; i++) {
					if (calls_log[i]['kind'] == 'missed') {
						missed_calls_count++;
					}
				}
				if (missed_calls_count > 0) {
					chrome.browserAction.setBadgeText({text: '' + missed_calls_count});
					chrome.browserAction.setBadgeBackgroundColor({color: '#cc0000'});
					notifyMissedCalls(missed_calls_count);
					config.set('missed_calls_count', missed_calls_count, function() {
						console.log('missed count stored');
					});
				}				
			}
		});
	});
}
var resetMissedCallsCount = function() {
	config.set('missed_calls_count', 0, function() {
		missed_calls_count = 0;
		chrome.browserAction.setBadgeText({text: ''});
	});
}

/********************************************
 Omnibox
*********************************************/
chrome.omnibox.onInputStarted.addListener(
	function() {
		chrome.omnibox.setDefaultSuggestion({
			description: chrome.i18n.getMessage('obx_def_suggestion')
		});		
	}
);
chrome.omnibox.onInputChanged.addListener(
  function(text, suggest) {
  	var re = new RegExp(text.toLowerCase(), 'i');
  	var matching = contacts_search.filter(function(obj) {
  		var match = re.test(obj.searchable.toLowerCase());
  		console.log(obj.searchable.toLowerCase() + ' ' + match);
  		return match;
  	});
  	var num = numUtils.parsePhoneNumber(text);
  	var suggested = [];
  	if (num) {
		chrome.omnibox.setDefaultSuggestion({
			description: chrome.i18n.getMessage('obx_dial', [num])
		});
  	} else {
		chrome.omnibox.setDefaultSuggestion({
			description: chrome.i18n.getMessage('obx_def_suggestion')
		});	 		
  	}
  	for (var i = 0; i < matching.length; i++) {
  		suggested.push({
  			content: matching[i].content,
  			description: matching[i].description
  		});
  	}
    suggest(suggested);
  });

chrome.omnibox.onInputEntered.addListener(
  function(text) {
  	dial(text);
  });

/********************************************
 Extension function
*********************************************/
var dialSelectedNumber = function(e) {
	dial(e.selectionText);
}

var onMessage = function(request, sender, sendResponse) {
	console.log('context_menu_id ' + context_menu_id);
	if (request.action == 'select') {
		var number = numUtils.parsePhoneNumber(request.selection);
		if (number) {
			context_menu_id = chrome.contextMenus.create({
				'id': '1',
				'title': chrome.i18n.getMessage('mnu_dial', [number]),
				'contexts': ['selection'],
				'onclick': dialSelectedNumber
			}, function() { console.log('context menu created'); });			
		}
	}
	if (request.action == 'unselect') {
		if (context_menu_id) {
			chrome.contextMenus.remove('1', function() {
				context_menu_id = null;
				console.log('context menu removed');
			});			
		}
	}
}

var initialize = function() {
	if (initialized) {
		return;
	}
	if (config.check()) {
		phone_class = config.getSettings().phone;
		phone = new this[phone_class](config.getSettings());
		numUtils = new NumberUtils(config.getSettings().country);
		initialized = true;
		if (!config.getSettings().contacts) {
			retrieveContacts(start);
		} else {
			contacts = config.getSettings().contacts;
			contacts_reverse = reverseContacts(contacts);
			contacts_search = createSearchableContacts(contacts);
			start();
		}
		
	}
}

var dial = function(phoneNumber) {
	phoneNumber = numUtils.preparePhoneNumber(phoneNumber);
	phone.dial({
		phoneNumber: phoneNumber,
		success: function() { 
			notifyDialing(phoneNumber); 
		},
		error: function(errorThrown) { 
			console.log('dial error: ' + errorThrown);
			notifyDialFailure(phoneNumber); 
		}
	});
}
var hangup = function() {
	phone.hangup({
		success: function() {
			console.log('hangup ok');
		},
		error: function(errorThrown) {
			console.log('hangup fail!');
		}
	});
}
var start = function() {
	calls_log = config.getSettings().calls_log;
	missed_calls_count = config.getSettings().missed_calls_count;
	chrome.browserAction.enable();
	chrome.notifications.onButtonClicked.addListener(hangup);
	chrome.runtime.onMessage.addListener(onMessage);
	console.log('Turtle Dialer startup completed!');
	// setInterval(function() {
	// 	checkMissedCalls(phone);
	// }, 10000);
}

var saveSettings = function(settings) {
	console.log('save settings');
	config.updateSettings(settings, initialize);
}

chrome.runtime.onInstalled.addListener(function(details) {
	if (details.reason == 'install' || details.reason == 'upgrade') {
		chrome.tabs.create({
			url: 'https://github.com/turtledialer/turtledialer_chrome/releases/tag/' + chrome.runtime.getManifest().version
		}, function() {});
	}
});

console.log('starting up Turtle Dialer....');
chrome.browserAction.disable();
chrome.identity.getProfileUserInfo(function(userInfo) {
	profileEmail = userInfo.email;
	console.log(profileEmail);
	config = new Config();
	config.load(initialize);
});

