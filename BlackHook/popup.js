function updateBadge(badgeId, iconId, isThreat) {
  const badge = document.getElementById(badgeId);
  const icon = document.getElementById(iconId);
  if (!badge || !icon) return;

  if (isThreat) {
    badge.textContent = 'THREAT';
    badge.className = 'threat-badge danger';
    icon.className = 'threat-icon danger';
  } else {
    badge.textContent = 'CLEAR';
    badge.className = 'threat-badge safe';
    icon.className = 'threat-icon safe';
  }
}

function updateScore(score) {
  const scoreNum = document.getElementById('scoreNum');
  const scoreStatus = document.getElementById('scoreStatus');
  const circle = document.getElementById('scoreCircle');

  scoreNum.textContent = score;

  const circumference = 188;
  const offset = circumference - (score / 100) * circumference;
  circle.style.strokeDashoffset = offset;

  if (score <= 20) {
    circle.style.stroke = '#00ff88';
    scoreStatus.style.color = '#00ff88';
    scoreStatus.textContent = 'SAFE';
  } else if (score <= 50) {
    circle.style.stroke = '#ffaa00';
    scoreStatus.style.color = '#ffaa00';
    scoreStatus.textContent = 'SUSPICIOUS';
  } else {
    circle.style.stroke = '#ff4444';
    scoreStatus.style.color = '#ff4444';
    scoreStatus.textContent = 'DANGER';
  }
}

function updateUI(data) {
  if (!data || !data.threats) return;

  document.getElementById('currentUrl').textContent = data.url || 'unknown';
  updateBadge('fullscreenBadge', 'fullscreenIcon', data.threats.fullscreen);
  updateBadge('urlBadge', 'urlIcon', data.threats.url);
  updateBadge('formBadge', 'formIcon', data.threats.form);
  updateBadge('httpBadge', 'httpIcon', data.threats.http);
  updateBadge('clipBadge', 'clipIcon', data.threats.clipboard);
  updateScore(data.score || 0);

  const threatCount = Object.values(data.threats).filter(Boolean).length;
  document.getElementById('threatCount').textContent = threatCount;
}

// Step 1 — only load stored data if it's from the SAME site
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]) return;
  const currentHost = new URL(tabs[0].url).hostname;

  chrome.storage.local.get('blackhook_data', (result) => {
    if (result.blackhook_data && result.blackhook_data.url === currentHost) {
      updateUI(result.blackhook_data);
    }
  });
});

// Step 2 — run fresh scan but keep fullscreen and clipboard from storage
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]) return;

  const tab = tabs[0];

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
  return {
    http: window.location.protocol === 'http:',
    url: false,
    form: document.querySelectorAll('input[type="password"]').length > 0
          && window.location.protocol === 'http:',
    hostname: window.location.hostname
  };
}
  }, (results) => {
    if (!results || !results[0] || !results[0].result) return;

    const fresh = results[0].result;

    chrome.storage.local.get('blackhook_data', (stored) => {
      const previous = stored.blackhook_data || {};
      const prevThreats = previous.threats || {};

      const threats = {
        fullscreen: previous.url === fresh.hostname ? (prevThreats.fullscreen || false) : false,
        clipboard: prevThreats.clipboard || false,
        url: fresh.url,
        form: fresh.form,
        http: fresh.http
      };

      let score = 0;
      if (threats.fullscreen) score += 40;
      if (threats.url) score += 25;
      if (threats.form) score += 20;
      if (threats.http) score += 10;
      if (threats.clipboard) score += 30;

      updateUI({
        threats,
        score: Math.min(score, 100),
        url: fresh.hostname
      });
    });
  });
});