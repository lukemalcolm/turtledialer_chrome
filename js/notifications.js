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

var notifyMissedCalls = function(number) {
	chrome.notifications.create('', {
		'type': 'basic',
		'iconUrl': '/icons/turtledialer_128_3.png',
		'title': 'Turtle dialer',
		'message': chrome.i18n.getMessage('not_missed_calls', [number])
	}, function() {});
}