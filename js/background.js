
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


var yea = new YealinkT2x();
yea.log_config();

var context_menu_id = null;

var putil = i18n.phonenumbers.PhoneNumberUtil.getInstance();

function trigger_call(e)
{

	parsed_number = putil.parse(e.selectionText, 'ES');
	yea.dial({
		phonenumber: parsed_number.getNationalNumber(),
		success: function() {
			chrome.notifications.create("", {
				"type": "basic",
				"iconUrl": "/icons/turtle128.png",
				"title": "Turtle dialer",
				"message": "Dialing " + parsed_number.getNationalNumber(),
				"buttons": [ { 'title': 'Hangup', "iconUrl": "/icons/hangup32.png" } ]
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
		console.log('hangup '+ button_idx);
	}
);

function onRequest(request, sender, sendResponse) {
	var text_selected = request.text_selected;
	try {
		parsed_number = putil.parse(text_selected, 'ES');
  		context_menu_id = chrome.contextMenus.create({
    		"title": "Call to " + parsed_number.getNationalNumber(),
    		"contexts": [ "selection" ],
    		"onclick": trigger_call
  		});
	} catch (e) {
	  chrome.contextMenus.remove(context_menu_id, function() {
	    context_menu_id = null;
	  });
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
