$(function () {
	$('[id^=lbl_]').each(
		function() {
			console.log($(this));
			var msg = chrome.i18n.getMessage($(this).attr('id'));
			if (msg != undefined) {
				$(this).text(msg);
			}
			
		}
	);
	var phone_model = localStorage['turtle.settings.phone_model'];
	if (phone_model != undefined) {
		$('#phone_model').val(phone_model);
		$('#' + phone_model).removeClass("hide");
	}
	$("#phone_model").change(
		function(obj) {
			var selected_model = $(this).val();
			console.log(selected_model);
			localStorage['turtle.settings.phone_model'] = selected_model;
			$('#' + selected_model).removeClass("hide");
			$('#phone_model > option').each(function() {
				if (!$(this).is(':selected')) {
					$('#' + $(this).val()).addClass("hide");
				}
			});
		}
	);
	$.each(
		['protocol1', 'protocol2', 'host', 'port', 'username', 'password'],
		function(idx, obj) {
			console.log('object: ' + obj);
			$('#' + obj).val(localStorage['turtle.settings.' + obj]);
			$('#' + obj).change(
				function() {
					console.log(obj + ' changed: ' + $('#' + obj).val());
					localStorage['turtle.settings.' + obj] = $('#' + obj).val();
				}
			);
		}
	);
});