var yea = new YealinkT2x();



$(function() {
	var populate = function(data) {
		$('#phonebook').empty();
		$('.progress').hide();
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
					'<div class="col-xs-3">' +
					'<strong>' + currObj.name + '</strong>' +
					'</div>' +
					'<div class="col-xs-3">';
				if (currObj.office != '') {
					contact += 							
						'<i class="fa fa-building"></i> ' +
						'<a href="#">' + currObj.office + '</a>';
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
	yea.phonebook({
		success: populate
	});
});