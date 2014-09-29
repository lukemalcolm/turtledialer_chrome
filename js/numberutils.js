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
function NumberUtils(country) {
	this.country = country;
	this.number_utils = i18n.phonenumbers.PhoneNumberUtil.getInstance();
}


// number management
NumberUtils.prototype.formatPhoneNumber = function(phone_number) {
	var formatted = this.parsePhoneNumber(phone_number);
	return formatted != null ? formatted : phone_number;
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

NumberUtils.prototype.parsePhoneNumber = function(phone_number) {
	try {
		var pn = this.number_utils.parse(phone_number, this.country);
		if (this.number_utils.isValidNumber(pn)) {
			phone_number = this.number_utils.format(
				pn,
				i18n.phonenumbers.PhoneNumberFormat.E164
			);
		} else {
			return null;
		}
	} catch(e) {
		return null;
	}
	return phone_number;
}
