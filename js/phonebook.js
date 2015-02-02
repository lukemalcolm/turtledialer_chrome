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
	'home': 'fa fa-home',
	'outgoing': 'glyphicon glyphicon-resize-full outgoing',
	'incoming': 'glyphicon glyphicon-resize-small incoming',
	'missed': 'glyphicon glyphicon-warning-sign missed'
}

var renderContacts = function() {
	var contacts = chrome.extension.getBackgroundPage().contacts;
	$('#data').empty();
	var sorted_keys = Object.keys(contacts).sort();
	for (var i = 0; i < sorted_keys.length; i++) {
		var curr_contact = contacts[sorted_keys[i]];
		var li = $('<li>').addClass('media list-group-item');
		var a = $('<a>').addClass('pull-left').attr('href', '#');
		li.append(a);
		var avatar = $('<img>').addClass('media-object').attr('width', '96').attr('height', '96')
			.attr('id', 'avatar_' + i).attr('src', curr_contact['gravatar']);
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
			var col_to_add = cols[j % 3];
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
}

var renderCallLog = function() {
	var call_log = chrome.extension.getBackgroundPage().calls_log;
	for (var i = 0; i < call_log.length; i++) {
		var tr = $('<tr>');
		var td = $('<td>').addClass('col-icon');
		var span = $('<span>');
		span.addClass(icons[call_log[i]['kind']]);
		td.append(span);
		tr.append(td);
		td = $('<td>').addClass('col-when');
		td.text(call_log[i]['date'] + ' ' + call_log[i]['time']);
		tr.append(td);
		td = $('<td>').addClass('col-who');
		p = $('<p>');
		td.append(p);
		p.text(call_log[i]['name']);
		tr.append(td);
		td = $('<td>').addClass('col-number');
		var num = $('<a>').addClass('number-link').attr('href', '#');
		num.text(call_log[i]['number']);
		td.append(num);
		tr.append(td);
		$('#tbl-log').append(tr);
	}	
}
var linkNumbers = function() {
	$('.number-link').click(function() {
		console.log('try dialing  ' + $(this).text());
		chrome.extension.getBackgroundPage().dial($(this).text());
	});
}

$(function() {
	$('[id^=lbl_]').each(
		function() {
			var msg = chrome.i18n.getMessage($(this).attr('id'));
			if (msg != undefined && msg != '') {
				$(this).text(msg);
			}

		}
	);

	$('#btn_sync').click(function() {
		$('#btn_sync span').addClass('fa-spin');
		chrome.extension.getBackgroundPage().retrieveContacts(function() {
			$('#btn_sync span').removeClass('fa-spin');
			renderContacts();
			linkNumbers();
		});
	});

	chrome.extension.getBackgroundPage().resetMissedCallsCount();
	renderContacts();
	renderCallLog();
	linkNumbers();

	$('a[data-toggle="tab"]').click(function(e) {
		e.preventDefault();
		$(this).tab('show');
		$('#searchinput').val('');
		$('#searchinput').trigger('keyup');
	});

	$('#searchinput').keyup(function() {
	    var value = this.value;
		var re = new RegExp(value, 'i');
		if ($('#pb-tab').is(':visible')) {
		    $('#data').find('.list-group-item').each(function() {
		        var id = $(this).find("h4").first().text();
		        $(this).toggle(re.test(id));
		    });
		} else {
			$('#tbl-log').find('tr').each(function() {
		        var id = $(this).find("p").first().text();
		        $(this).toggle(re.test(id));
		    });
		}
		var num = chrome.extension.getBackgroundPage().number_utils.parsePhoneNumber(value);
		if (num) {
			$('#btn_dial').removeAttr('disabled');
		} else {
			$('#btn_dial').attr('disabled', 'disabled');
		}
	});
	$('#btn_dial').click(function() {
		var num = chrome.extension.getBackgroundPage().dial($('#searchinput').val());
	});
	$('#btn_hangup').click(function() {
		chrome.extension.getBackgroundPage().hangup();
	});
});