const VT_API_KEY = 'YOUR_VIRUSTOTAL_API_KEY_HERE';

const threats = {
  fullscreen: false,
  url: false,
  form: false,
  http: false,
  clipboard: false
};

// Clear fullscreen from previous page immediately
chrome.storage.local.get('blackhook_data', (result) => {
  const data = result.blackhook_data || {};
  const prevThreats = data.threats || {};
  prevThreats.fullscreen = false;
  data.threats = prevThreats;
  chrome.storage.local.set({ blackhook_data: data });
});

// RED warning — shows after user allows fullscreen on suspicious site
function showFullscreenWarning() {
  if (document.getElementById('bh-warning')) return;

  const style = document.createElement('style');
  style.textContent = `@keyframes bh-pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }`;
  document.head.appendChild(style);

  const warning = document.createElement('div');
  warning.id = 'bh-warning';
  warning.style.cssText = `
    position:fixed; top:0; left:0; width:100%; z-index:2147483647;
    background:linear-gradient(135deg,#1a0000,#0d0000);
    border-bottom:2px solid #ff3333; padding:16px 24px;
    display:flex; align-items:center; justify-content:space-between;
    font-family:monospace; box-shadow:0 0 40px rgba(255,0,0,0.4);
  `;
  warning.innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;">
      <div style="font-size:28px;animation:bh-pulse 0.8s infinite;">⚠️</div>
      <div>
        <div style="color:#ff3333;font-size:14px;letter-spacing:3px;font-weight:bold;text-shadow:0 0 10px #ff3333;">
          BLACKHOOK — FULLSCREEN PHISHING DETECTED
        </div>
        <div style="color:#ff9999;font-size:11px;margin-top:4px;letter-spacing:1px;">
          This site forced fullscreen to hide the real URL bar. Press ESC to exit safely.
        </div>
      </div>
    </div>
    <button id="bh-dismiss" style="background:#ff3333;color:white;border:none;padding:8px 16px;
      border-radius:6px;font-family:monospace;font-size:11px;letter-spacing:1px;cursor:pointer;">
      DISMISS
    </button>
  `;
  document.body.appendChild(warning);
  document.getElementById('bh-dismiss').addEventListener('click', () => warning.remove());
}

// CONFIRM dialog — intercepts fullscreen and asks user
let fullscreenRequested = false;

function showFullscreenConfirm() {
  if (document.getElementById('bh-confirm')) return;

  const isSuspicious = threats.http || threats.url;

  const confirmDiv = document.createElement('div');
  confirmDiv.id = 'bh-confirm';
  confirmDiv.style.cssText = `
    position:fixed; top:0; left:0; width:100%; z-index:2147483647;
    background:${isSuspicious ? '#1a0000' : '#0d0d1a'};
    border-bottom:2px solid ${isSuspicious ? '#ff3333' : '#9b30ff'};
    padding:16px 24px; display:flex; align-items:center;
    justify-content:space-between; font-family:monospace;
    box-shadow:0 0 40px ${isSuspicious ? 'rgba(255,0,0,0.4)' : 'rgba(155,48,255,0.3)'};
  `;
  confirmDiv.innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;">
      <div style="font-size:28px;">${isSuspicious ? '⚠️' : '🛡️'}</div>
      <div>
        <div style="color:${isSuspicious ? '#ff3333' : '#9b30ff'};font-size:14px;letter-spacing:3px;font-weight:bold;">
          ${isSuspicious ? 'BLACKHOOK — SUSPICIOUS SITE DETECTED' : 'BLACKHOOK — FULLSCREEN REQUESTED'}
        </div>
        <div style="color:${isSuspicious ? '#ff9999' : '#c0a0e0'};font-size:11px;margin-top:4px;letter-spacing:1px;">
          ${isSuspicious
            ? 'This site is suspicious and requesting fullscreen. Are you sure?'
            : 'This site is requesting fullscreen. Are you sure?'}
        </div>
      </div>
    </div>
    <div style="display:flex;gap:8px;">
      <button id="bh-confirm-no" style="background:transparent;color:#888;border:1px solid #333;
        padding:8px 16px;border-radius:6px;font-family:monospace;font-size:11px;cursor:pointer;">
        CANCEL
      </button>
      <button id="bh-confirm-yes" style="background:${isSuspicious ? '#ff3333' : '#9b30ff'};
        color:white;border:none;padding:8px 16px;border-radius:6px;
        font-family:monospace;font-size:11px;cursor:pointer;">
        ALLOW
      </button>
    </div>
  `;
  document.body.appendChild(confirmDiv);

  document.getElementById('bh-confirm-no').addEventListener('click', () => {
    confirmDiv.remove();
  });

  document.getElementById('bh-confirm-yes').addEventListener('click', () => {
    confirmDiv.remove();
    fullscreenRequested = true;
    document.documentElement.requestFullscreen();
    if (isSuspicious) {
      threats.fullscreen = true;
      saveAndSend();
      setTimeout(() => showFullscreenWarning(), 500);
    }
  });
}

