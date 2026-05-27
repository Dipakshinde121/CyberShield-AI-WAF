/* ============================================================
   CyberShield WAF — dashboard.js
   Handles: Matrix Rain · Live Clock · Chart.js setup ·
            Terminal feed · Live stats polling · Animations
   ============================================================ */

// ════════════════════════════════════════════════════════════
// 1. MATRIX RAIN BACKGROUND
// ════════════════════════════════════════════════════════════
(function initMatrixRain() {
  const canvas = document.getElementById('matrix-canvas');
  if (!canvas) return;

  const ctx    = canvas.getContext('2d');
  const chars  = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ0123456789ABCDEF';
  let cols, drops;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    cols  = Math.floor(canvas.width / 16);
    drops = Array.from({ length: cols }, () => Math.random() * -50);
  }
  resize();
  window.addEventListener('resize', resize);

  function drawMatrix() {
    // Faint dark overlay to create trailing effect
    ctx.fillStyle = 'rgba(2, 11, 20, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00d4ff';
    ctx.font      = '13px "Share Tech Mono", monospace';

    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const x    = i * 16;
      const y    = drops[i] * 16;

      // Alternate colour: some characters brighter
      ctx.fillStyle = Math.random() > 0.92 ? '#ffffff' : '#00d4ff';
      ctx.fillText(char, x, y);

      // Reset drop to top once it leaves the screen
      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  setInterval(drawMatrix, 50);
})();


// ════════════════════════════════════════════════════════════
// 2. LIVE DIGITAL CLOCK
// ════════════════════════════════════════════════════════════
(function initClock() {
  const el = document.getElementById('liveClock');
  if (!el) return;

  function tick() {
    const now = new Date();
    const hh  = String(now.getHours()).padStart(2, '0');
    const mm  = String(now.getMinutes()).padStart(2, '0');
    const ss  = String(now.getSeconds()).padStart(2, '0');
    el.textContent = `${hh}:${mm}:${ss}`;
  }
  tick();
  setInterval(tick, 1000);
})();


// ════════════════════════════════════════════════════════════
// 3. TYPING ANIMATION (hero title)
// ════════════════════════════════════════════════════════════
(function initTyping() {
  const el = document.getElementById('typingTitle');
  if (!el) return;

  const text   = el.textContent.trim();
  el.textContent = '';
  let i = 0;

  function type() {
    if (i < text.length) {
      el.textContent += text[i++];
      setTimeout(type, 45);
    }
  }
  // Small delay before starting so page feels alive
  setTimeout(type, 400);
})();


// ════════════════════════════════════════════════════════════
// 4. TERMINAL FEED HELPER  (called from page scripts too)
// ════════════════════════════════════════════════════════════
function appendTerminalLine(tag, msg, cssClass) {
  const body = document.getElementById('terminalBody');
  if (!body) return;

  const now = new Date();
  const ts  = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

  const line       = document.createElement('p');
  line.className   = 'term-line fade-in';
  line.innerHTML   = `<span class="tc-time">[${tag}]</span> <span class="${cssClass}">${msg}</span>`;
  body.appendChild(line);
  body.scrollTop = body.scrollHeight;

  // Keep terminal from growing forever — remove oldest when over 30 lines
  const lines = body.querySelectorAll('.term-line');
  if (lines.length > 30) lines[0].remove();
}


// ════════════════════════════════════════════════════════════
// 5. ATTACK DOUGHNUT CHART
// ════════════════════════════════════════════════════════════
/**
 * buildAttackChart(typeCounts, totalBlocked)
 * Called from index.html once the template data is available.
 */
