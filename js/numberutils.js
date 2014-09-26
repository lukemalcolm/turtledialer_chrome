function NumberUtils(country) {
	this.country = country;
	this.number_utils = i18n.phonenumbers.PhoneNumberUtil.getInstance();
}


// number management
NumberUtils.prototype.formatPhoneNumber = function(phone_number) {
	try {
		var pn = this.number_utils.parse(phone_number, this.country);
		if (this.number_utils.isValidNumber(pn)) {
			phone_number = this.number_utils.format(
				pn,
				i18n.phonenumbers.PhoneNumberFormat.E164
			);
		}
	} catch(e) {
	}
	return phone_number;
}

NumberUtils.prototype.preparePhoneNumber = function(phone_number) {
	var pmd = this.number_utils.getMetadataForRegion(this.country);
	try {
		var pn = this.number_utils.parse(phone_number, this.country);
		if (pn.getCountryCode() == pmd.getCountryCode()) {
			phone_number = pn.getNationalNumber();
		} else {
			phone_number = pmd.getInternationalPrefix() + 
				pn.getCountryCode() +
				(pn.hasItalianLeadingZero() ? '0' : '') + 
				pn.getNationalNumber();
		}
	} catch (e) {
	}
	return phone_number;
}