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

$(function() {

	var localizeLabels = function() {
		$('[id^=lbl_]').each(
			function() {
				console.log($(this));
				var msg = chrome.i18n.getMessage($(this).attr('id'));
				if (msg != undefined && msg != '') {
					$(this).text(msg);
				}
				
			}
		);		
	}

	var fillPhoneSettings = function() {
		if (settings.protocol != undefined) {
			$('#proto_' + settings.protocol).attr('checked', 'checked');
		}

		if (settings.host != undefined) {
			$('#host').val(settings.host);
		}

		if (settings.port != undefined) {
			$('#port').val(settings.port);
		}

		if (settings.username != undefined) {
			$('#username').val(settings.username);
		}

		if (settings.password != undefined) {
			$('#password').val(settings.password);
		}

		if (settings.account != undefined) {
			$('#account').val(settings.account);
		}		
		$('#settings').data('bootstrapValidator').validate();
	}

	var bindPhoneSettingsEvents = function() {
		$('#proto_http').change(
			function() {
				if ($(this).is(':checked')) {
					set('protocol', 'http');
					$('#port').val('80');
				}
			}
		);
		$('#proto_https').change(
			function() {
				if ($(this).is(':checked')) {
					set('protocol', 'https');
					$('#port').val('443');
				}
			}
		);
		$('#host').on('keyup change', function() {
			set('host', $(this).val());
		});

		$('#port').on('keyup change', function() {
			set('port', parseInt($(this).val()));
		});

		$('#username').on('keyup change', function() {
			set('username', $(this).val());
		});

		$('#password').on('keyup change', function() {
			set('password', $(this).val());
		});

		$('#account').on('keyup change', function() {
			set('account', $(this).val());
		});		
	}

	var bp = chrome.extension.getBackgroundPage();
	var settings = bp.config.getSettings();

	var set = function(name, value) {
		bp.config.set(name, value, bp.initialize);
	}

	localizeLabels();

	$('#settings').bootstrapValidator({
        message: 'This value is not valid',
        fields: {
            country: {
            	trigger: 'change blur',
                message: 'The country is not valid',
                validators: {
                    notEmpty: {
                        message: chrome.i18n.getMessage('lbl_vld_country_required')
                    }
                }
            },
            phone: {
            	trigger: 'change blur',
                message: 'The phone model is not valid',
                validators: {
                    notEmpty: {
                        message: chrome.i18n.getMessage('lbl_vld_phone_required')
                    }
                }
            },
            host: {
            	trigger: 'blur keyup',
                message: 'The hostname is not valid',
                validators: {
                    notEmpty: {
                        message: chrome.i18n.getMessage('lbl_vld_host_required')
                    }
                }            	
            },
            port: {
            	trigger: 'blur keyup',
                message: 'The port is not valid',
                validators: {
                    between: {
                        message: chrome.i18n.getMessage('lbl_vld_port_range'),
                        min: 1,
                        max: 65535,
                        type: 'range',
                        inclusive: true
                    },
                    digits: {
                    	message: chrome.i18n.getMessage('lbl_vld_port_numeric')
                    }
                }
            }
        }
    });


	if (settings.country != undefined) {
		$('#country').val(settings.country);
	}

	if (settings.gmail != undefined && settings.gmail == true) {
		$('#gmail').attr('checked', 'checked');
	}

	if (settings.phone != undefined) {
		$('#phone').val(settings.phone);
		$('#phone_form').empty();
		$('#phone_form').load(
			chrome.extension.getURL("/html/" + settings.phone + '.html'),
			function() {
				console.log('loaded !');
				localizeLabels();
				fillPhoneSettings();
				bindPhoneSettingsEvents();
			}
		);
	}



	$('#phone').change(
		function() {
			var selected_model = $(this).val();
			set('phone', selected_model);
			$('#phone_form').empty();
			$('#phone_form').load(
				chrome.extension.getURL("/html/" + settings.phone + '.html'), 
				function() {
					localizeLabels();
					fillPhoneSettings();
					bindPhoneSettingsEvents();
				}
			);
		}
	);

	$('#country').change(
		function() {
			var selected_country = $(this).val();
			set('country', selected_country);
		}
	);

	$('#gmail').change(
		function() {
			set('gmail', $(this).is(':checked'));
		}
	);
	
	$('#settings').data('bootstrapValidator').validate();
});