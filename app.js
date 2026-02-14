/**
 * DeFi Sentinel — Frontend Application
 * 
 * Loads event data and AI analysis, renders interactive dashboard
 */

(function() {
  'use strict';

  let events = [];
  let analysis = null;
  let filteredEvents = [];

  // ─── Data Loading ─────────────────────────────────────
  async function loadData() {
    try {
      const [eventsRes, analysisRes] = await Promise.allSettled([
        fetch('data/events.json').then(r => r.ok ? r.json() : []),
        fetch('data/analysis.json').then(r => r.ok ? r.json() : null)
      ]);

      events = eventsRes.status === 'fulfilled' ? eventsRes.value : [];
      analysis = analysisRes.status === 'fulfilled' ? analysisRes.value : null;

      // Sort events by date (newest first)
      events.sort((a, b) => {
        const da = new Date(b.timestamp || b.date || b.published || 0);
        const db = new Date(a.timestamp || a.date || a.published || 0);
        return da - db;
      });

      filteredEvents = [...events];

      renderStats();
      renderRiskBanner();
      renderEvents();
      renderAnalysis();
      renderRisks();
      populateChainFilter();
    } catch (err) {
      console.error('Failed to load data:', err);
      document.getElementById('events-list').innerHTML = 
        '<div class="no-results"><p>⚠️ Failed to load data. Please check the data files.</p></div>';
    }
  }

  // ─── Stats ────────────────────────────────────────────
  function renderStats() {
    const critical = events.filter(e => e.severity === 'critical').length;
    const high = events.filter(e => e.severity === 'high').length;

    let totalLoss = 0;
    events.forEach(e => {
      const loss = parseFloat((e.estimatedLoss || '0').replace(/[$,]/g, ''));
      if (!isNaN(loss)) totalLoss += loss;
    });

    document.getElementById('stat-total').textContent = events.length;
    document.getElementById('stat-critical').textContent = critical;
    document.getElementById('stat-high').textContent = high;
    document.getElementById('stat-loss').textContent = totalLoss >= 1e6 
      ? '$' + (totalLoss / 1e6).toFixed(1) + 'M' 
      : '$' + totalLoss.toLocaleString();
  }

  // ─── Risk Banner ──────────────────────────────────────
  function renderRiskBanner() {
    const banner = document.getElementById('risk-banner');
    const indicator = document.getElementById('risk-indicator');
    const title = document.getElementById('risk-title');
    const desc = document.getElementById('risk-desc');

    const riskLevel = analysis?.weeklyBrief?.riskLevel || 'medium';
    banner.className = `risk-banner ${riskLevel}`;
    indicator.textContent = riskLevel.toUpperCase();

    const titles = {
      critical: '⚠️ Critical Threat Level',
      high: '🔴 Elevated Threat Level',
      medium: '🟡 Moderate Threat Level',
      low: '🟢 Low Threat Level'
    };

    title.textContent = titles[riskLevel] || titles.medium;

    const critical = events.filter(e => e.severity === 'critical').length;
    desc.textContent = analysis?.weeklyBrief?.summary?.split('\n')[0] || 
      `${events.length} security events tracked this period, with ${critical} critical-severity incidents requiring immediate attention.`;
  }

  // ─── Events ───────────────────────────────────────────
  function renderEvents() {
    const container = document.getElementById('events-list');

    if (filteredEvents.length === 0) {
      container.innerHTML = '<div class="no-results"><p>No events match your filters.</p></div>';
      return;
    }

    container.innerHTML = filteredEvents.map(event => {
      const severity = event.severity || 'medium';
      const category = event.category || 'other';
      const chain = event.chain || '';
      const status = event.status || '';
      const date = event.timestamp || event.date || event.published || '';
      const loss = event.estimatedLoss || '';
      const isZeroLoss = loss.includes('$0') || loss === '';
      const protocol = event.affectedProtocol || '';

      const categoryLabels = {
        'exploit': '💥 Exploit',
        'flash-loan': '⚡ Flash Loan',
        'vulnerability': '🐛 Vulnerability',
        'rug-pull': '🚩 Rug Pull',
        'oracle-attack': '🔮 Oracle Attack',
        'other': '📌 Other'
      };

      return `
        <div class="event-card severity-${severity}">
          <div class="event-header">
            <div class="event-title">${escapeHtml(event.title || 'Untitled Event')}</div>
            ${loss ? `<div class="event-loss ${isZeroLoss ? 'zero' : ''}">${escapeHtml(loss)}</div>` : ''}
          </div>
          <div class="event-description">${escapeHtml(event.description || '')}</div>
          <div class="event-footer">
            <div class="event-tags">
              <span class="badge badge-${severity}">${severity}</span>
              <span class="badge badge-category">${categoryLabels[category] || category}</span>
              ${chain ? `<span class="badge badge-chain">${escapeHtml(chain)}</span>` : ''}
              ${status ? `<span class="badge-status ${status}">${formatStatus(status)}</span>` : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              ${protocol ? `<span class="event-protocol">${escapeHtml(protocol)}</span>` : ''}
              <span class="event-date">${formatDate(date)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ─── Analysis Tab ─────────────────────────────────────
  function renderAnalysis() {
    const container = document.getElementById('analysis-content');

    if (!analysis || !analysis.weeklyBrief) {
      container.innerHTML = '<div class="no-results"><p>AI analysis not available. Run the analysis script to generate insights.</p></div>';
      return;
    }

    const brief = analysis.weeklyBrief;

    container.innerHTML = `
      <div class="analysis-section">
        <h3>📋 ${escapeHtml(brief.title)}</h3>
        <div class="brief-summary">${escapeHtml(brief.summary)}</div>
      </div>

      <div class="analysis-section">
        <h3>🔍 Key Findings</h3>
        <ul class="findings-list">
          ${(brief.keyFindings || []).map(f => `<li>${escapeHtml(f)}</li>`).join('')}
        </ul>
      </div>

      <div class="analysis-section">
        <h3>🎯 Top Threats</h3>
        <div class="threat-cards">
          ${(brief.topThreats || []).map(t => `
            <div class="threat-card">
              <h4>
                <span class="badge badge-${t.severity}">${t.severity}</span>
                ${escapeHtml(t.threat)}
              </h4>
              <div class="threat-protocols">
                ${(t.affectedProtocols || []).map(p => `<span>${escapeHtml(p)}</span>`).join('')}
              </div>
              <p>${escapeHtml(t.description)}</p>
              <div class="recommendation">${escapeHtml(t.recommendation)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="analysis-section">
        <h3>📈 Trend Analysis</h3>
        <div class="trend-box">${escapeHtml(brief.trendAnalysis || '')}</div>
      </div>

      <div class="analysis-section">
        <h3>✅ Recommendations</h3>
        <ul class="recommendations-list">
          ${(brief.recommendations || []).map(r => `<li>${escapeHtml(r)}</li>`).join('')}
        </ul>
      </div>

      <div style="text-align: center; margin-top: 24px; color: var(--text-muted); font-size: 12px;">
        Analysis generated: ${analysis.generatedAt ? new Date(analysis.generatedAt).toLocaleString() : 'N/A'}
        · Powered by GitHub Models (GPT-4o-mini)
      </div>
    `;
  }

  // ─── Protocol Risks Tab ───────────────────────────────
  function renderRisks() {
    const container = document.getElementById('risks-content');

    if (!analysis || !analysis.protocolRisks || analysis.protocolRisks.length === 0) {
      container.innerHTML = '<div class="no-results"><p>Protocol risk data not available.</p></div>';
      return;
    }

    const risks = analysis.protocolRisks.sort((a, b) => b.riskScore - a.riskScore);

    container.innerHTML = `
      <div class="analysis-section">
        <h3>📊 Protocol Risk Assessment</h3>
        <div class="risk-table-wrapper">
          <table class="risk-table">
            <thead>
              <tr>
                <th>Protocol Category</th>
                <th>Risk Score</th>
                <th>Level</th>
                <th>Risk Factors</th>
                <th>Last Incident</th>
              </tr>
            </thead>
            <tbody>
              ${risks.map(r => {
                const level = r.riskLevel || getRiskLevel(r.riskScore);
                const pct = (r.riskScore / 10) * 100;
                return `
                  <tr>
                    <td><strong>${escapeHtml(r.protocol)}</strong></td>
                    <td>
                      <div class="risk-score-bar">
                        <span class="risk-score-num ${level}">${r.riskScore}</span>
                        <div class="risk-score-fill ${level}" style="--pct: ${pct}%">
                          <style>.risk-score-fill[style*="--pct: ${pct}%"]::after { width: ${pct}%; }</style>
                        </div>
                      </div>
                    </td>
                    <td><span class="badge badge-${level}">${level}</span></td>
                    <td>
                      <div class="risk-factors">
                        ${(r.factors || []).map(f => `<span class="risk-factor">${escapeHtml(f)}</span>`).join('')}
                      </div>
                    </td>
                    <td class="event-date">${escapeHtml(r.lastIncident || 'N/A')}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ─── Filters ──────────────────────────────────────────
  function applyFilters() {
    const search = document.getElementById('search-input').value.toLowerCase().trim();
    const severity = document.getElementById('severity-filter').value;
    const category = document.getElementById('category-filter').value;
    const chain = document.getElementById('chain-filter').value;

    filteredEvents = events.filter(e => {
      if (severity !== 'all' && e.severity !== severity) return false;
      if (category !== 'all' && e.category !== category) return false;
      if (chain !== 'all' && (e.chain || '') !== chain) return false;
      if (search) {
        const haystack = [
          e.title, e.description, e.affectedProtocol, e.chain, 
          e.source, e.trackedEntity, e.trackedTopic
        ].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    renderEvents();
  }

  function populateChainFilter() {
    const chainFilter = document.getElementById('chain-filter');
    const chains = [...new Set(events.map(e => e.chain).filter(Boolean))].sort();
    chains.forEach(chain => {
      const opt = document.createElement('option');
      opt.value = chain;
      opt.textContent = chain;
      chainFilter.appendChild(opt);
    });
  }

  // ─── Tab Navigation ───────────────────────────────────
  function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
      });
    });

    // Handle hash navigation
    const hash = window.location.hash.replace('#', '');
    if (['events', 'analysis', 'risks'].includes(hash)) {
      document.querySelector(`[data-tab="${hash}"]`)?.click();
    }
  }

  // ─── Utilities ────────────────────────────────────────
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  function formatStatus(status) {
    return status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function getRiskLevel(score) {
    if (score >= 8) return 'critical';
    if (score >= 6) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  // ─── Initialize ───────────────────────────────────────
  function init() {
    initTabs();

    // Debounced search
    let searchTimeout;
    document.getElementById('search-input').addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(applyFilters, 300);
    });

    document.getElementById('severity-filter').addEventListener('change', applyFilters);
    document.getElementById('category-filter').addEventListener('change', applyFilters);
    document.getElementById('chain-filter').addEventListener('change', applyFilters);

    loadData();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
