/* ==========================================================================
   Digital Ads ROI Calculator — calculator.js
   ========================================================================== */

'use strict';

/* ── State ──────────────────────────────────────────────────────────────── */
let activeTab = 'google';
let chartInstance = null;

/* ── Tab content config ─────────────────────────────────────────────────── */
const TAB_CONFIG = {
  google: {
    cpcLabel:    'What is the average cost per click for keywords relating to your business?',
    budgetLabel: 'How much do you intend to spend on your ad campaign?',
    convLabel:   'What is the conversion rate of visitors to your website that become new leads?',
    visitsLabel: 'Visits',
    cpcDefault:  5000,
    convDefault: 5,
    closeDefault: 25,
  },
  meta: {
    cpcLabel:    'What is the average cost per click on Facebook or Instagram ads for your industry?',
    budgetLabel: 'How much do you intend to spend on your Meta Ads campaign?',
    convLabel:   'What is the conversion rate of ad clickers that become new leads / purchase?',
    visitsLabel: 'Clicks',
    cpcDefault:  2500,
    convDefault: 3,
    closeDefault: 20,
  },
};

/* ── Formatters ─────────────────────────────────────────────────────────── */

function formatIDR(n) {
  const r = Math.round(n);
  const a = Math.abs(r);
  const s = r < 0 ? '-' : '';
  if (a >= 1e12) return s + 'Rp\u00a0' + (a / 1e12).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '\u00a0T';
  if (a >= 1e9)  return s + 'Rp\u00a0' + (a / 1e9 ).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '\u00a0M';
  if (a >= 1e6)  return s + 'Rp\u00a0' + (a / 1e6 ).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '\u00a0jt';
  if (a >= 1e3)  return s + 'Rp\u00a0' + (a / 1e3 ).toLocaleString('id-ID', { maximumFractionDigits: 0 }) + '\u00a0rb';
  return s + 'Rp\u00a0' + a.toLocaleString('id-ID');
}

function formatIDRFull(n) {
  const r = Math.round(n);
  const s = r < 0 ? '-' : '';
  return s + 'Rp\u00a0' + Math.abs(r).toLocaleString('id-ID');
}

function formatNum(n) {
  return Math.round(n).toLocaleString('id-ID');
}

function formatPct(n, dec = 1) {
  return n.toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + '%';
}

function formatROI(roi) {
  return formatNum(Math.round(roi)) + '%';
}

function formatROAS(roas) {
  return 'ROAS\u00a0' + roas.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '×';
}

/* ── Slider fill ────────────────────────────────────────────────────────── */

function fillSlider(input) {
  const pct = ((+input.value - +input.min) / (+input.max - +input.min)) * 100;
  input.style.background =
    `linear-gradient(to right, #111110 0%, #111110 ${pct}%, #E4E4DE ${pct}%, #E4E4DE 100%)`;
}

function fillAllSliders() {
  document.querySelectorAll('input[type="range"]').forEach(fillSlider);
}

/* ── Tab switching ──────────────────────────────────────────────────────── */

function switchTab(tab) {
  activeTab = tab;
  const cfg = TAB_CONFIG[tab];

  /* Button states */
  const gBtn = document.getElementById('tab-google');
  const mBtn = document.getElementById('tab-meta');
  const isGoogle = tab === 'google';
  gBtn.classList.toggle('tab--active', isGoogle);
  gBtn.setAttribute('aria-selected', String(isGoogle));
  mBtn.classList.toggle('tab--active', !isGoogle);
  mBtn.setAttribute('aria-selected', String(!isGoogle));

  /* Update dynamic labels */
  document.getElementById('lbl-cpc').textContent    = cfg.cpcLabel;
  document.getElementById('lbl-budget').textContent = cfg.budgetLabel;
  document.getElementById('lbl-conv').textContent   = cfg.convLabel;
  document.getElementById('lbl-visits').textContent = cfg.visitsLabel;

  /* Reset defaults */
  document.getElementById('s-cpc').value   = cfg.cpcDefault;
  document.getElementById('s-conv').value  = cfg.convDefault;
  document.getElementById('s-close').value = cfg.closeDefault;

  calc();
}

/* ── Core calculation ───────────────────────────────────────────────────── */

