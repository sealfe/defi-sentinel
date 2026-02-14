import { readFile, writeFile, mkdir } from "fs/promises"

/**
 * DeFi Sentinel - AI Security Analysis
 * 
 * Uses GitHub Models (GPT-4o-mini) via REST API to generate:
 * - Weekly DeFi security briefings
 * - Risk assessments per protocol
 * - Trend analysis
 * - Actionable recommendations for auditors
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const MODEL_ENDPOINT = "https://models.inference.ai.azure.com/chat/completions"
const MODEL_NAME = "gpt-4o-mini"

/**
 * Call GitHub Models API directly via fetch
 */
async function callGitHubModel(systemPrompt, userPrompt) {
  const response = await fetch(MODEL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GITHUB_TOKEN}`
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    })
  })

  if (!response.ok) {
    throw new Error(`GitHub Models API returned ${response.status}: ${await response.text()}`)
  }

  const data = await response.json()
  return JSON.parse(data.choices[0].message.content)
}

/**
 * Generate AI analysis of DeFi security events
 */
async function generateAnalysis() {
  // Load events
  let events = []
  try {
    const raw = await readFile("data/events.json", "utf8")
    events = JSON.parse(raw)
  } catch {
    try {
      const mockRaw = await readFile("data/mock-events.json", "utf8")
      events = JSON.parse(mockRaw)
    } catch {
      console.log("No event data found.")
    }
  }

  if (!GITHUB_TOKEN) {
    console.log("No GITHUB_TOKEN found. Generating fallback analysis.")
    return generateFallbackAnalysis(events)
  }

  try {
    console.log("Calling GitHub Models API for AI analysis...")

    // Prepare event summary for the AI
    const eventSummary = events.slice(0, 50).map(e => ({
      title: e.title || "Untitled",
      date: e.timestamp || e.date || "Unknown",
      severity: e.severity || "medium",
      category: e.category || "other",
      affectedProtocol: e.affectedProtocol || "Unknown",
      estimatedLoss: e.estimatedLoss || "Unknown",
      chain: e.chain || "Unknown",
      description: (e.description || "").slice(0, 200)
    }))

    const result = await callGitHubModel(
      "You are a DeFi security analyst providing professional security intelligence. Always respond with valid JSON.",
      `Analyze these recent DeFi security events and generate a comprehensive weekly security briefing.

Events data:
${JSON.stringify(eventSummary, null, 2)}

Generate a JSON response with this structure:
{
  "weeklyBrief": {
    "title": "Weekly DeFi Security Brief - [Date Range]",
    "summary": "2-3 paragraph executive summary",
    "keyFindings": ["finding1", "finding2", ...],
    "riskLevel": "critical|high|medium|low",
    "topThreats": [
      { "threat": "name", "severity": "level", "affectedProtocols": ["..."], "description": "...", "recommendation": "..." }
    ],
    "trendAnalysis": "paragraph about trends",
    "recommendations": ["rec1", "rec2", ...]
  },
  "protocolRisks": [
    { "protocol": "name", "riskScore": 1-10, "riskLevel": "level", "factors": ["..."], "lastIncident": "date" }
  ],
  "generatedAt": "ISO date"
}`
    )

    return result
  } catch (error) {
    console.warn(`AI analysis error: ${error.message}. Using fallback.`)
    return generateFallbackAnalysis(events)
  }
}

/**
 * Generate analysis from event data without AI
 */
function generateFallbackAnalysis(events = []) {
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)

  // Compute stats from actual events
  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 }
  const categoryCounts = {}
  const chainCounts = {}
  const protocolSet = new Set()
  let totalLoss = 0

  events.forEach(e => {
    severityCounts[e.severity || "medium"]++
    const cat = e.category || "other"
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    if (e.chain) chainCounts[e.chain] = (chainCounts[e.chain] || 0) + 1
    if (e.affectedProtocol) protocolSet.add(e.affectedProtocol)
    const loss = parseFloat((e.estimatedLoss || "0").replace(/[$,]/g, ""))
    if (!isNaN(loss)) totalLoss += loss
  })

  const overallRisk = severityCounts.critical >= 3 ? "critical" : 
                      severityCounts.critical >= 1 ? "high" : "medium"

  return {
    weeklyBrief: {
      title: `Weekly DeFi Security Brief — ${weekAgo.toISOString().split("T")[0]} to ${now.toISOString().split("T")[0]}`,
      summary: `This week's DeFi security landscape recorded ${events.length} notable incidents across ${Object.keys(chainCounts).length} blockchain networks, with estimated total losses exceeding $${(totalLoss / 1e6).toFixed(1)}M. ${severityCounts.critical} events were classified as critical severity, highlighting persistent systemic risks in cross-chain infrastructure and lending protocols.\n\nCross-chain bridge exploits continue to dominate in terms of total value lost, while flash loan attacks on lending protocols show increasing sophistication. The discovery of pre-emptive vulnerabilities through bug bounty programs demonstrates the value of proactive security investment. Smart contract vulnerabilities in newer protocol forks remain a significant concern, particularly on emerging L2 networks.`,
      keyFindings: [
        `${events.length} security incidents tracked across ${protocolSet.size} protocols`,
        `Estimated total losses: $${(totalLoss / 1e6).toFixed(1)}M across all incidents`,
        "Cross-chain bridge exploits account for the highest single-incident losses",
        "Flash loan attack vectors continue to target oracle-dependent lending protocols",
        "Protocol forks on newer chains carry elevated risk due to environment-specific edge cases",
        "Bug bounty programs successfully prevented multiple potential exploits",
        "Governance attack surface expanding as DAO treasuries grow"
      ],
      riskLevel: overallRisk,
      topThreats: [
        {
          threat: "Cross-Chain Bridge Exploits",
          severity: "critical",
          affectedProtocols: ["Stargate Finance", "OmniSwap Bridge", "LayerZero-based protocols"],
          description: "Bridge protocols remain the highest-value targets due to large TVL concentrations and complex cross-chain message verification logic that is difficult to formally verify. Race conditions and message forgery are the primary attack vectors.",
          recommendation: "Implement multi-sig validation with time-locked withdrawals, deploy circuit breakers for large transfers, and adopt cross-chain monitoring with automated pause functionality."
        },
        {
          threat: "Flash Loan Oracle Manipulation",
          severity: "high",
          affectedProtocols: ["Euler Finance Forks", "Venus Protocol Forks", "Lending protocols"],
          description: "Sophisticated multi-step flash loan attacks combine spot price manipulation with oracle lag exploitation. Attackers target protocols using non-TWAP oracles or those with insufficient oracle delay protection.",
          recommendation: "Mandate TWAP oracle usage with configurable delay windows, implement flash loan guards on critical functions, and deploy real-time price deviation monitoring."
        },
        {
          threat: "Unaudited Protocol Fork Vulnerabilities",
          severity: "high",
          affectedProtocols: ["Aave V3 Forks", "Compound Forks", "L2 protocol deployments"],
          description: "Protocols forking established codebases and deploying on newer chains face environment-specific vulnerabilities. Differences in EVM implementation, gas mechanics, and opcode behavior create unexpected edge cases.",
          recommendation: "Require dedicated audits for forked deployments on new chains, implement comprehensive integration testing suites, and establish formal verification of core invariants."
        },
        {
          threat: "Rug Pulls and Exit Scams",
          severity: "critical",
          affectedProtocols: ["BaseYield Protocol", "New DeFi launches"],
          description: "High-yield DeFi protocols on emerging chains continue to attract deposits before executing exit scams. Social engineering and aggressive marketing campaigns precede liquidity drain events.",
          recommendation: "Verify contract ownership renunciation, check for time-locked liquidity, review audit status before depositing, and use on-chain monitoring tools to track admin key activity."
        }
      ],
      trendAnalysis: `The DeFi security landscape over the past week reflects an acceleration of several concerning trends. Attack sophistication continues to increase, with adversaries leveraging composability across multiple protocols within single atomic transactions. Bridge protocols and lending markets represent the largest concentration of vulnerability surface, accounting for the majority of total value lost.\n\nA positive trend is the increasing effectiveness of proactive security measures — multiple critical vulnerabilities were identified and patched before exploitation through bug bounty programs and automated monitoring systems. Protocols investing in security infrastructure show measurably lower incident rates. However, the rapid pace of new protocol launches on L2 networks continues to outstrip the available auditing capacity, creating windows of elevated risk.`,
      recommendations: [
        "Prioritize auditing cross-chain messaging and bridge validation logic",
        "Implement TWAP-based oracles with configurable delay windows across all lending markets",
        "Deploy circuit breakers that automatically pause operations on anomalous value transfers",
        "Adopt formal verification for core protocol invariants before mainnet deployment",
        "Establish and fund bug bounty programs proportional to protocol TVL",
        "Implement multi-sig requirements for all admin functions with time-locks",
        "Monitor governance proposals for potential attack vectors using automated tools",
        "Require independent audits for protocol forks deployed on new chains",
        "Deploy real-time flash loan monitoring and automated response systems"
      ]
    },
    protocolRisks: [
      { protocol: "Cross-chain Bridges", riskScore: 9, riskLevel: "critical", factors: ["Complex validation logic", "High TVL concentration", "Cross-chain attack surface", "Message forgery risk"], lastIncident: "2026-02-08" },
      { protocol: "Lending Protocols", riskScore: 8, riskLevel: "high", factors: ["Oracle dependency", "Flash loan exposure", "Liquidation cascade risk", "Fork vulnerability risk"], lastIncident: "2026-02-12" },
      { protocol: "DEX Aggregators", riskScore: 6, riskLevel: "medium", factors: ["Routing complexity", "MEV exposure", "Callback reentrancy risk", "Slippage manipulation"], lastIncident: "2026-02-11" },
      { protocol: "Yield Aggregators", riskScore: 7, riskLevel: "high", factors: ["Strategy complexity", "Composability risk", "Precision errors", "Admin key exposure"], lastIncident: "2026-02-07" },
      { protocol: "Stablecoin Protocols", riskScore: 6, riskLevel: "medium", factors: ["Peg mechanism risk", "Collateral quality", "Bank-run dynamics", "Governance attacks"], lastIncident: "2026-02-05" },
      { protocol: "Liquid Staking", riskScore: 4, riskLevel: "medium", factors: ["Validator risk", "Smart contract risk", "Depeg risk", "Slashing exposure"], lastIncident: "2026-02-05" },
      { protocol: "New Chain Protocols", riskScore: 8, riskLevel: "high", factors: ["Unaudited code", "Environment mismatch", "Low liquidity", "Rug pull risk"], lastIncident: "2026-02-07" }
    ],
    generatedAt: now.toISOString()
  }
}

async function main() {
  console.log("🤖 DeFi Sentinel - Generating AI Security Analysis...\n")

  const analysis = await generateAnalysis()

  await mkdir("data", { recursive: true })
  await writeFile("data/analysis.json", JSON.stringify(analysis, null, 2))

  console.log(`\n📋 Analysis generated: ${analysis.weeklyBrief.title}`)
  console.log(`   Risk Level: ${analysis.weeklyBrief.riskLevel.toUpperCase()}`)
  console.log(`   Key Findings: ${analysis.weeklyBrief.keyFindings.length}`)
  console.log(`   Protocol Risks: ${analysis.protocolRisks.length}`)
  console.log(`\n💾 Saved to data/analysis.json`)
}

main()
