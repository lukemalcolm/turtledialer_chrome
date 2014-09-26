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

/********************************************
 Contacts management functions
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
};

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
		console.log('gmail contact fail');
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
				start();
			});
		} else {
			contacts = mergeContacts(phone_contacts, gmail_contacts);
			start();
		}
	});	
}

/********************************************
 Extension function
*********************************************/
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
	chrome.browserAction.enable();
	// chrome.browserAction.setBadgeText({text: '' + Object.keys(contacts).length});
	// chrome.browserAction.setBadgeBackgroundColor({color: '#00cc00'});
	chrome.contextMenus.create({
		title: chrome.i18n.getMessage('mnu_dial'),
		contexts: ["selection"],
		onclick: function(e) {
			dial(e.selectionText);
		}
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