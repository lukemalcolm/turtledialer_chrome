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

var icons = {
	'work': 'glyphicon glyphicon-phone-alt',
	'mobile': 'glyphicon glyphicon-phone',
	'fax': 'fa fa-fax',
	'home': 'fa fa-home'
}

$(function() {
	var contacts = chrome.extension.getBackgroundPage().contacts;
	var sorted_keys = Object.keys(contacts).sort();
	for (var i = 0; i < sorted_keys.length; i++) {
		var curr_contact = contacts[sorted_keys[i]];
		var li = $('<li>').addClass('media list-group-item');
		var a = $('<a>').addClass('pull-left').attr('href', '#');
		li.append(a);
		var avatar = $('<img>').addClass('media-object')/*.attr('src', curr_contact['gravatar'])*/;
		a.append(avatar);
		var body = $('<div>').addClass('media-body');
		li.append(body);
		var heading = $('<h4>').addClass('media-heading');
		heading.text(sorted_keys[i]);
		body.append(heading);
		var numbers = $('<div>').addClass('row contact-card');
		var cols = [
			$('<div>').addClass('col-xs-4'),
			$('<div>').addClass('col-xs-4'),
			$('<div>').addClass('col-xs-4')
		];
		for (var j = 0; j < curr_contact['numbers'].length; j++) {
			var col_to_add = cols[j%3];
			var current_number = curr_contact['numbers'][j];
				var icon_class = 'fa fa-phone';
				if (icons.hasOwnProperty(current_number['kind'])) {
					icon_class = icons[current_number['kind']];
				}
			col_to_add.append($('<i>').addClass(icon_class));
			var num = $('<a>').addClass('number-link').attr('href', '#');
			var phone_number = 
				chrome.extension.getBackgroundPage().number_utils.formatPhoneNumber(
					current_number['number']
			);
			num.text(phone_number);
			col_to_add.append(num);
			col_to_add.append($('<br>'));

		}
		body.append(cols);
		$('#data').append(li);
	}
	$('#data').btsListFilter('#searchinput', {itemChild: 'h4'});
	$('.number-link').click(function() {
		console.log('try dialing  ' + $(this).text());
		chrome.extension.getBackgroundPage().dial($(this).text());	
	});
	$('#tab-links a').click(function (e) {
  		e.preventDefault()
  		$(this).tab('show')
	});
});