var next_url = null;

var google_contacts = {};

function retrieve_gcontacts(request, url, callback) {
	var retry = true;

	function getTokenAndXhr() {
		chrome.identity.getAuthToken({
				'interactive': true
			},
			function(access_token) {
				if (chrome.runtime.lastError) {
					callback(request, chrome.runtime.lastError);
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

					callback(request, null, this.status, this.responseText, this.responseXML);
				}
				xhr.send();
			});

	}
	getTokenAndXhr();
}

var contacts_callback = function(request, error, status, respText, respXML) {
	if (error != null) {
		return request.error(error);
	}
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
			var name = obj['title']['$t'];
			google_contacts[name] = []
			for (var i = 0; i < obj['gd$phoneNumber'].length; i++) {
				if (obj['gd$phoneNumber'][i].hasOwnProperty('rel')) {
					google_contacts[name].push({ 
							'source': 'gmail',
							'kind': obj['gd$phoneNumber'][i]['rel'].substring(33),
							'number': obj['gd$phoneNumber'][i]['$t']
					});
				}
			}
		}
	});
	if (next_url != null) {
		retrieve_gcontacts(request, next_url, contacts_callback);
	} else {
		request.success(google_contacts);
	}
}
function GMail() {

}
GMail.prototype.get_gmail_contacts = function(request) {
	retrieve_gcontacts(request, 'https://www.google.com/m8/feeds/contacts/default/full?alt=json&max-results=1000', contacts_callback);
};