function calc() {
  /* ── Read inputs ── */
  const cpc     = +document.getElementById('s-cpc').value;
  const budget  = +document.getElementById('s-budget').value;
  const conv    = +document.getElementById('s-conv').value;
  const close   = +document.getElementById('s-close').value;
  const payback = +document.getElementById('s-payback').value;
  const monthly = +document.getElementById('s-monthly').value;
  const ltv     = +document.getElementById('s-ltv').value;
  const margin  = +document.getElementById('s-margin').value;

  /* ── Display slider values ── */
  document.getElementById('val-cpc').textContent     = formatIDR(cpc);
  document.getElementById('val-budget').textContent  = formatIDR(budget);
  document.getElementById('val-conv').textContent    = formatPct(conv);
  document.getElementById('val-close').textContent   = close + '%';
  document.getElementById('val-payback').textContent = payback + ' bln';
  document.getElementById('val-monthly').textContent = formatIDR(monthly);
  document.getElementById('val-ltv').textContent     = formatIDR(ltv);
  document.getElementById('val-margin').textContent  = margin + '%';

  fillAllSliders();

  /* ── Formulas ── */
  const clicks    = cpc > 0 ? budget / cpc : 0;
  const leads     = clicks * (conv / 100);
  const customers = leads  * (close / 100);

  const cpl = leads     > 0 ? budget / leads     : 0;
  const cpa = customers > 0 ? budget / customers : 0;

  /* Monthly revenue from new customers acquired this campaign */
  const monthlyRev = customers * monthly;

  /* Payback period: revenue earned over N months from new customers */
  const ppRevenue = customers * monthly * payback;
  const ppProfit  = ppRevenue * (margin / 100) - budget;
  const ppROI     = budget > 0 ? (ppProfit / budget) * 100 : 0;
  const ppROAS    = budget > 0 ? ppRevenue / budget : 0;

  /* Lifetime value: total value of new customers over their lifetime */
  const ltvRevenue = customers * ltv;
  const ltvProfit  = ltvRevenue * (margin / 100) - budget;
  const ltvROI     = budget > 0 ? (ltvProfit / budget) * 100 : 0;
  const ltvROAS    = budget > 0 ? ltvRevenue / budget : 0;

  /* ── Update metric cards ── */
  document.getElementById('r-visits').textContent     = formatNum(clicks);
  document.getElementById('r-leads').textContent      = formatNum(leads);
  document.getElementById('r-customers').textContent  = formatNum(customers);
  document.getElementById('r-cpl').textContent        = formatIDR(cpl);
  document.getElementById('r-cpa').textContent        = formatIDR(cpa);
  document.getElementById('r-monthly-rev').textContent = formatIDR(monthlyRev);

  /* ── Payback Period ROI card ── */
  document.getElementById('roi-pp-eyebrow').textContent = `Payback Period (${payback} bln)`;

  const ppNumEl = document.getElementById('r-roi-pp');
  ppNumEl.textContent = formatROI(ppROI);
  ppNumEl.style.color = roiColor(ppROI);

  document.getElementById('r-roas-pp').textContent   = formatROAS(ppROAS);
  document.getElementById('r-pp-rev').textContent    = formatIDR(ppRevenue);
  document.getElementById('r-pp-profit').textContent = formatIDR(ppProfit);

  /* ── LTV ROI card ── */
  const ltvNumEl = document.getElementById('r-roi-ltv');
  ltvNumEl.textContent = formatROI(ltvROI);
  ltvNumEl.style.color = roiColor(ltvROI);

  document.getElementById('r-roas-ltv').textContent   = formatROAS(ltvROAS);
  document.getElementById('r-ltv-rev').textContent    = formatIDR(ltvRevenue);
  document.getElementById('r-ltv-profit').textContent = formatIDR(ltvProfit);

  /* ── Assessment (based on LTV ROI as the primary indicator) ── */
  updateAssessment(ltvROI, ppROI, payback);

  /* ── Chart ── */
  updateChart(budget, ppRevenue, ppProfit, ltvRevenue, ltvProfit);
}

function roiColor(roi) {
  if (roi >= 100) return '#4ADE80';
  if (roi >= 0)   return '#FCD34D';
  return '#F87171';
}

/* ── Assessment ─────────────────────────────────────────────────────────── */

