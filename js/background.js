var phones = {
	'yealink_t2x' : YealinkT2x
}


var extension_ready = false;
var current_phone = null;
var contacts = null;
var gmail = new GMail();
var phone_utils = i18n.phonenumbers.PhoneNumberUtil.getInstance();

var current_country = null;


var format_phone_number = function(phone_number) {
	try {
		var pn = phone_utils.parse(phone_number, current_country);
		if (phone_utils.isValidNumber(pn)) {
			phone_number = phone_utils.format(
				pn,
				i18n.phonenumbers.PhoneNumberFormat.E164
			);
		}
	} catch(e) {
	}
	return phone_number;
}

var dial = function(phone_number) {
	var pmd = phone_utils.getMetadataForRegion(current_country);
	try {
		var pn = phone_utils.parse(phone_number, current_country);
		if (pn.getCountryCode() == pmd.getCountryCode()) {
			phone_number = pn.getNationalNumber();
		} else {
			phone_number = pmd.getInternationalPrefix() + 
				pn.getCountryCode() +
				(pn.hasItalianLeadingZero() ? '0' : '') + 
				pn.getNationalNumber();
		}
	} catch (e) {
	}
	console.log('call to: ' + phone_number);
	current_phone.dial({
		phonenumber: phone_number,
		success: function() {
			chrome.notifications.create("", {
				"type": "basic",
				"iconUrl": "/icons/turtle128.png",
				"title": "Turtle dialer",
				"message": "Dialing " + phone_number,
				"buttons": [{
					'title': 'Hangup',
					"iconUrl": "/icons/hangup32.png"
				}]
			}, function() {});
		},
		failure: function() {
			chrome.notifications.create("", {
				"type": "basic",
				"iconUrl": "/icons/turtle128.png",
				"title": "Turtle dialer",
				"message": "Cannot dial " + phone_number + ": check your phone configuration!"
			}, function() {});
		}
	});
	

}

var get_phone_contacts = function() {
	var deferred = $.Deferred();
	console.log('get_phone_contacts');
	current_phone.phonebook({
		success: function(res) {
			deferred.resolve(res);
		},
		error: function(err) {
			deferred.reject(err);
		}
	});
	return deferred.promise();
}

var get_gmail_contacts = function() {
	var deferred = $.Deferred();
	console.log('get_google_contacts');
	gmail.get_gmail_contacts({
		success: function(res) {
			deferred.resolve(res);
		},
		error: function(err) {
			deferred.reject(err);
		}
	});
	return deferred.promise();
};


var merge_contacts = function(set1, set2) {
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
					if (format_phone_number(bn) == format_phone_number(sn)) {
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
	contacts = biggest;
	console.log(biggest);
	console.log('total size ' + Object.keys(biggest).length);
};

var init_extension = function() {
	chrome.browserAction.disable();
	var phone_model = localStorage['turtle.settings.phone_model'];
	current_country = localStorage['turtle.settings.country'];
	if (phone_model != undefined) {
		current_phone = new phones[phone_model];
		current_phone.log_config();
		if (current_phone.load_config()) {
			console.log('config ok!');
			var phone_contacts = {};
			var gmail_contacts = {};
			var d = get_phone_contacts();
			d.done(function(data) {
				phone_contacts = data;
				console.log('get_phone_contacts succeded');
			});
			d.fail(function(err) {
				console.log('get_phone_contacts fail: ' + err);
			});
			d.always(function() {
				console.log('always execute get_gmail_contacts');
				var d1 = get_gmail_contacts();
				d1.done(function(data) {
					gmail_contacts = data;
					console.log('get_gmail_contacts succeded');
				});
				d1.fail(function(err) {
					console.log('get_gmail_contacts fail: ' + err);
				});
				d1.always(function() {
					console.log('all done!');
					merge_contacts(phone_contacts, gmail_contacts);
					chrome.browserAction.enable();
					chrome.browserAction.setBadgeText({text: '' + Object.keys(contacts).length});
					chrome.browserAction.setBadgeBackgroundColor({color: '#00cc00'});
					extension_ready = true;
				});

			});
		}
	}
}



init_extension();



var context_menu_id = null;

function trigger_call(e) {
	dial(e.selectionText);
}

chrome.notifications.onButtonClicked.addListener(
	function(notification_id, button_idx) {
		current_phone.hangup({
			success: function() {
				console.log('hangup success');
			},
			failure: function() {
				console.log('hangup failure');
			}
		});
	}
);

function onRequest(request, sender, sendResponse) {
	var text_selected = request.text_selected;
	console.log('text selected: ' + text_selected);
	var parsed_number = null;
	try {
		parsed_number = phone_utils.parse(text_selected, 'ES');
	} catch (e) {}
	if (parsed_number != null) {
		console.log('parsed number not null and context_menu_id = ' + context_menu_id);
		if (context_menu_id != null) {
			return;
		}
		context_menu_id = chrome.contextMenus.create({
			"title": "Call to " + parsed_number.getNationalNumber(),
			"contexts": ["selection"],
			"onclick": trigger_call
		}, function() { console.log('context menu created '); });
	} else {
		console.log('parsed number is null and context_menu_id = ' + context_menu_id);
		if (context_menu_id != null) {
			chrome.contextMenus.remove(context_menu_id, function() {
				context_menu_id = null;
			});
		}
	}
}
chrome.extension.onRequest.addListener(onRequest);



var test_set = function() {
	chrome.storage.local.set(
		{
			'turtledialer_settings': {
				'phone_type': 'yealink_t2x',
				'country': 'ES'
			}
		},
		function() {
			console.log('saved');
		}
	);	
}

var test_get = function() {
	chrome.storage.local.get(
		'turtledialer_settings',
		function(data) {
			console.log(data.turtledialer_settings === undefined);
			console.log(data.turtledialer_settings);
		}
	);	
}

