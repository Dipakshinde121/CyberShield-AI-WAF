# 🛡️ CyberShield WAF — Web Application Firewall

> **AI-Powered Web Application Firewall Dashboard**  
> A professional cyber security project built with Python Flask  
> *College PBL Project | GitHub Portfolio | SOC Dashboard*

---

## 📌 Project Overview

**CyberShield WAF** is a real-time Web Application Firewall (WAF) that monitors, detects, and blocks malicious HTTP requests. The project features an enterprise-grade cybersecurity dashboard inspired by real-world Security Operations Centers (SOCs).

### 🔐 What It Does
- Inspects incoming web requests for **6 attack categories**
- Blocks and logs all detected threats with **severity scoring**
- Displays a live **SOC-style dashboard** with animated charts
- Provides a **forensic attack log** with filtering capabilities
- Shows **system health status** and module uptime

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🤖 AI Threat Engine | Pattern-matching detection across 6 attack categories |
| 🚫 Attack Blocking | Instant block with detailed threat breakdown |
| 📊 Live Dashboard | Real-time stats: requests, blocks, threat level |
| 📋 Attack Logs | Full forensic log with filter by type/severity |
| ⚙️ System Status | Module health, OWASP coverage, packet monitoring |
| 🎨 Cyber UI | Dark neon theme, matrix rain, glassmorphism cards |

---

## 🛡️ Attack Detection Coverage

| Attack Type | Severity | Examples |
|---|---|---|
| SQL Injection | HIGH | `' OR 1=1 --`, `UNION SELECT` |
| Cross-Site Scripting (XSS) | HIGH | `<script>alert(1)</script>` |
| Command Injection | CRITICAL | `; cat /etc/passwd` |
| Directory Traversal | HIGH | `../../etc/shadow` |
| Remote Code Execution | CRITICAL | `base64_decode(...)` |
| Suspicious HTTP | MEDIUM | Config file probing, PHP shells |

---

## 📁 Project Structure

```
WAF-CyberDefense/
├── app.py                  # Flask backend — routes, detection, logging
├── requirements.txt        # Python dependencies (only Flask needed)
├── attack_logs.json        # JSON-based attack log database
├── README.md
│
├── templates/
│   ├── base.html           # Shared layout: navbar, matrix bg, footer
│   ├── index.html          # 🏠 Main dashboard
│   ├── blocked.html        # 🚨 Threat blocked page
│   ├── logs.html           # 📋 Full attack logs table
│   └── status.html         # ⚙️  System status & OWASP coverage
│
└── static/
    ├── css/
    │   └── style.css       # Cyberpunk dark theme, all styling
    └── js/
        └── dashboard.js    # Matrix rain, clock, charts, live polling
```

---

## ⚡ Quick Start (VS Code / Terminal)

### 1. Install Python dependencies
```bash
pip install flask
# or
pip install -r requirements.txt
```

### 2. Run the application
```bash
python app.py
```

### 3. Open in browser
```
http://127.0.0.1:5000           ← Main Dashboard
http://127.0.0.1:5000/logs      ← Attack Logs
http://127.0.0.1:5000/status    ← System Status
```

---

## 🧪 Test Payloads

Try these in the **Request Analyzer** on the dashboard:

```sql
-- SQL Injection
' OR 1=1 --
UNION SELECT * FROM users

-- XSS
<script>alert('XSS')</script>

-- Command Injection
; cat /etc/passwd

-- Directory Traversal
../../etc/shadow

-- Safe Request
Hello World
```

---

## 🛠️ Tech Stack

- **Backend:** Python 3, Flask
- **Frontend:** HTML5, CSS3 (custom variables, glassmorphism), Vanilla JS
- **Charts:** Chart.js v4
- **Fonts:** Orbitron · Rajdhani · Share Tech Mono (Google Fonts)
- **Storage:** JSON flat-file log database
- **Design:** SOC dashboard, cyberpunk neon theme

---

## 🎓 Academic Context

This project demonstrates understanding of:
- **OWASP Top 10** web application vulnerabilities
- **Regex-based signature detection** (core WAF technique)
- **Threat scoring and severity classification**
- **Forensic logging** for incident response
- **RESTful API design** with Flask
- **Frontend data visualization** with Chart.js

---

## 👤 Author

**[Your Name]** — Computer Science / Cybersecurity  
*College PBL Project — [Year]*

---

*CyberShield WAF is a student project for educational purposes.*
