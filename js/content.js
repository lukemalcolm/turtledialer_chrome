var enabled = false;


function text_selected(event) {
  console.log('inside text_selected');
  if (!enabled) {
    enabled = true;
    var handler = function() {
        var text_selected = window.getSelection().toString();
        chrome.extension.sendRequest({ 'text_selected': text_selected });
    };
    document.body.addEventListener('mouseup', handler);
    document.body.addEventListener('dblclick', handler);
  }
}
document.body.addEventListener('selectstart', text_selected);