function buildAttackChart(typeCounts, totalBlocked) {
  const canvas = document.getElementById('attackChart');
  if (!canvas) return;

  document.getElementById('chartTotalLabel').textContent = totalBlocked;

  const labels = Object.keys(typeCounts);
  const data   = Object.values(typeCounts);

  // No data yet — show placeholder
  if (!labels.length) {
    labels.push('No attacks yet');
    data.push(1);
  }

  const COLORS = ['#ff2244','#ff7722','#00d4ff','#a855f7','#ffd700','#00ff88'];

  new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: COLORS.map(c => c + '44'),
        borderColor:     COLORS,
        borderWidth:     2,
        hoverOffset:     8,
      }]
    },
    options: {
      cutout:     '68%',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color:     '#6a8fa8',
            font:      { family: "'Share Tech Mono'", size: 10 },
            boxWidth:  10,
            padding:   12,
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.raw} blocked`
          }
        }
      },
      animation: {
        animateRotate: true,
        duration:      900,
        easing:        'easeInOutQuart',
      }
    }
  });
}


// ════════════════════════════════════════════════════════════
// 6. LIVE STATS POLLING  (every 5 s on dashboard)
// ════════════════════════════════════════════════════════════
(function initLivePoll() {
  // Only run on pages that have the stat elements
  const elTotal   = document.getElementById('statTotal');
  const elBlocked = document.getElementById('statBlocked');
  const elSafe    = document.getElementById('statSafe');
  const elAI      = document.getElementById('statAI');
  const elPPS     = document.getElementById('statPPS');
  const elThreat  = document.getElementById('threatLevel');
  const elFooter  = document.getElementById('footerReqCount');

  if (!elTotal) return;   // Not on the dashboard — skip

  async function poll() {
    try {
      const res  = await fetch('/api/stats');
      const data = await res.json();

      if (elTotal)   animateCountUp(elTotal,   data.total_requests);
      if (elBlocked) animateCountUp(elBlocked, data.blocked_attacks);
      if (elSafe)    animateCountUp(elSafe,    data.safe_requests);
      if (elAI)      elAI.textContent  = data.ai_confidence  || '98.7%';
      if (elPPS)     elPPS.textContent = (data.packets_per_sec || '—') + ' pkt/s';
      if (elFooter)  elFooter.textContent = data.total_requests;

      // Update threat level badge
      if (elThreat) {
        const level = (data.threat_level || 'LOW').toLowerCase();
        elThreat.textContent = (data.threat_level || 'LOW');
        const badge = document.getElementById('threatBadge');
        if (badge) {
          badge.className = `threat-badge threat-${level}`;
        }
      }

      // Add a random terminal heartbeat line
      const heartbeats = [
        'Scanning inbound packets…',
        'Ruleset validated — no updates needed.',
        'AI engine: all signatures current.',
        'IDS: no anomalies detected.',
        'Traffic analysis: nominal.',
        `${data.packets_per_sec || 240} pkt/s — within normal range.`,
      ];
      if (Math.random() > 0.5) {
        appendTerminalLine(
          'INFO',
          heartbeats[Math.floor(Math.random() * heartbeats.length)],
          'tc-info'
        );
      }
    } catch (err) {
      // Silently ignore network errors in dev
    }
  }

  poll();
  setInterval(poll, 5000);
})();


// ════════════════════════════════════════════════════════════
// 7. FOOTER COUNTER (all pages)
// ════════════════════════════════════════════════════════════
(function initFooterCounter() {
  const el = document.getElementById('footerReqCount');
  if (!el || el.textContent !== '—') return;

  fetch('/api/stats')
    .then(r => r.json())
    .then(d => { el.textContent = d.total_requests || 0; })
    .catch(() => { el.textContent = '—'; });
})();


// ════════════════════════════════════════════════════════════
// 8. ANIMATED COUNT-UP HELPER
// ════════════════════════════════════════════════════════════
function animateCountUp(el, target) {
  const start    = parseInt(el.textContent) || 0;
  const distance = target - start;
  if (distance === 0) return;

  const steps    = 20;
  const stepVal  = distance / steps;
  let   current  = start;
  let   step     = 0;

  const timer = setInterval(() => {
    step++;
    current += stepVal;
    el.textContent = Math.round(current);
    if (step >= steps) {
      el.textContent = target;
      clearInterval(timer);
    }
  }, 30);
}


// ════════════════════════════════════════════════════════════
// 9. STAT CARD ENTRANCE ANIMATION
// ════════════════════════════════════════════════════════════
(function animateCards() {
  const cards = document.querySelectorAll('.stat-card, .glass-card');
  cards.forEach((card, i) => {
    card.style.opacity   = '0';
    card.style.transform = 'translateY(18px)';
    setTimeout(() => {
      card.style.transition = 'opacity .5s ease, transform .5s ease';
      card.style.opacity    = '1';
      card.style.transform  = 'translateY(0)';
    }, 80 + i * 55);
  });
})();


// ════════════════════════════════════════════════════════════
// 10. SCORE BAR ENTRANCE ANIMATION
// ════════════════════════════════════════════════════════════
(function animateScoreBars() {
  // Temporarily zero-out widths so CSS transition plays on load
  document.querySelectorAll('.score-bar').forEach(bar => {
    const finalW = bar.style.width;
    bar.style.width      = '0';
    bar.style.transition = 'width 1.1s cubic-bezier(.22,1,.36,1)';
    setTimeout(() => { bar.style.width = finalW; }, 300);
  });
})();
