$(function() {
	$('body').scrollspy({ target: '#indexgs∫∫XZZ	' })
	Papa.parse(
		//'http://admin:gestiovoz@192.168.107.101/cgi-bin/ConfigManApp.com?Id=28&form=1',
		'https://www.dropbox.com/s/8veqwmravfgnl4s/contact.csv?dl=1',
		{
			download: true,
			header: true,
			delimiter: ',',
			complete: function(results, file) {
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

				for (var i = 0; i < 26; i++) {
					var currentLetter = String.fromCharCode(65 + i);
					var tabpane = $('<div>', { 'id': currentLetter, 'class': 'tab-pane'});
					tabpane.append('<legend>' + currentLetter + '</legend>');
					var tabnav = $('<li>');
					if (currentLetter == 'A') {
						tabpane.addClass("active");
						tabnav.addClass("active");
					}
					$('#letters').append(tabnav);
					tabnav.append('<a href="#' + currentLetter + '" data-toggle="tab">' +
						currentLetter + '</a>');

					for (var j = lastIdx; j < results.data.length; j++) {
						var currObj = results.data[j];
						if (currObj.DisplayName.charAt(0).toUpperCase() != currentLetter) {
							lastIdx = j;
							break;
						}
						tabpane.append(
							'<div class="row">' +
							'<div class="col-xs-3">' +
							'<strong>' + currObj.DisplayName + '</strong>' +
							'</div>' +
							'<div class="col-xs-3">' +
							'<i class="fa fa-building"></i> ' +
							'<a href="javascript:call(\'' + currObj.OfficeNumber + '\');">' + currObj.OfficeNumber + '</a>' +
							'</div>' +
							'<div class="col-xs-3">' +
							'<i class="fa fa-mobile"></i> ' +
							'<a href="javascript:call(\'' + currObj.MobilNumber + '\');">' + currObj.MobilNumber + '</a>' +
							'</div>' +
							'<div class="col-xs-3">' +
							'<i class="fa fa-phone"></i> ' +
							'<a href="javascript:call(\'' + currObj.OtherNumber + '\');">' + currObj.OtherNumber + '</a>' +
							'</div>' +
							'</div>'
						);

					}
					$('#tabs').append(tabpane);
				}
			}
		}
	);
});