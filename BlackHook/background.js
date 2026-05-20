let latestThreats = {};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'THREATS_UPDATE') {
    latestThreats = message;
  }
  
  if (message.type === 'GET_THREATS') {
    sendResponse(latestThreats);
    return true;
  }
});