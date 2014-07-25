$(function() {
	$('#navigation').hide();
	var populate = function(data) {
		$('#data').empty();
		$('#data').show();
		$('#letters_list').empty();
		$('.progress').hide();
		$('#navigation').show();
		var navs = {};
		var lastIdx = 0;
		for (var i = 0; i < 26; i++) {
			var currentLetter = String.fromCharCode(65 + i);
			var tabnav = $('<li>');
			$('#letters_list').append(tabnav);
			if (currentLetter == 'A') {
				tabnav.addClass("active");
			}
			tabnav.append('<a href="#" class="letter-disabled">' + currentLetter + '</a>');
			navs[currentLetter] = tabnav;
			var first_time_letter = true;
			for (var j = lastIdx; j < data.length; j++) {
				var contact = '';
				var currObj = data[j];
				if (currObj.name.charAt(0).toUpperCase() != currentLetter) {
					lastIdx = j;
					break;
				}
				if (first_time_letter) {
					first_time_letter = false;
					var currnav = navs[currentLetter];
					currnav.find('a').attr('href', '#' + currentLetter).removeClass('letter-disabled');
					contact += '<section id="' + currentLetter + '"></section>' +
						'<div class="row">' +
						'<div class="col-xs-12">' +
						'<legend>' + currentLetter + '</legend>' +
						'</div>' +
						'</div>'; 
				}
				contact += 
					'<div class="row">' +
					'<div class="col-xs-3">';
				if (currObj.type == 'phone') {
					contact += 
						'<span class="fa fa-phone-square"></span> ';
				} else {
					contact += 
						'<span class="fa fa-google"></span> ';					
				}
				contact += 
					'<strong>' + currObj.name + '</strong>' +
					'</div>' +
					'<div class="col-xs-3">';
				if (currObj.work != '') {
					contact += 							
						'<i class="fa fa-building"></i> ' +
						'<a href="#">' + currObj.work + '</a>';
				}
				contact += '</div>' +
					'<div class="col-xs-3">';
				if (currObj.mobile != '') {
					contact +=
						'<i class="fa fa-mobile"></i> ' +
						'<a href="#">' + currObj.mobile + '</a>';
				}
				contact += '</div>' +
					'<div class="col-xs-3">';
				if (currObj.other != '') {
					contact += 
						'<i class="fa fa-phone"></i> ' +
						'<a href="#">' + currObj.other + '</a>';
				}
				contact += 
					'</div>' +
					'</div>';
				$('#data').append(contact);
			}
		}
		$('#data a').click(function() {
			var number = $(this).text();
			console.log('dialing ' + number);
			yea.dial({
				phonenumber: number,
				success: function() {
					chrome.notifications.create("", {
						"type": "basic",
						"iconUrl": "/icons/turtle128.png",
						"title": "Turtle dialer",
						"message": "Dialing " + number,
						"buttons": [ { 'title': 'Hangup', "iconUrl": "/icons/hangup32.png" } ]
					}, function() {});
				},
				failure: function() {
					chrome.notifications.create("", {
						"type": "basic",
						"iconUrl": "/icons/turtle128.png",
						"title": "Turtle dialer",
						"message": "Cannot dial " + number + ": check your phone configuration!"
					}, function() {});
				}
			});
		});
		$('#spy').scrollspy('refresh');
	};
	// yea.phonebook({
	// 	success: populate
	// });
	var refresh_contacts = function() {
		$('.progress').show();
		$('#navigation').hide();
		$('#data').hide();
		chrome.extension.getBackgroundPage().refresh_contacts({
			success: populate
		});
	};
	$('#refresh').click(refresh_contacts);
	refresh_contacts();
});