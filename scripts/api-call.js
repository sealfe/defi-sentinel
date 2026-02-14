import { writeFile, readFile, mkdir } from "fs/promises"

const API_URL = "https://cpw-tracker.p.rapidapi.com/"
const API_KEY = process.env.RAPIDAPI_KEY

/**
 * DeFi Sentinel - Security Event Tracker
 * 
 * Monitors DeFi protocols for security incidents including:
 * - Smart contract exploits
 * - Flash loan attacks  
 * - Bridge hacks
 * - Rug pulls
 * - Oracle manipulation
 * - Governance attacks
 */

// DeFi entities to monitor
const DEFI_ENTITIES = [
  "DeFi protocols",
  "blockchain bridges",
  "lending protocols",
  "decentralized exchanges",
  "yield aggregators",
  "stablecoin protocols",
  "liquid staking protocols",
  "cross-chain bridges"
]

// Security topics to track
const SECURITY_TOPICS = [
  "exploit",
  "hack",
  "vulnerability",
  "flash loan attack",
  "rug pull",
  "security breach",
  "smart contract bug",
  "oracle manipulation"
]

/**
 * Get start and end dates for data fetch
 * @returns {Object} Object with startTime and endTime ISO strings
 */
function getDateRange() {
  const now = new Date()
  const endTime = now
  const startTime = new Date(now)
  startTime.setDate(startTime.getDate() - 7) // Last 7 days
  return {
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString()
  }
}

/**
 * Fetch data for a specific entity-topic combination
 * @param {string} entities - Entity to track
 * @param {string} topic - Topic to track
 * @returns {Promise<Array>} Array of event objects
 */
async function fetchForPair(entities, topic) {
  const { startTime, endTime } = getDateRange()

  console.log(`  Fetching: "${entities}" + "${topic}"`)

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": "cpw-tracker.p.rapidapi.com",
      "x-rapidapi-key": API_KEY,
    },
    body: JSON.stringify({
      entities,
      topic,
      startTime,
      endTime
    }),
  })

  if (!response.ok) {
    console.warn(`  Warning: API returned ${response.status} for "${entities}" + "${topic}"`)
    return []
  }

  const data = await response.json()
  const results = Array.isArray(data) ? data : []

  // Enrich each result with our tracking metadata
  return results.map(item => ({
    ...item,
    trackedEntity: entities,
    trackedTopic: topic,
    severity: classifySeverity(item, topic),
    category: classifyCategory(topic)
  }))
}

/**
 * Classify severity based on topic and content
 */
function classifySeverity(item, topic) {
  const text = (item.title || "" + item.description || "").toLowerCase()
  
  if (topic.includes("exploit") || topic.includes("hack")) {
    if (text.includes("million") || text.includes("billion")) return "critical"
    return "high"
  }
  if (topic.includes("flash loan")) return "high"
  if (topic.includes("rug pull")) return "critical"
  if (topic.includes("vulnerability") || topic.includes("bug")) return "medium"
  if (topic.includes("oracle")) return "high"
  return "medium"
}

/**
 * Classify event category
 */
function classifyCategory(topic) {
  if (topic.includes("exploit") || topic.includes("hack") || topic.includes("breach")) return "exploit"
  if (topic.includes("flash loan")) return "flash-loan"
  if (topic.includes("rug pull")) return "rug-pull"
  if (topic.includes("vulnerability") || topic.includes("bug")) return "vulnerability"
  if (topic.includes("oracle")) return "oracle-attack"
  return "other"
}

/**
 * Deduplicate events based on URL
 */
function deduplicateEvents(events) {
  const seen = new Set()
  return events.filter(event => {
    const key = event.url || event.link || JSON.stringify(event)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Fetch all DeFi security events
 */
async function fetchAllData() {
  if (!API_KEY) {
    console.log("No RAPIDAPI_KEY found. Using existing data or mock data.")
    return null
  }

  console.log("🛡️ DeFi Sentinel - Fetching security events...")
  console.log(`Monitoring ${DEFI_ENTITIES.length} entity types × ${SECURITY_TOPICS.length} topics\n`)

  let allResults = []

  // Fetch a representative subset to stay within API limits
  // Use 2 most important entities × 3 most important topics = 6 API calls
  const priorityEntities = DEFI_ENTITIES.slice(0, 3)
  const priorityTopics = SECURITY_TOPICS.slice(0, 3)

  for (const entity of priorityEntities) {
    for (const topic of priorityTopics) {
      try {
        const results = await fetchForPair(entity, topic)
        allResults = allResults.concat(results)
        // Small delay to be nice to the API
        await new Promise(r => setTimeout(r, 500))
      } catch (err) {
        console.warn(`  Error fetching "${entity}" + "${topic}": ${err.message}`)
      }
    }
  }

  const deduplicated = deduplicateEvents(allResults)
  console.log(`\n✅ Total unique events: ${deduplicated.length}`)

  return deduplicated
}

/**
 * Merge new data with existing events
 */
async function mergeWithExisting(newData) {
  let existing = []
  try {
    const raw = await readFile("data/events.json", "utf8")
    existing = JSON.parse(raw)
  } catch {
    // No existing data
  }

  if (!newData) return existing

  const merged = deduplicateEvents([...newData, ...existing])
  
  // Keep only last 90 days of data
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  
  return merged.filter(e => {
    const ts = new Date(e.timestamp || e.date || e.published)
    return ts > cutoff
  })
}

/**
 * Save data to JSON file
 */
async function saveData(data) {
  const sorted = data.sort((a, b) => {
    const dateA = new Date(b.timestamp || b.date || b.published || 0)
    const dateB = new Date(a.timestamp || a.date || a.published || 0)
    return dateA - dateB
  })

  await mkdir("data", { recursive: true })
  await writeFile("data/events.json", JSON.stringify(sorted, null, 2))
  console.log(`💾 Saved ${sorted.length} items to data/events.json`)
}

/**
 * Generate statistics summary
 */
function generateStats(events) {
  const stats = {
    total: events.length,
    bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
    byCategory: {},
    lastUpdated: new Date().toISOString()
  }

  events.forEach(e => {
    const sev = e.severity || "medium"
    stats.bySeverity[sev] = (stats.bySeverity[sev] || 0) + 1
    const cat = e.category || "other"
    stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1
  })

  return stats
}

/**
 * Main update process
 */
async function updateData() {
  try {
    const newData = await fetchAllData()
    const merged = await mergeWithExisting(newData)
    await saveData(merged)

    const stats = generateStats(merged)
    await writeFile("data/stats.json", JSON.stringify(stats, null, 2))
    console.log("\n📊 Stats:", JSON.stringify(stats, null, 2))

    console.log("\n🛡️ DeFi Sentinel update completed successfully")
  } catch (error) {
    console.error("Update failed:", error.message)
    process.exit(1)
  }
}

updateData()