// Fullscreen detection
document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) {
    if (fullscreenRequested) {
      fullscreenRequested = false;
      return;
    }
    document.exitFullscreen();
    showFullscreenConfirm();
  }
});

// URL check — basic patterns
function checkURL() {
  const parts = window.location.hostname.split('.');
  const rootDomain = parts.slice(-2).join('.');

  const suspicious = [
  /-secure|-login|-verify|-account|-update/i,
  /paypa1|facebok|amaz0n|micr0s0ft/i
];
  threats.url = suspicious.some(p => p.test(rootDomain));
}

// Levenshtein distance
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[a.length][b.length];
}

function checkLevenshtein() {
  const hostname = window.location.hostname.replace('www.', '');
  const topSites = [
    'google.com', 'facebook.com', 'amazon.com', 'paypal.com',
    'microsoft.com', 'apple.com', 'netflix.com', 'instagram.com',
    'twitter.com', 'linkedin.com', 'bankofamerica.com', 'wellsfargo.com'
  ];
  for (const site of topSites) {
    const distance = levenshtein(hostname, site);
    if (distance > 0 && distance <= 2) {
      threats.url = true;
      return;
    }
  }
}

// Entropy analysis
function checkEntropy() {
  const parts = window.location.hostname.split('.');
  const domain = parts.slice(-2, -1)[0]; // just "google" not "google.com"
  
  if (domain.length < 8) return; // short domains are never random
  
  const freq = {};
  for (const c of domain) freq[c] = (freq[c] || 0) + 1;
  const entropy = Object.values(freq).reduce((sum, count) => {
    const p = count / domain.length;
    return sum - p * Math.log2(p);
  }, 0);
  if (entropy > 3.5) {
    threats.url = true;
  }
}
// HTTP check
function checkHTTP() {
  threats.http = window.location.protocol === 'http:';
}

// Form check
function checkForms() {
  const inputs = document.querySelectorAll('input[type="password"]');
  threats.form = inputs.length > 0 && threats.http;
}

// Clipboard hijack
document.addEventListener('copy', () => {
  const original = window.getSelection().toString();
  setTimeout(() => {
    navigator.clipboard.readText().then(clip => {
      if (clip !== original && clip.length > 0) {
        threats.clipboard = true;
        saveAndSend();
      }
    }).catch(() => {});
  }, 100);
});

// VirusTotal check
async function checkVirusTotal(hostname) {
  try {
    const response = await fetch(`https://www.virustotal.com/api/v3/domains/${hostname}`, {
      headers: { 'x-apikey': VT_API_KEY }
    });
    const data = await response.json();
    const stats = data?.data?.attributes?.last_analysis_stats;
    if (!stats) return;
    if ((stats.malicious || 0) > 3 || (stats.suspicious || 0) > 5) {
      threats.url = true;
      saveAndSend();
    }
  } catch (e) {
    console.log('VT check failed:', e);
  }
}

function calculateScore() {
  let score = 0;
  if (threats.fullscreen) score += 40;
  if (threats.url) score += 25;
  if (threats.form) score += 20;
  if (threats.http) score += 10;
  if (threats.clipboard) score += 30;
  return Math.min(score, 100);
}

function saveAndSend() {
  const data = {
    threats,
    score: calculateScore(),
    url: window.location.hostname
  };
  chrome.storage.local.set({ blackhook_data: data });
  chrome.runtime.sendMessage({ type: 'THREATS_UPDATE', ...data });
}

// Run all checks on load
checkURL();
checkLevenshtein();
checkEntropy();
checkHTTP();
checkForms();
saveAndSend();
checkVirusTotal(window.location.hostname);

window.addEventListener('load', () => {
  checkForms();
  saveAndSend();
});