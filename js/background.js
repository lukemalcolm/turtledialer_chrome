// var settings = new Store("settings", {});


// var putil = i18n.phonenumbers.PhoneNumberUtil.getInstance();


// var trigger_call = function(e) {

// 	var default_country_code = settings.get("default_country_code");
// 	if (default_country_code != "ES") {
// 		chrome.notifications.create("", {
// 			"type": "basic",
// 			"iconUrl": "/icons/icon48.png",
// 			"title": "Turtle dialer: invalid configuration",
// 			"message": "Invalid country code"
// 		}, function() {});		
// 		return;
// 	}
// 	var host = settings.get("host");
// 	if (host === undefined || host == null || host.length < 1) {
// 		chrome.notifications.create("", {
// 			"type": "basic",
// 			"iconUrl": "/icons/icon48.png",
// 			"title": "Turtle dialer: invalid configuration",
// 			"message": "Invalid host"
// 		}, function() {});		
// 		return;
// 	}

// 	var protocol = settings.get("protocol");

// 	if (protocol === undefined || protocol == null || protocol.length < 1) {
// 		chrome.notifications.create("", {
// 			"type": "basic",
// 			"iconUrl": "/icons/icon48.png",
// 			"title": "Turtle dialer: invalid configuration",
// 			"message": "You must specify the protocol"
// 		}, function() {});		
// 		return;		
// 	}

// 	var username = settings.get("username");
// 	var password = settings.get("password");

// 	var url_to_call = protocol + "://";

// 	if (username != null && username.length > 0) {
// 		url_to_call = url_to_call + username + ":" + password + "@";
// 	}
// 	url_to_call = url_to_call + host;



// 	if (e.selectionText) {
// 		var number_to_call = e.selectionText;

// 		var parsed_number = null;
// 		try {
// 			parsed_number = putil.parse(number_to_call, default_country_code);
// 		} catch (e) {
// 			chrome.notifications.create("", {
// 				"type": "basic",
// 				"iconUrl": "/icons/icon48.png",
// 				"title": "Turtle dialer",
// 				"message": "The number '" + number_to_call + "' is invalid"
// 			}, function() {});		
// 			return;					
// 		}

// 		number_to_call = parsed_number.getNationalNumber();
// 		var model = settings.get("model");
// 		var account = settings.get("account");
// 		if (model == "yealink_t2x") {
// 			url_to_call = url_to_call + "/cgi-bin/ConfigManApp.com?Id=34&Command=1&Number=" + 
// 				number_to_call + "&Account=@" + account;	
// 			console.log(url_to_call);
// 			var xhr = new XMLHttpRequest();
// 			xhr.open('GET', url_to_call, true);
// 			xhr.onreadystatechange = function() {
// 				console.log(xhr.readyState);
// 			  if (xhr.readyState == 4) {
// 			  	console.log(xhr.responseText);
// 			  	if (xhr.responseText != "1") {
// 					chrome.notifications.create("", {
// 						"type": "basic",
// 						"iconUrl": "/icons/icon48.png",
// 						"title": "Turtle dialer",
// 						"message": "Cannot dial " + number_to_call + ": check your phone configuration!"
// 					}, function() {});
// 			  	}
// 			  }
// 			}
// 			xhr.send();
// 			chrome.notifications.create("", {
// 				"type": "basic",
// 				"iconUrl": "/icons/icon48.png",
// 				"title": "Turtle dialer",
// 				"message": "Calling " + number_to_call
// 			}, function() {});
// 		}

// 	}
// }

// chrome.contextMenus.create({
//     "title": chrome.i18n.getMessage("l10nContextMenuItem"),
//     "contexts": ["selection"],
//     "onclick" : trigger_call
//   });


//GData-Version: 3.0



var current_token = null;

var google_contacts = [];

var phone_contacts = null;
// chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
//   current_token = token;
// });


var yea = new YealinkT2x();
yea.log_config();

