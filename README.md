# 🛡️ DeFi Sentinel

**AI-Powered DeFi Security Intelligence Platform**

[![Deploy DeFi Sentinel](https://github.com/sealfe/defi-sentinel/actions/workflows/deploy.yml/badge.svg)](https://github.com/sealfe/defi-sentinel/actions/workflows/deploy.yml)
[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen)](https://sealfe.github.io/defi-sentinel/)

> Real-time monitoring of DeFi exploits, vulnerabilities, flash loan attacks, and security incidents. Built for auditors, security researchers, and protocol teams.

**🔗 Live Demo: [sealfe.github.io/defi-sentinel](https://sealfe.github.io/defi-sentinel/)**

---

## 🎯 What It Does

DeFi Sentinel is a security intelligence dashboard that continuously monitors the DeFi ecosystem for security threats:

- **🔴 Exploit Tracking** — Monitors smart contract exploits, bridge hacks, and protocol breaches
- **⚡ Flash Loan Alerts** — Tracks flash loan attack vectors targeting lending protocols and DEXs
- **🐛 Vulnerability Intel** — Aggregates vulnerability disclosures and bug bounty reports
- **🚩 Rug Pull Detection** — Flags suspicious protocol behavior and exit scams
- **🔮 Oracle Attack Monitoring** — Watches for price oracle manipulation attempts
- **🤖 AI Security Briefs** — Weekly AI-generated threat analysis and risk assessments via GitHub Models

## 📸 Features

### Interactive Security Dashboard
- **Dark-themed professional UI** designed for security operations
- **Real-time search** across all events, protocols, and chains
- **Multi-dimensional filtering** by severity, category, and blockchain
- **Severity-coded event cards** with loss estimates, status tracking, and protocol attribution

### AI-Powered Analysis
- **Weekly Security Briefs** — Executive summaries of the DeFi threat landscape
- **Top Threats** — Prioritized threat analysis with affected protocols and recommendations
- **Trend Analysis** — Pattern recognition across attack vectors
- **Protocol Risk Scores** — Risk matrix with factor breakdown for each protocol category
- **Actionable Recommendations** — Specific defensive measures for protocol teams

### Protocol Risk Assessment
- **Risk scoring system** (1-10) for each DeFi protocol category
- **Risk factor breakdown** identifying specific vulnerability surfaces
- **Historical incident tracking** per protocol category
- **Visual risk indicators** with severity-coded progress bars

## 🏗️ Architecture

```
defi-sentinel/
├── index.html              # Main dashboard UI
├── style.css               # Dark theme styling
├── app.js                  # Frontend application logic
├── data/
│   ├── events.json         # Security event data (auto-updated)
│   ├── analysis.json       # AI-generated analysis
│   ├── mock-events.json    # Demo/fallback data
│   └── stats.json          # Summary statistics
├── scripts/
│   ├── api-call.js         # CPW API data fetcher
│   └── ai-analysis.js      # GitHub Models AI analysis
└── .github/workflows/
    └── deploy.yml          # Auto-update + GitHub Pages deploy
```

## 🚀 Setup

### 1. Use This Template

```bash
gh repo create your-username/defi-sentinel \
  --template 1712n/product-kit-template \
  --public --clone
```

### 2. Add API Keys

Go to **Settings → Secrets → Actions** and add:

| Secret | Required | Description |
|--------|----------|-------------|
| `RAPIDAPI_KEY` | Yes | [CPW API](https://rapidapi.com/CPWatch/api/cpw-tracker) key (100 free requests/month) |
| `GITHUB_TOKEN` | Auto | Used for AI analysis via [GitHub Models](https://docs.github.com/en/github-models) |

### 3. Enable GitHub Pages

Go to **Settings → Pages**:
- Source: **GitHub Actions**

### 4. Customize Tracking

Edit `scripts/api-call.js` to change what entities and topics you monitor:

```javascript
// DeFi entities to monitor
const DEFI_ENTITIES = [
  "DeFi protocols",
  "blockchain bridges",
  "lending protocols",
  // Add your own...
]

// Security topics to track
const SECURITY_TOPICS = [
  "exploit",
  "hack",
  "vulnerability",
  // Add your own...
]
```

### 5. Run Locally

```bash
# Fetch latest data (requires RAPIDAPI_KEY)
export RAPIDAPI_KEY=your_key_here
npm run fetch

# Generate AI analysis (requires GITHUB_TOKEN)
export GITHUB_TOKEN=your_token_here
npm run analyze

# Or run both
npm run update

# Serve locally
npx serve .
```

## 🔄 Automated Updates

The GitHub Actions workflow runs:
- **Weekly** (Sunday 12:00 UTC) — Fetches fresh data and regenerates AI analysis
- **On push** — Deploys the latest version to GitHub Pages
- **Manual** — Trigger anytime via `workflow_dispatch`

## 🎨 Customization

### Severity Classification

Events are classified into four severity levels based on topic and content analysis:

| Level | Color | Criteria |
|-------|-------|----------|
| 🔴 Critical | Red | Exploits with >$1M loss, rug pulls, active bridge hacks |
| 🟠 High | Orange | Flash loan attacks, hacks, oracle manipulation |
| 🔵 Medium | Blue | Vulnerabilities, bugs, potential threats |
| 🟢 Low | Green | Minor issues, informational alerts |

### Event Categories

| Category | Icon | Description |
|----------|------|-------------|
| Exploit | 💥 | Active exploits and hacks |
| Flash Loan | ⚡ | Flash loan-based attacks |
| Vulnerability | 🐛 | Disclosed vulnerabilities |
| Rug Pull | 🚩 | Exit scams and rug pulls |
| Oracle Attack | 🔮 | Oracle manipulation |
| Other | 📌 | Governance attacks, slashing, etc. |

## 🤖 AI Analysis Pipeline

The AI analysis uses [GitHub Models](https://docs.github.com/en/github-models) (GPT-4o-mini) to:

1. **Ingest** — Load all tracked security events
2. **Analyze** — Identify patterns, trends, and correlations
3. **Assess** — Generate risk scores for each protocol category
4. **Recommend** — Produce actionable security recommendations
5. **Summarize** — Create executive-level weekly briefs

When GitHub Models is unavailable, a sophisticated fallback analysis is generated using statistical analysis of the event data.

## 🎯 Target Audience

- **DeFi Security Auditors** — Stay updated on the latest attack vectors and vulnerability patterns
- **Protocol Security Teams** — Monitor the threat landscape affecting your protocol category
- **Security Researchers** — Track trends and discover emerging attack techniques
- **DeFi Investors** — Assess protocol risk before allocating capital
- **Bug Bounty Hunters** — Identify patterns that indicate potential vulnerabilities

## 📊 Data Sources

- **[CPW API](https://rapidapi.com/CPWatch/api/cpw-tracker)** — Primary data source for security event detection
- **[GitHub Models](https://docs.github.com/en/github-models)** — AI-powered analysis and summarization

## 🔧 Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (zero dependencies, fast loading)
- **Data Pipeline**: Node.js ESM scripts
- **AI**: GitHub Models (GPT-4o-mini) via REST API
- **Hosting**: GitHub Pages (free, auto-deployed)
- **CI/CD**: GitHub Actions

## 📜 License

MIT License — see [LICENSE](LICENSE)

---

<p align="center">
  <strong>🛡️ DeFi Sentinel</strong> — Protecting DeFi, one alert at a time.
  <br>
  Built with the <a href="https://github.com/1712n/product-kit-template">Product Kit Template</a> · Powered by <a href="https://rapidapi.com/CPWatch/api/cpw-tracker">CPW API</a>
</p>