function updateAssessment(ltvROI, ppROI, payback) {
  const box   = document.getElementById('assessment');
  const icon  = document.getElementById('assessment-icon');
  const title = document.getElementById('a-title');
  const body  = document.getElementById('a-body');
  const p     = activeTab === 'google' ? 'Google Ads' : 'Meta Ads (Facebook/Instagram)';
  const r     = Math.round(ltvROI);

  box.className = 'assessment';

  if (ltvROI >= 300) {
    box.classList.add('assessment--success');
    icon.innerHTML = iconSuccess();
    title.textContent = `Highly profitable: ${formatNum(r)}% LTV ROI`;
    body.textContent =
      `Your ${p} campaign shows exceptional returns over the customer lifetime. ` +
      `The payback period ROI (${formatNum(Math.round(ppROI))}% over ${payback} months) already looks strong, ` +
      `and lifetime value makes it even better. Consider scaling budget to capture more customers.`;

  } else if (ltvROI >= 100) {
    box.classList.add('assessment--success');
    icon.innerHTML = iconSuccess();
    title.textContent = `Profitable: ${formatNum(r)}% LTV ROI`;
    body.textContent =
      `Solid returns. Your ${p} campaign is profitable on a lifetime value basis ` +
      `(payback period ROI: ${formatNum(Math.round(ppROI))}% over ${payback} months). ` +
      `Optimize ad creative, tighten audience targeting, and improve your landing page ` +
      `to push returns higher.`;

  } else if (ltvROI >= 0) {
    box.classList.add('assessment--warning');
    icon.innerHTML = iconWarning();
    title.textContent = `Break-even: ${formatNum(r)}% LTV ROI`;
    body.textContent =
      `Your ${p} campaign is marginally profitable over a customer's lifetime. ` +
      `Focus on reducing CPC through better quality scores, improving landing page conversion, ` +
      `and increasing your monthly customer value to push into solid positive ROI.`;

  } else {
    box.classList.add('assessment--danger');
    icon.innerHTML = iconDanger();
    title.textContent = `Unprofitable: ${formatNum(r)}% LTV ROI`;
    body.textContent =
      `At these numbers, your ${p} campaign does not generate a positive return. ` +
      `Review your CPC bids, improve your conversion funnel, or increase your customer ` +
      `lifetime value before committing the full budget.`;
  }
}

function iconSuccess() {
  return `<svg viewBox="0 0 20 20" fill="currentColor">
    <path fill-rule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
      clip-rule="evenodd"/>
  </svg>`;
}
function iconWarning() {
  return `<svg viewBox="0 0 20 20" fill="currentColor">
    <path fill-rule="evenodd"
      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
      clip-rule="evenodd"/>
  </svg>`;
}
function iconDanger() {
  return `<svg viewBox="0 0 20 20" fill="currentColor">
    <path fill-rule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
      clip-rule="evenodd"/>
  </svg>`;
}

/* ── Chart ───────────────────────────────────────────────────────────────── */

function updateChart(budget, ppRev, ppProfit, ltvRev, ltvProfit) {
  const ctx = document.getElementById('roi-chart').getContext('2d');

  const ppProfitColor  = ppProfit  >= 0 ? '#22C55E' : '#EF4444';
  const ltvProfitColor = ltvProfit >= 0 ? '#A3E635' : '#F87171';
  const ppProfitLabel  = ppProfit  >= 0 ? 'PP Profit'  : 'PP Loss';
  const ltvProfitLabel = ltvProfit >= 0 ? 'LTV Profit' : 'LTV Loss';

  /* Update legend dots */
  const lsPP  = document.getElementById('ls-pp-p');
  const llPP  = document.getElementById('ll-pp-p');
  const lsLTV = document.getElementById('ls-ltv-p');
  const llLTV = document.getElementById('ll-ltv-p');
  if (lsPP)  lsPP.style.background  = ppProfitColor;
  if (llPP)  llPP.textContent       = ppProfitLabel;
  if (lsLTV) lsLTV.style.background = ltvProfitColor;
  if (llLTV) llLTV.textContent      = ltvProfitLabel;

  const labels = ['Ad Budget', 'PP Revenue', ppProfitLabel, 'LTV Revenue', ltvProfitLabel];
  const data   = [budget, ppRev, ppProfit, ltvRev, ltvProfit];
  const colors = ['#6B7280', '#3B82F6', ppProfitColor, '#818CF8', ltvProfitColor];

  if (chartInstance) {
    chartInstance.data.labels                      = labels;
    chartInstance.data.datasets[0].data            = data;
    chartInstance.data.datasets[0].backgroundColor = colors;
    chartInstance.data.datasets[0].hoverBackgroundColor = colors.map(c => c + 'CC');
    chartInstance.update('none');
    return;
  }

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor:      colors,
        hoverBackgroundColor: colors.map(c => c + 'CC'),
        borderRadius:  7,
        borderSkipped: false,
        borderWidth:   0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#111110',
          titleColor:      'rgba(255,255,255,.5)',
          bodyColor:       '#fff',
          padding:         10,
          cornerRadius:    8,
          titleFont: { size: 11, weight: '600', family: "'Plus Jakarta Sans', sans-serif" },
          bodyFont:  { size: 13, weight: '600', family: "'Plus Jakarta Sans', sans-serif" },
          callbacks: {
            label: ctx => ' ' + formatIDRFull(ctx.raw),
          },
        },
      },
      scales: {
        y: {
          grid:   { color: 'rgba(0,0,0,0.05)', drawTicks: false },
          border: { display: false },
          ticks: {
            padding: 8,
            font:  { size: 11, family: "'Plus Jakarta Sans', sans-serif" },
            color: '#ABABAA',
            callback(v) {
              const a = Math.abs(v), s = v < 0 ? '-' : '';
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
            padding: 8,
            font:  { size: 11, weight: '500', family: "'Plus Jakarta Sans', sans-serif" },
            color: '#6B6B66',
          },
        },
      },
    },
  });
}

