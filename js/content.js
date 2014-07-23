var enabled = false;


function text_selected(event) {
  console.log('inside text_selected');
  if (!enabled) {
    enabled = true;
    document.body.addEventListener(
      'mouseup', 
      function() {
      var text_selected = window.getSelection().toString();
      chrome.extension.sendRequest({ 'text_selected': text_selected });
    });
  }
}
document.body.addEventListener('selectstart', text_selected);