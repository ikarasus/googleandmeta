/* ==========================================================================
   Digital Ads ROI Calculator — calculator.js
   ========================================================================== */

'use strict';

/* ── State ──────────────────────────────────────────────────────────────── */
let activeTab = 'google';
let chartInstance = null;

/* ── Formatters ─────────────────────────────────────────────────────────── */

/**
 * Format a number as compact IDR (e.g. "Rp 2,5 jt", "Rp 100 rb", "Rp 5 T")
 */
function formatIDR(n) {
  const r = Math.round(n);
  const a = Math.abs(r);
  const s = r < 0 ? '-' : '';

  if (a >= 1e12) return s + 'Rp\u00a0' + (a / 1e12).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '\u00a0T';
  if (a >= 1e9)  return s + 'Rp\u00a0' + (a / 1e9).toLocaleString('id-ID',  { maximumFractionDigits: 1 }) + '\u00a0M';
  if (a >= 1e6)  return s + 'Rp\u00a0' + (a / 1e6).toLocaleString('id-ID',  { maximumFractionDigits: 1 }) + '\u00a0jt';
  if (a >= 1e3)  return s + 'Rp\u00a0' + (a / 1e3).toLocaleString('id-ID',  { maximumFractionDigits: 0 }) + '\u00a0rb';
  return s + 'Rp\u00a0' + a.toLocaleString('id-ID');
}

/**
 * Format a number as full IDR for chart tooltips (e.g. "Rp 25.000.000")
 */
function formatIDRFull(n) {
  const r = Math.round(n);
  const a = Math.abs(r);
  const s = r < 0 ? '-' : '';
  return s + 'Rp\u00a0' + a.toLocaleString('id-ID');
}

/**
 * Format a plain integer with Indonesian thousand-separators
 */
function formatNum(n) {
  return Math.round(n).toLocaleString('id-ID');
}

/**
 * Format a decimal percentage (e.g. 5.0 → "5,0%")
 */
function formatPct(n, decimals = 1) {
  return n.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + '%';
}

/* ── Slider fill ──────────────────────────────────────────────────────────── */

/**
 * Update the CSS gradient on a range input to show filled progress
 */
function updateSliderFill(input) {
  const min = parseFloat(input.min);
  const max = parseFloat(input.max);
  const val = parseFloat(input.value);
  const pct = ((val - min) / (max - min)) * 100;
  input.style.background = `linear-gradient(to right, #111110 0%, #111110 ${pct}%, #E6E6E0 ${pct}%, #E6E6E0 100%)`;
}

/**
 * Update all slider fills
 */
function refreshSliderFills() {
  document.querySelectorAll('input[type="range"]').forEach(updateSliderFill);
}

/* ── Tab switching ────────────────────────────────────────────────────────── */

function switchTab(tab) {
  activeTab = tab;

  const gBtn = document.getElementById('tab-google');
  const mBtn = document.getElementById('tab-meta');

  if (tab === 'google') {
    gBtn.classList.add('tab--active');
    gBtn.setAttribute('aria-selected', 'true');
    mBtn.classList.remove('tab--active');
    mBtn.setAttribute('aria-selected', 'false');

    // Update labels
    document.getElementById('lbl-cpc').textContent  = 'Avg. cost per click (Google Search)';
    document.getElementById('lbl-conv').textContent = 'Visitor-to-lead conversion rate';
    document.getElementById('lbl-visits').textContent = 'Visits';

    // Reset CPC slider
    const cpcSlider = document.getElementById('s-cpc');
    cpcSlider.min   = 500;
    cpcSlider.max   = 100000;
    cpcSlider.step  = 500;
    cpcSlider.value = 5000;

    // Reset conversion / close defaults
    document.getElementById('s-conv').value  = 5;
    document.getElementById('s-close').value = 25;

  } else {
    mBtn.classList.add('tab--active');
    mBtn.setAttribute('aria-selected', 'true');
    gBtn.classList.remove('tab--active');
    gBtn.setAttribute('aria-selected', 'false');

    // Update labels
    document.getElementById('lbl-cpc').textContent  = 'Avg. cost per click (Facebook/Instagram)';
    document.getElementById('lbl-conv').textContent = 'Ad click-to-lead conversion rate';
    document.getElementById('lbl-visits').textContent = 'Clicks';

    // Reset CPC slider
    const cpcSlider = document.getElementById('s-cpc');
    cpcSlider.min   = 500;
    cpcSlider.max   = 100000;
    cpcSlider.step  = 500;
    cpcSlider.value = 2500;

    // Reset conversion / close defaults
    document.getElementById('s-conv').value  = 3;
    document.getElementById('s-close').value = 20;
  }

  calc();
}

