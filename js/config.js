function Config(callback) {
	this.settings = {
		phone: '',
		gmail: false,
		country: '',
		protocol: 'http',
		port: 80
	}
	console.log(this.settings);
}

Config.prototype.set = function(name, value, callback) {
	console.log('callback = ' + callback);
	this.settings[name] = value;
	this.save(callback);
}
Config.prototype.save = function(callback) {
	chrome.storage.local.set({
			'turtle_settings': this.settings
		},
		function() {
			if (callback != undefined) {
				callback();
			}
			console.log('settings saved !');
		}
	)
}
Config.prototype.load = function(callback) {
	var self = this;
	chrome.storage.local.get('turtle_settings', function(data) {
		console.log(data.turtle_settings);
		if (data.turtle_settings === undefined) {
			self.save();
		}
		console.log('settings loaded !');
		self.settings = data.turtle_settings;
		if (callback != undefined) {
			callback();
		}
	});
	
}
Config.prototype.check = function() {
	var country = (this.settings.country != undefined && this.settings.country != '');
	var phone = (this.settings.phone != undefined && this.settings.phone != '');
	var host = (this.settings.host != undefined && this.settings.host != '');
	var port = (this.settings.port != undefined && this.settings.port != '');
	return country && phone && host && port;
}
Config.prototype.getSettings = function() {
	return this.settings;
}