var refresh_contacts = function(refreshRequest) {
	yea.phonebook({
		success: function(data) {
			phone_contacts = data;
			var all_contacts = [].concat.apply(
				[], 
				[phone_contacts, google_contacts]
			);
			console.log(all_contacts);
			var compare = function(a,b) {
			  if (a.name < b.name)
			     return -1;
			  if (a.name > b.name)
			    return 1;
			  return 0;
			}
			all_contacts.sort(compare);
			console.log(all_contacts);
			refreshRequest.success(all_contacts);
		}
	});
}

// var xhr = new XMLHttpRequest();
// xhr.open('GET', 'https://www.google.com/m8/feeds/contacts/default/full');
// xhr.setRequestHeader('Authorization',
//                    'Bearer ' + current_token);
// xhr.setRequestHeader('GData-Version', '3.0');



// xhr.onreadystatechange = function() {
// 	console.log(xhr.readyState);
//   if (xhr.readyState == 4) {
//   	google_contacts = xhr.responseXML;
//   	console.log(xhr.responseText);
//   }
// }
// xhr.send();	



var next_url = null;

function authenticatedXhr(url, callback) {
	console.log('authenticatedXhr');
	var retry = true;

	function getTokenAndXhr() {
		chrome.identity.getAuthToken({
				'interactive': true
			},
			function(access_token) {
				if (chrome.runtime.lastError) {
					callback(chrome.runtime.lastError);
					return;
				}

				var xhr = new XMLHttpRequest();
				xhr.open('GET', url);
				xhr.setRequestHeader('Authorization',
					'Bearer ' + access_token);
				xhr.setRequestHeader('GData-Version', '3.0');
				xhr.onload = function() {
					if (this.status === 401 && retry) {
						// This status may indicate that the cached
						// access token was invalid. Retry once with
						// a fresh token.
						retry = false;
						chrome.identity.removeCachedAuthToken({
								'token': access_token
							},
							getTokenAndXhr);
						return;
					}

					callback(null, this.status, this.responseText, this.responseXML);
				}
				xhr.send();
			});

	}
	getTokenAndXhr();
}

var contacts_callback = function(error, status, respText, respXML) {
	var contacts = JSON.parse(respText);
	next_url = null;
	var links = contacts['feed']['link'];
	for (var i = 0; i < links.length; i++) {
		if (links[i]['rel'] == 'next') {
			next_link_found = true;
			next_url = links[i]['href'];
			break;
		}
	}
	$.each(contacts['feed']['entry'], function(idx, obj) {
		if (obj.hasOwnProperty('gd$phoneNumber')) {			
			var work = '';
			var mobile = '';
			var other = '';
			for (var i = 0; i < obj['gd$phoneNumber'].length; i++) {
				if (obj['gd$phoneNumber'][i].hasOwnProperty('rel')) {
					if (obj['gd$phoneNumber'][i]['rel'].match(/work$/)) {
						if (obj['gd$phoneNumber'][i].hasOwnProperty('$t')) {
							work = obj['gd$phoneNumber'][i]['$t'];
							console.log('name: ' + obj['title']['$t'] + ' work: ' +
								obj['gd$phoneNumber'][i]['$t']);
						}
						
					}
					if (obj['gd$phoneNumber'][i]['rel'].match(/mobile$/)) {
						mobile = obj['gd$phoneNumber'][i]['$t'];
					}
					if (obj['gd$phoneNumber'][i]['rel'].match(/other$/)) {
						other = obj['gd$phoneNumber'][i]['$t'];
					}
				}
			}
			google_contacts.push({
				'type': 'google',
				'name': obj['title']['$t'],
				'work': work,
				'mobile': mobile,
				'other': other
			});
		}
	});
	if (next_url != null) {
		authenticatedXhr(next_url, contacts_callback);	
	}
}

authenticatedXhr('https://www.google.com/m8/feeds/contacts/default/full?alt=json&max-results=100', contacts_callback);




var context_menu_id = null;

var putil = i18n.phonenumbers.PhoneNumberUtil.getInstance();

function trigger_call(e) {

	parsed_number = putil.parse(e.selectionText, 'ES');
	yea.dial({
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