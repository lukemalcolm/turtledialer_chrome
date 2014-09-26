var notifyDialing = function(number) {
	console.log('notify dialing')
	chrome.notifications.create('', {
		'type': 'basic',
		'iconUrl': '/icons/turtledialer_128_3.png',
		'title': 'Turtle dialer',
		'message': chrome.i18n.getMessage('not_dialing', [number]),
		'buttons': [{
			'title': chrome.i18n.getMessage('not_hangup'),
			'iconUrl': '/icons/hangup32.png'
		}]
	}, function() {});	
} 

var notifyDialFailure = function(number) {
	chrome.notifications.create('', {
		'type': 'basic',
		'iconUrl': '/icons/turtledialer_128_3.png',
		'title': 'Turtle dialer',
		'message': chrome.i18n.getMessage('not_dial_failure', [number])
	}, function() {});
}