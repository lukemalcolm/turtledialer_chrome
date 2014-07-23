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
		['protocol1', 'protocol2', 'host', 'port', 
			'username', 'password', 'account', 'country'],
		function(idx, obj) {
			console.log('object: ' + obj);
			var input = $('#' + obj);
			if (input.attr('type') == 'text' || input.attr('type') == 'password') {
				input.val(localStorage['turtle.settings.' + obj]);
				input.change(
					function() {
						console.log(obj + ' changed: ' + input.val());
						localStorage['turtle.settings.' + obj] = input.val();
					}
				)			
			} else if (input.attr('type') == 'radio') {
				var value = localStorage['turtle.settings.' + input.attr('name')]
				if (input.val() == value) {
					input.attr('checked', 'checked');
				}
				input.change(
					function() {
						if (input.is(':checked')) {
							localStorage['turtle.settings.' + input.attr('name')] = input.val();
						}
					}
				)
			} else if (input.is('select')) {
				var value = localStorage['turtle.settings.' + input.attr('name')]
				if (value != undefined) {
					input.val(value);
				}
				input.change(
					function(obj) {
						var value = $(this).val();
						localStorage['turtle.settings.' + input.attr('name')] = value;
					}
				);
			}
		}
	);
});