/* ── Core calculation engine ──────────────────────────────────────────────── */

function calc() {
  /* Read slider values */
  const cpc    = +document.getElementById('s-cpc').value;
  const budget = +document.getElementById('s-budget').value;
  const conv   = +document.getElementById('s-conv').value;
  const close  = +document.getElementById('s-close').value;
  const ltv    = +document.getElementById('s-ltv').value;
  const margin = +document.getElementById('s-margin').value;

  /* Display slider current values */
  document.getElementById('val-cpc').textContent    = formatIDR(cpc);
  document.getElementById('val-budget').textContent = formatIDR(budget);
  document.getElementById('val-conv').textContent   = formatPct(conv);
  document.getElementById('val-close').textContent  = close + '%';
  document.getElementById('val-ltv').textContent    = formatIDR(ltv);
  document.getElementById('val-margin').textContent = margin + '%';

  /* Update progress fills */
  refreshSliderFills();

  /* ── Formulas ── */
  const visits  = cpc > 0 ? budget / cpc : 0;
  const leads   = visits * (conv / 100);
  const cpl     = leads > 0 ? budget / leads : 0;
  const sales   = leads * (close / 100);
  const revenue = sales * ltv;
  const profit  = revenue * (margin / 100) - budget;
  const roi     = budget > 0 ? ((revenue - budget) / budget) * 100 : 0;
  const roas    = budget > 0 ? revenue / budget : 0;

  /* ── Update result cards ── */
  document.getElementById('r-visits').textContent  = formatNum(visits);
  document.getElementById('r-leads').textContent   = formatNum(leads);
  document.getElementById('r-cpl').textContent     = formatIDR(cpl);
  document.getElementById('r-sales').textContent   = formatNum(sales);
  document.getElementById('r-revenue').textContent = formatIDR(revenue);
  document.getElementById('r-profit').textContent  = formatIDR(profit);

  /* ── ROI display ── */
  const roiEl = document.getElementById('r-roi');
  roiEl.textContent = formatNum(Math.round(roi)) + '%';

  if (roi >= 100) {
    roiEl.style.color = '#22C55E';
  } else if (roi >= 0) {
    roiEl.style.color = '#F59E0B';
  } else {
    roiEl.style.color = '#EF4444';
  }

  document.getElementById('r-roas').textContent =
    'ROAS\u00a0' + roas.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '×';

  /* ── Assessment & chart ── */
  updateAssessment(roi);
  updateChart(budget, revenue, profit);
}

/* ── Assessment block ────────────────────────────────────────────────────── */

