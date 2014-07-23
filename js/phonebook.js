// $(function() {
// 	Papa.parse(
// 		//'http://admin:gestiovoz@192.168.107.101/cgi-bin/ConfigManApp.com?Id=28&form=1',
// 		'https://www.dropbox.com/s/8veqwmravfgnl4s/contact.csv?dl=1',
// 		{
// 			download: true,
// 			header: true,
// 			delimiter: ',',
// 			complete: function(results, file) {
// 				$('#phonebook').empty();
// 				var compare = function(a,b) {
// 				  if (a.DisplayName < b.DisplayName)
// 				     return -1;
// 				  if (a.DisplayName > b.DisplayName)
// 				    return 1;
// 				  return 0;
// 				}
// 				results.data.sort(compare);


// 				var currentLetter = null;
// 				for (var j = 0; j < results.data.length; j++) {
// 					var contact = '';
// 					var currObj = results.data[j];
// 					if (currObj.DisplayName.charAt(0).toUpperCase() != currentLetter) {
// 						currentLetter = currObj.DisplayName.charAt(0).toUpperCase();
// 						var tabnav = $('<li>');
// 						$('#letters_list').append(tabnav);
// 						if (currentLetter == 'A') {
// 							tabnav.addClass("active");
// 						}
// 						tabnav.append('<a href="#' + currentLetter + '">' + currentLetter + '</a>');
// 						contact += '<section id="' + currentLetter + '"></section>' +
// 							'<div class="row">' +
// 							'<div class="col-xs-12">' +
// 							'<legend>' + currentLetter + '</legend>' +
// 							'</div>' +
// 							'</div>'; 
// 					}
// 					contact += 
// 						'<div class="row">' +
// 						'<div class="col-xs-3">' +
// 						'<strong>' + currObj.DisplayName + '</strong>' +
// 						'</div>' +
// 						'<div class="col-xs-3">';
// 					if (currObj.OfficeNumber != '') {
// 						contact += 							
// 							'<i class="fa fa-building"></i> ' +
// 							'<a href="javascript:call(\'' + currObj.OfficeNumber + '\');">' + currObj.OfficeNumber + '</a>';
// 					}
// 					contact += '</div>' +
// 						'<div class="col-xs-3">';
// 					if (currObj.MobilNumber != '') {
// 						contact +=
// 							'<i class="fa fa-mobile"></i> ' +
// 							'<a href="javascript:call(\'' + currObj.MobilNumber + '\');">' + currObj.MobilNumber + '</a>';
// 					}
// 					contact += '</div>' +
// 						'<div class="col-xs-3">';
// 					if (currObj.OtherNumber != '') {
// 						contact += 
// 							'<i class="fa fa-phone"></i> ' +
// 							'<a href="javascript:call(\'' + currObj.OtherNumber + '\');">' + currObj.OtherNumber + '</a>';
// 					}
// 					contact += 
// 						'</div>' +
// 						'</div>';
// 					$('#data').append(contact);
// 				}
// 				$('#spy').scrollspy('refresh');
// 			}
// 		}
// 	);
// });


$(function() {
	Papa.parse(
		//'http://admin:gestiovoz@192.168.107.101/cgi-bin/ConfigManApp.com?Id=28&form=1',
		'https://www.dropbox.com/s/8veqwmravfgnl4s/contact.csv?dl=1',
		{
			download: true,
			header: true,
			delimiter: ',',
			complete: function(results, file) {
				$('.progress').hide();
				$('#phonebook').empty();
				var compare = function(a,b) {
				  if (a.DisplayName < b.DisplayName)
				     return -1;
				  if (a.DisplayName > b.DisplayName)
				    return 1;
				  return 0;
				}
				results.data.sort(compare);

				var lastIdx = 0;

				var navs = {}

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
					for (var j = lastIdx; j < results.data.length; j++) {
						var contact = '';
						var currObj = results.data[j];
						if (currObj.DisplayName.charAt(0).toUpperCase() != currentLetter) {
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
							'<strong>' + currObj.DisplayName + '</strong>' +
							'</div>' +
							'<div class="col-xs-3">';
						if (currObj.OfficeNumber != '') {
							contact += 							
								'<i class="fa fa-building"></i> ' +
								'<a href="javascript:call(\'' + currObj.OfficeNumber + '\');">' + currObj.OfficeNumber + '</a>';
						}
						contact += '</div>' +
							'<div class="col-xs-3">';
						if (currObj.MobilNumber != '') {
							contact +=
								'<i class="fa fa-mobile"></i> ' +
								'<a href="javascript:call(\'' + currObj.MobilNumber + '\');">' + currObj.MobilNumber + '</a>';
						}
						contact += '</div>' +
							'<div class="col-xs-3">';
						if (currObj.OtherNumber != '') {
							contact += 
								'<i class="fa fa-phone"></i> ' +
								'<a href="javascript:call(\'' + currObj.OtherNumber + '\');">' + currObj.OtherNumber + '</a>';
						}
						contact += 
							'</div>' +
							'</div>';
						$('#data').append(contact);
					}
				}
				$('#spy').scrollspy('refresh');
			}
		}
	);
});