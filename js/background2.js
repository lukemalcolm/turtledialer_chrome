var settings = {
	phone_model: '',
	gmail: false,
	country: '',
	protocol: 'http',
	port: 80
};


var set = function(name, value) {
	settings[name] = value;
	chrome.storage.local.set({
			'turtle_settings': settings
		},
		function() {
			console.log('settings saved !');
			initialize();
		}
	)
}

var initialize = function() {
	var tabOptions = {
		'url': chrome.extension.getURL('html/settings.html')
	};
	chrome.storage.local.get('turtle_settings', function(data) {
		if (data.turtle_settings === undefined) {
			chrome.tabs.query(
				tabOptions,
				function(tabs) {
					if (tabs.length == 0) {
						chrome.tabs.create(tabOptions, function() {});
					}
				}
			);
			return;
		}
		settings = data.turtle_settings;
	});
}

initialize();