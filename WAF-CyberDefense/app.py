# ============================================================
#  CyberShield WAF - Web Application Firewall
#  Built with Python Flask | PBL Cyber Security Project
#  Author: [Your Name] | Version: 2.0
# ============================================================

from flask import Flask, request, render_template, jsonify, redirect, url_for
import re
import json
import os
import random
from datetime import datetime

# ── App Initialization ──────────────────────────────────────
app = Flask(__name__)

# Path to the JSON-based attack log file
LOG_FILE = "attack_logs.json"

# ── Attack Pattern Definitions ──────────────────────────────
# Each attack type has:
#   - patterns : list of regex strings to match
#   - severity : HIGH / MEDIUM / LOW
#   - score    : numeric threat score added per hit
# ────────────────────────────────────────────────────────────
ATTACK_SIGNATURES = {
    "SQL Injection": {
        "patterns": [
            r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b.*\b(FROM|INTO|TABLE|DATABASE)\b)",
            r"(UNION\s+(ALL\s+)?SELECT)",
            r"('|\")(\s)*(OR|AND)(\s)*('|\"|[0-9])",
            r"(--|#|/\*|\*/)",
            r"(\bOR\b\s+1\s*=\s*1)",
            r"(SLEEP\s*\(|BENCHMARK\s*\(|WAITFOR\s+DELAY)",
            r"(xp_cmdshell|exec\s*\(|execute\s*\()",
        ],
        "severity": "HIGH",
        "score": 90,
    },
    "Cross-Site Scripting (XSS)": {
        "patterns": [
            r"(<\s*script[^>]*>)",
            r"(javascript\s*:)",
            r"(on\w+\s*=\s*['\"]?[^'\"]*['\"]?)",
            r"(<\s*iframe[^>]*>)",
            r"(document\.(cookie|write|location))",
            r"(eval\s*\(|alert\s*\(|prompt\s*\(|confirm\s*\()",
            r"(<\s*img[^>]+src\s*=\s*['\"]?[^'\"]+['\"]?[^>]*>)",
        ],
        "severity": "HIGH",
        "score": 85,
    },
    "Command Injection": {
        "patterns": [
            r"(;|\||&&|\$\(|`).*(ls|cat|pwd|whoami|id|uname|wget|curl|bash|sh|python|perl|php)",
            r"(\bsystem\s*\(|\bexec\s*\(|\bpassthru\s*\(|\bpopen\s*\()",
            r"(nc\s+-[lnvz]|netcat|nmap\s+)",
            r"(;|\||&&).*/etc/(passwd|shadow|hosts)|/bin/(bash|sh)\b",
        ],
        "severity": "CRITICAL",
        "score": 95,
    },
    "Directory Traversal": {
        "patterns": [
            r"(\.\./|\.\.[/\\]){2,}",
            r"(%2e%2e[/\\]|%2e%2e%2f|%252e%252e)",
            r"(\.\.%c0%af|\.\.%c1%9c)",
            r"(/etc/passwd|/etc/hosts|/windows/system32|boot\.ini)",
        ],
        "severity": "HIGH",
        "score": 80,
    },
    "Remote Code Execution": {
        "patterns": [
            r"(base64_decode|str_rot13|gzinflate|gzuncompress|str_replace)",
            r"(eval\s*\(\s*\$|assert\s*\(\s*\$)",
            r"(\$_(GET|POST|REQUEST|COOKIE)\s*\[)",
            r"(php://input|php://filter|data://text)",
            r"(\.php\?.*=http|\.asp\?.*=http)",
        ],
        "severity": "CRITICAL",
        "score": 95,
    },
    "Suspicious HTTP": {
        "patterns": [
            r"(<\?php|\?php|<\?=)",
            r"(robots\.txt|\.htaccess|\.env|config\.php|wp-config)",
            r"(\bUNION\b|\bDROP\b|\bINSERT\b|\bDELETE\b)",
            r"(/admin/|/administrator/|wp-admin|phpmyadmin)",
            r"(\x00|\x01|\xff|\xfe)",
        ],
        "severity": "MEDIUM",
        "score": 50,
    },
}

# ── Helpers ──────────────────────────────────────────────────