function updateAssessment(roi) {
  const box   = document.getElementById('assessment');
  const icon  = document.getElementById('assessment-icon');
  const title = document.getElementById('a-title');
  const body  = document.getElementById('a-body');

  const platform = activeTab === 'google'
    ? 'Google Ads'
    : 'Meta Ads (Facebook/Instagram)';

  const r = Math.round(roi);

  /* Reset classes */
  box.className = 'assessment';

  if (roi >= 300) {
    box.classList.add('assessment--success');
    icon.innerHTML = successIcon();
    title.textContent = 'Highly profitable: ' + formatNum(r) + '% ROI';
    body.textContent  =
      'Your ' + platform + ' campaign is generating exceptional returns. ' +
      'For every Rp\u00a01 spent, you get back Rp\u00a0' +
      (roi / 100 + 1).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) +
      '. Consider scaling your budget aggressively to capture more market share.';

  } else if (roi >= 100) {
    box.classList.add('assessment--success');
    icon.innerHTML = successIcon();
    title.textContent = 'Profitable: ' + formatNum(r) + '% ROI';
    body.textContent  =
      'Solid returns. Your ' + platform + ' campaign is profitable. ' +
      'Optimize further by refreshing your ad creative, tightening audience targeting, ' +
      'and improving your landing page conversion rate to push returns even higher.';

  } else if (roi >= 0) {
    box.classList.add('assessment--warning');
    icon.innerHTML = warningIcon();
    title.textContent = 'Break-even: ' + formatNum(r) + '% ROI';
    body.textContent  =
      'Your ' + platform + ' campaign is marginally profitable. ' +
      'Focus on reducing cost per click through better quality scores, ' +
      'improving your landing page, and tightening your sales close rate ' +
      'to push into meaningful positive ROI.';

  } else {
    box.classList.add('assessment--danger');
    icon.innerHTML = dangerIcon();
    title.textContent = 'Unprofitable: ' + formatNum(r) + '% ROI';
    body.textContent  =
      'At these numbers, your ' + platform + ' campaign is not profitable. ' +
      'Review your CPC, improve landing page conversion rate, ' +
      'or revisit your customer LTV assumptions before committing further budget.';
  }
}

function successIcon() {
  return '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>';
}

function warningIcon() {
  return '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/></svg>';
}

function dangerIcon() {
  return '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"/></svg>';
}

/* ── Chart ───────────────────────────────────────────────────────────────── */

function updateChart(budget, revenue, profit) {
  const ctx         = document.getElementById('roi-chart').getContext('2d');
  const profitColor = profit >= 0 ? '#22C55E' : '#EF4444';
  const profitLabel = profit >= 0 ? 'Profit' : 'Loss';

  /* Update legend */
  const swatchEl = document.getElementById('legend-swatch-profit');
  const labelEl  = document.getElementById('legend-profit-label');
  if (swatchEl) swatchEl.style.background   = profitColor;
  if (labelEl)  labelEl.textContent = profitLabel;

  const chartData   = [budget, revenue, profit];
  const chartColors = ['#6B7280', '#3B82F6', profitColor];
  const chartLabels = ['Ad budget', 'Revenue', profitLabel];

  if (chartInstance) {
    chartInstance.data.labels                         = chartLabels;
    chartInstance.data.datasets[0].data               = chartData;
    chartInstance.data.datasets[0].backgroundColor    = chartColors;
    chartInstance.data.datasets[0].hoverBackgroundColor = chartColors.map(c => c + 'CC');
    chartInstance.update('none');
    return;
  }

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartLabels,
      datasets: [{
        data:                    chartData,
        backgroundColor:         chartColors,
        hoverBackgroundColor:    chartColors.map(c => c + 'CC'),
        borderRadius:            8,
        borderSkipped:           false,
        borderWidth:             0,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      animation: { duration: 300, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#111110',
          titleColor:      'rgba(255,255,255,.55)',
          bodyColor:       '#fff',
          padding:         10,
          cornerRadius:    8,
          titleFont:       { size: 11, weight: '600', family: "'Plus Jakarta Sans', sans-serif" },
          bodyFont:        { size: 13, weight: '600', family: "'Plus Jakarta Sans', sans-serif" },
          callbacks: {
            label: (ctx) => ' ' + formatIDRFull(ctx.raw),
          },
        },
      },
      scales: {
        y: {
          grid:   { color: 'rgba(0,0,0,0.05)', drawTicks: false },
          border: { display: false },
          ticks: {
            font:    { size: 11, family: "'Plus Jakarta Sans', sans-serif" },
            color:   '#A8A8A2',
            padding: 8,
            callback(v) {
              const a = Math.abs(v);
              const s = v < 0 ? '-' : '';
              if (a >= 1e9) return s + 'Rp ' + (a / 1e9).toFixed(1) + ' M';
              if (a >= 1e6) return s + 'Rp ' + (a / 1e6).toFixed(0) + ' jt';
              if (a >= 1e3) return s + 'Rp ' + (a / 1e3).toFixed(0) + ' rb';
              return s + 'Rp ' + a;
            },
          },
        },
        x: {
          grid:   { display: false },
          border: { display: false },
          ticks: {
            font:    { size: 13, weight: '500', family: "'Plus Jakarta Sans', sans-serif" },
            color:   '#6B6B66',
            padding: 8,
          },
        },
      },
    },
  });
}