/* ── PDF Download ────────────────────────────────────────────────────────── */

async function downloadPDF() {
  const btn     = document.getElementById('btn-pdf');
  const labelEl = btn.querySelector('.btn-label');
  btn.classList.add('loading');
  labelEl.textContent = 'Generating…';

  try {
    const { jsPDF } = window.jspdf;
    const card      = document.getElementById('calculator-card');
    const platform  = activeTab === 'google' ? 'Google-Ads' : 'Meta-Ads';

    const canvas = await html2canvas(card, {
      scale:           2,
      useCORS:         true,
      allowTaint:      false,
      backgroundColor: '#ffffff',
      logging:         false,
      windowWidth:     card.scrollWidth,
      windowHeight:    card.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pageW   = 210;
    const pageH   = 297;
    const margin  = 12;
    const availW  = pageW - margin * 2;
    const ratio   = canvas.height / canvas.width;
    const imgH    = availW * ratio;
    const maxH    = pageH - margin * 2 - 24;
    const finalH  = imgH > maxH ? maxH : imgH;
    const finalW  = imgH > maxH ? availW * (maxH / imgH) : availW;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    /* Header */
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(17, 17, 16);
    pdf.text('Digital Ads ROI Calculator — IDR', margin, margin + 3);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(107, 107, 102);
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    pdf.text(
      'Platform: ' + (activeTab === 'google' ? 'Google Ads' : 'Meta Ads') + '   ·   ' + dateStr,
      margin, margin + 9
    );

    /* Separator */
    pdf.setDrawColor(228, 228, 222);
    pdf.setLineWidth(0.3);
    pdf.line(margin, margin + 12, pageW - margin, margin + 12);

    /* Screenshot */
    const imgX = margin + (availW - finalW) / 2;
    pdf.addImage(imgData, 'PNG', imgX, margin + 16, finalW, finalH);

    /* Footer note */
    pdf.setFontSize(7);
    pdf.setTextColor(171, 171, 170);
    pdf.text(
      'PP = Payback Period  ·  LTV = Customer Lifetime Value  ·  Proyeksi berdasarkan input yang diberikan.',
      pageW / 2, pageH - 6, { align: 'center' }
    );

    pdf.save('ROI-Calculator-' + platform + '.pdf');

  } catch (err) {
    console.error('PDF generation failed:', err);
    window.print();
  } finally {
    btn.classList.remove('loading');
    labelEl.textContent = 'Download PDF';
  }
}

/* ── Keyboard navigation ─────────────────────────────────────────────────── */

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
  /* Set initial labels from config */
  const cfg = TAB_CONFIG[activeTab];
  document.getElementById('lbl-cpc').textContent    = cfg.cpcLabel;
  document.getElementById('lbl-budget').textContent = cfg.budgetLabel;
  document.getElementById('lbl-conv').textContent   = cfg.convLabel;

  /* Attach fill listener to every slider */
  document.querySelectorAll('input[type="range"]').forEach(input => {
    input.addEventListener('input', () => fillSlider(input));
  });

  fillAllSliders();
  calc();
})();
