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
			biggest[key]['numbers'].concat(smallest[key]['numbers']);
		} else {
			biggest[key] = smallest[key];
		}
	}
	contacts = biggest;
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
			$.when(get_phone_contacts(), get_gmail_contacts()).then(
				function(phone_contacts, gmail_contacts) {
					merge_contacts(phone_contacts, gmail_contacts);
					console.log('all done!');
					chrome.browserAction.enable();
					extension_ready = true;
				},
				function(error) {
					console.log(error);
				}
			);
		}
	}
}



init_extension();



var context_menu_id = null;

var putil = i18n.phonenumbers.PhoneNumberUtil.getInstance();

function trigger_call(e) {

	parsed_number = putil.parse(e.selectionText, 'ES');
	current_phone.dial({
		phonenumber: parsed_number.getNationalNumber(),
		success: function() {
			chrome.notifications.create("", {
				"type": "basic",
				"iconUrl": "/icons/turtle128.png",
				"title": "Turtle dialer",
				"message": "Dialing " + parsed_number.getNationalNumber(),
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
				"message": "Cannot dial " + parsed_number.getNationalNumber() + ": check your phone configuration!"
			}, function() {});
		}
	});
	console.log('Calling ' + e.selectionText);
}

chrome.notifications.onButtonClicked.addListener(
	function(notification_id, button_idx) {
		yea.hangup({
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
		parsed_number = putil.parse(text_selected, 'ES');
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


/*
	 
	pmd = putil.getMetadataForRegion('ES')
	pmd.getInternationalPrefix()


	pn = putil.parse('+390817434329', 'ES')

	if pn.getCountryCode() != pmd.getCountryCode()
		// add international prefix
		if phonenumber.hasItalianLeadingZero() {
			//add zero
		}



*/