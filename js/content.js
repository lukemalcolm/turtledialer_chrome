document.addEventListener('selectionchange', function(e) {
  var selection = window.getSelection().toString();
  if (selection && selection.length > 0) {
    chrome.extension.sendRequest({
      'action': 'select',
      'selection': selection
    });
  } else {
    chrome.extension.sendRequest({
      'action': 'unselect',
      'selection': selection
    });
  }
});
