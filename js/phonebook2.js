/*
						<li class="media list-group-item">
							<a class="pull-left" href="#">
								<img class="media-object" src="/icons/icon96.jpg" alt="..."></a>
							<div class="media-body">
								<h4 class="media-heading">Alfonso Lluzar Lopez de Bri&ntilde;as de Santamaria</h4>
								<div class="row" style="padding-top: 10px;">
									<div class="col-xs-4"> 
										<i class="fa fa-building"></i>
										<a href="#">+34687787105</a>
										<br> <i class="fa fa-phone"></i>
										<a href="#">+34687787105</a>
										<br>
										<i class="fa fa-google"></i>
										<a href="#">+34687787105</a>
									</div>
									<div class="col-xs-4">
										<i class="fa fa-building"></i>
										<a href="#">+34687787105</a>
										<br>
										<i class="fa fa-phone"></i>
										<a href="#">+34687787105</a>
										<br>
										<i class="fa fa-google"></i>
										<a href="#">+34687787105</a>
									</div>
									<div class="col-xs-4">
										<i class="fa fa-building"></i>
										<a href="#">+34687787105</a>
										<br>
										<i class="fa fa-phone"></i>
										<a href="#">+34687787105</a>
										<br>
										<i class="fa fa-google"></i>
										<a href="#">+34687787105</a>
									</div>
								</div>
							</div>
						</li>
*/



$(function() {
	var contacts = chrome.extension.getBackgroundPage().contacts;
	var sorted_keys = Object.keys(contacts).sort();
	for (var i = 0; i < sorted_keys.length; i++) {
		var curr_contact = contacts[sorted_keys[i]];
		var li = $('<li>').addClass('media list-group-item');
		var a = $('<a>').addClass('pull-left').attr('href', '#');
		li.append(a);
		var avatar = $('<img>').addClass('media-object').attr('src', curr_contact['gravatar']);
		a.append(avatar);
		var body = $('<div>').addClass('media-body');
		li.append(body);
		var heading = $('<h4>').addClass('media-heading');
		heading.text(sorted_keys[i]);
		body.append(heading);
		console.log(avatar);
		$('#data').append(li);
	}
});