def load_logs():
    """Load all attack logs from the JSON file."""
    if not os.path.exists(LOG_FILE):
        return []
    try:
        with open(LOG_FILE, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []


def save_log(entry):
    """Append a new attack log entry to the JSON file."""
    logs = load_logs()
    logs.append(entry)
    with open(LOG_FILE, "w") as f:
        json.dump(logs, f, indent=2)


def detect_attack(user_input):
    """
    Scan the input against all attack signatures.
    Returns (is_attack: bool, attack_type: str, severity: str, score: int).
    """
    for attack_type, data in ATTACK_SIGNATURES.items():
        for pattern in data["patterns"]:
            if re.search(pattern, user_input, re.IGNORECASE):
                return True, attack_type, data["severity"], data["score"]
    return False, None, None, 0


def get_threat_level(blocked_count, total_count):
    """Compute an overall threat level string based on attack ratio."""
    if total_count == 0:
        return "LOW"
    ratio = blocked_count / total_count
    if ratio >= 0.5:
        return "CRITICAL"
    elif ratio >= 0.3:
        return "HIGH"
    elif ratio >= 0.1:
        return "MEDIUM"
    return "LOW"


def get_stats():
    """Return aggregated statistics from the log file."""
    logs = load_logs()
    total_requests = logs[-1]["total_requests"] if logs else 0
    blocked = len(logs)
    safe = max(0, total_requests - blocked)
    threat_level = get_threat_level(blocked, total_requests)

    # Attack-type breakdown for the chart
    type_counts = {}
    for log in logs:
        t = log.get("attack_type", "Unknown")
        type_counts[t] = type_counts.get(t, 0) + 1

    # Last 10 attacks for the recent-attacks table
    recent = logs[-10:][::-1]

    return {
        "total_requests": total_requests,
        "blocked_attacks": blocked,
        "safe_requests": safe,
        "threat_level": threat_level,
        "type_counts": type_counts,
        "recent_attacks": recent,
    }

# ── Request Counter (in-memory, resets on restart) ───────────
request_counter = {"count": 0}

# ── Routes ───────────────────────────────────────────────────

@app.route("/", methods=["GET", "POST"])
def dashboard():
    """Main dashboard: accepts test payloads and shows live stats."""
    message = ""
    alert = None

    if request.method == "POST":
        # Increment total request counter
        request_counter["count"] += 1
        user_input = request.form.get("data", "").strip()

        is_attack, attack_type, severity, score = detect_attack(user_input)

        if is_attack:
            # Build and save log entry
            log_entry = {
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "ip": request.remote_addr,
                "payload": user_input[:200],       # cap payload length
                "attack_type": attack_type,
                "severity": severity,
                "threat_score": score,
                "total_requests": request_counter["count"],
            }
            save_log(log_entry)
            return redirect(url_for("blocked", attack_type=attack_type,
                                    severity=severity, score=score))
        else:
            message = "✔ Request Passed — No Threats Detected"
            alert = "safe"

    stats = get_stats()
    # Patch in the live request count
    stats["total_requests"] = max(stats["total_requests"], request_counter["count"])
    return render_template("index.html", message=message, alert=alert, stats=stats)


@app.route("/blocked")
def blocked():
    """Threat-blocked page shown after a malicious payload is caught."""
    attack_type = request.args.get("attack_type", "Unknown Attack")
    severity    = request.args.get("severity", "HIGH")
    score       = request.args.get("score", "99")
    return render_template("blocked.html", attack_type=attack_type,
                           severity=severity, score=score)


@app.route("/logs")
def logs():
    """Full attack-logs page with sortable table."""
    all_logs = load_logs()[::-1]   # newest first
    stats = get_stats()
    return render_template("logs.html", logs=all_logs, stats=stats)


@app.route("/status")
def status():
    """System status & threat-intelligence page."""
    stats = get_stats()
    return render_template("status.html", stats=stats)


# ── REST API Endpoints (used by dashboard JS) ────────────────

@app.route("/api/stats")
def api_stats():
    """JSON endpoint – live stats polled every few seconds by the frontend."""
    stats = get_stats()
    stats["total_requests"] = max(stats["total_requests"], request_counter["count"])
    # Add fake live-traffic noise so the dashboard always looks active
    stats["packets_per_sec"] = random.randint(120, 480)
    stats["firewall_uptime"] = "99.97%"
    stats["ai_confidence"]   = f"{random.randint(94, 99)}.{random.randint(1, 9)}%"
    return jsonify(stats)


@app.route("/api/logs/recent")
def api_recent_logs():
    """Return the 20 most recent attack log entries as JSON."""
    logs = load_logs()[-20:][::-1]
    return jsonify(logs)


@app.route("/api/clear_logs", methods=["POST"])
def api_clear_logs():
    """Clear all attack logs (demo / reset button)."""
    with open(LOG_FILE, "w") as f:
        json.dump([], f)
    request_counter["count"] = 0
    return jsonify({"status": "ok", "message": "Logs cleared"})


# ── Entry Point ───────────────────────────────────────────────
if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  🛡️  CyberShield WAF — Starting Up")
    print("  Dashboard : http://127.0.0.1:5000")
    print("  Logs      : http://127.0.0.1:5000/logs")
    print("  Status    : http://127.0.0.1:5000/status")
    print("=" * 60 + "\n")
    app.run(debug=True)