/* ── PDF Download ────────────────────────────────────────────────────────── */

async function downloadPDF() {
  const btn      = document.getElementById('btn-pdf');
  const labelEl  = btn.querySelector('.btn-label');

  /* Loading state */
  btn.classList.add('loading');
  labelEl.textContent = 'Generating…';

  try {
    const { jsPDF }  = window.jspdf;
    const card       = document.getElementById('calculator-card');
    const platform   = activeTab === 'google' ? 'Google-Ads' : 'Meta-Ads';

    /* Render the card to canvas at 2× scale for retina sharpness */
    const canvas = await html2canvas(card, {
      scale:           2,
      useCORS:         true,
      allowTaint:      false,
      backgroundColor: '#ffffff',
      logging:         false,
      windowWidth:     card.scrollWidth,
      windowHeight:    card.scrollHeight,
      onclone(doc) {
        /* In the cloned document, make sure range hints are visible */
        doc.querySelectorAll('.field-range-hint').forEach(el => {
          el.style.display = 'flex';
        });
      },
    });

    const imgData = canvas.toDataURL('image/png', 1.0);

    /* A4 dimensions in mm */
    const pageW  = 210;
    const pageH  = 297;
    const margin = 12;

    const availW = pageW - margin * 2;
    const ratio  = canvas.height / canvas.width;
    const imgW   = availW;
    const imgH   = availW * ratio;

    const pdf = new jsPDF({
      orientation: imgH > pageH - margin * 2 ? 'portrait' : 'portrait',
      unit:        'mm',
      format:      'a4',
    });

    /* Header text above the screenshot */
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(17, 17, 16);
    pdf.text('Digital Ads ROI Calculator — IDR', margin, margin + 3);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(107, 107, 102);
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    pdf.text(
      'Platform: ' + (activeTab === 'google' ? 'Google Ads' : 'Meta Ads') + '   ·   ' + dateStr,
      margin, margin + 9
    );

    /* Thin separator line */
    pdf.setDrawColor(230, 230, 224);
    pdf.setLineWidth(0.3);
    pdf.line(margin, margin + 12, pageW - margin, margin + 12);

    /* Place the canvas screenshot */
    const imgY = margin + 16;

    /* If image is taller than one page, scale to fit */
    const maxImgH = pageH - imgY - margin;
    const finalH  = imgH > maxImgH ? maxImgH : imgH;
    const finalW  = imgH > maxImgH ? availW * (maxImgH / imgH) : imgW;
    const imgX    = margin + (availW - finalW) / 2;

    pdf.addImage(imgData, 'PNG', imgX, imgY, finalW, finalH);

    /* Footer */
    pdf.setFontSize(7);
    pdf.setTextColor(168, 168, 162);
    pdf.text(
      'Proyeksi berdasarkan input yang diberikan. Hasil aktual dapat berbeda.',
      pageW / 2, pageH - 6,
      { align: 'center' }
    );

    pdf.save('ROI-Calculator-' + platform + '.pdf');

  } catch (err) {
    console.error('PDF generation failed:', err);
    /* Graceful fallback to browser print */
    window.print();
  } finally {
    btn.classList.remove('loading');
    labelEl.textContent = 'Download PDF';
  }
}

/* ── Keyboard accessibility: tab switching with arrow keys ───────────────── */

document.addEventListener('keydown', function (e) {
  const focused = document.activeElement;
  if (!focused || !focused.classList.contains('tab')) return;

  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    e.preventDefault();
    const next = activeTab === 'google' ? 'meta' : 'google';
    switchTab(next);
    document.getElementById('tab-' + next).focus();
  }
});

/* ── Init ────────────────────────────────────────────────────────────────── */

(function init() {
  refreshSliderFills();
  calc();

  /* Re-run fill on any slider change (redundant but safe) */
  document.querySelectorAll('input[type="range"]').forEach(function (input) {
    input.addEventListener('input', function () { updateSliderFill(this); });
  });
})();
