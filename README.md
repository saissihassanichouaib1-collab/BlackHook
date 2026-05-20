#### BlackHook 🪝

**Real-time Anti-Phishing Browser Extension**

---

###  Overview

Phishing attacks are becoming increasingly sophisticated. Modern attackers use techniques like fullscreen manipulation, lookalike domains, and fake login pages to steal user credentials without being detected.

**BlackHook** is a browser extension designed to detect and prevent these attacks in real time — running silently in the background to protect users without requiring technical knowledge.

---

###  Features

* 🛑 **Fullscreen Attack Detection**
  Detects and warns users before a website enters fullscreen mode to hide the browser UI.

* 🌐 **Lookalike Domain Detection**
  Identifies typosquatting and suspicious domains using similarity algorithms.

* 🔐 **Unencrypted Form Detection**
  Alerts users when sensitive data is entered on non-HTTPS (HTTP) pages.

* 📋 **Clipboard Protection**
  Detects and warns about suspicious clipboard modifications.

* 🧠 **Malicious Domain Scanning**
  Integrates with VirusTotal API to check URLs against 70+ security engines.

---

###  Tech Stack

* JavaScript (Browser Extension APIs)
* HTML / CSS
* VirusTotal API
* DOM Monitoring & Event Listeners

---

###  Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/blackhook.git
```

2. Open your browser (Chrome recommended)

3. Go to:

```
chrome://extensions/
```

4. Enable **Developer Mode**

5. Click **Load unpacked**

6. Select the project folder

---

###  How It Works

BlackHook continuously monitors:

* DOM changes
* Fullscreen API calls
* Clipboard events
* URL patterns

It applies detection logic and triggers alerts when suspicious behavior is identified.

### Project Goal

Make web security accessible to everyone — even non-technical users.
Security shouldn’t be a luxury.

---

###  Demo 
## 🚨 Phishing Detection Example

BlackHook detects a suspicious lookalike domain and immediately warns the user before any credentials are entered.

- Identifies domain similarity (typosquatting)
- Flags potential phishing behavior
- Prevents user interaction with the malicious page
<img width="1920" height="984" alt="image" src="https://github.com/user-attachments/assets/97de220c-a6c6-41ed-bac1-4ab3f6740f46" />

## ✅ Legitimate Website Example

BlackHook correctly allows access to a trusted website without triggering any alerts.

- No false positives on legitimate domains
- Seamless browsing experience
- Runs silently in the background
<img width="1896" height="982" alt="image" src="https://github.com/user-attachments/assets/8d7470a7-7338-4e47-9e0b-c15a5cbdf4fe" />





