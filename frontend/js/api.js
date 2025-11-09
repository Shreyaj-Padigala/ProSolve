/**
 * API Client for backend communication (SQLite-ready)
 */

var API_BASE_URL = 'http://localhost:8000';

// Health check on load (non-blocking)
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    fetch(`${API_BASE_URL}/health`)
      .then(() => console.log('✅ Backend is connected and running'))
      .catch(() => console.warn('⚠️ Backend not reachable on port 8000'));
  });
}

/* ---------------- Helpers ---------------- */
function pct(n, fallback = 70) {
  const x = Number.isFinite(n) ? n : fallback;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function buildScenarioText(d) {
  const parts = [
    `${d.name}: ${d.description}`,
    `Target market: ${d.targetMarket}`,
    `Timeline: ${d.timeline}`,
  ];
  if (d.resources) parts.push(`Resources: ${d.resources}`);
  if (Array.isArray(d.assumptions) && d.assumptions.length)
    parts.push(`Assumptions: ${d.assumptions.join('; ')}`);
  return parts.join('. ') + '.';
}

const API = {
  /* ================= LLM simulate ================= */
  async analyzeScenario(scenarioData) {
    try {
      const requestBody = { scenario: buildScenarioText(scenarioData), context: null };
      const response = await fetch(`${API_BASE_URL}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Backend error (${response.status}): ${body}`);
      }
      const result = await response.json();

      const scores = result?.scores || {};
      const reasons = result?.reasons || {};
      const impacts = result?.impacts || {};
      const rec = result?.recommendation || {};
      const topRisks = Array.isArray(result?.top_risks) ? result.top_risks : [];
      const opps = Array.isArray(result?.opportunities) ? result.opportunities : [];

      const feasibility = pct(scores.overall, 70);
      const impact = pct((scores.customer ?? 0) + (scores.competitive ?? 0) + 50, 75);

      const riskList = [
        impacts.risk, impacts.customer, impacts.competitive, impacts.cost,
        ...topRisks.map(r => `${r.title} — Mitigation: ${r.mitigation}`),
      ].filter(Boolean);

      const oppList = [
        ...opps,
        ...(reasons.competitive && /advantage|position|differentiation/i.test(reasons.competitive) ? [reasons.competitive] : []),
        ...(reasons.customer && /growth|upsell|benefit|retention/i.test(reasons.customer) ? [reasons.customer] : []),
      ].filter(Boolean).slice(0, 6);

      return {
        id: Date.now().toString(),
        name: scenarioData.name,
        description: scenarioData.description,
        targetMarket: scenarioData.targetMarket,
        timeline: scenarioData.timeline,
        resources: scenarioData.resources || null,
        assumptions: scenarioData.assumptions || [],
        createdAt: new Date().toISOString(),
        aiAnalysis: {
          feasibility,
          impact,
          risks: riskList,
          opportunities: oppList,
          recommendation: rec.rationale || '',
          keyMetrics: [
            { label: 'Feasibility Score', value: `${feasibility}%`, trend: feasibility >= 70 ? 'up' : feasibility >= 50 ? 'neutral' : 'down' },
            { label: 'Time to Market', value: scenarioData.timeline, trend: 'neutral' },
            { label: 'Risk Level', value: `${pct(scores.risk, 50)}%`, trend: (scores.risk ?? 50) > 70 ? 'down' : (scores.risk ?? 50) > 50 ? 'neutral' : 'up' },
            { label: 'Customer Impact', value: `${(scores.customer ?? 0) > 0 ? '+' : ''}${pct(scores.customer ?? 0, 0)}%`, trend: (scores.customer ?? 0) > 0 ? 'up' : (scores.customer ?? 0) < 0 ? 'down' : 'neutral' },
          ],
          aiReasons: reasons,
          aiRecommendationFull: rec,
          aiRaw: result,
        },
      };
    } catch (err) {
      console.error('❌ analyzeScenario failed, using mock:', err);
      return this.getMockAnalysis(scenarioData);
    }
  },

  /* ================= Tasks (SQLite) ================= */
  // Matches FastAPI TaskCreate (aliases enabled in Pydantic)
  async createTask({
    name, description, targetMarket, timeline,
    resources = null, assumptions = [], aiAnalysis = null, createdAt = null
  }) {
    const body = {
      name,
      description,
      targetMarket,   // alias -> target_market
      timeline,
      resources,
      assumptions,
      aiAnalysis,     // alias -> ai_analysis
      createdAt       // alias -> created_at
    };

    const r = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await r.text();
    if (!r.ok) {
      console.error('❌ Save failed body:', text);
      throw new Error('Failed to create task');
    }
    return JSON.parse(text);
  },

  async getTodayTasks() {
    const r = await fetch(`${API_BASE_URL}/tasks/today`);
    if (!r.ok) throw new Error("Failed to load today's tasks");
    return r.json();
  },

  async getHistoryGroups() {
    // returns { groups: { 'YYYY-MM-DD': [tasks...] } }
    const r = await fetch(`${API_BASE_URL}/tasks/history`);
    if (!r.ok) throw new Error('Failed to load history');
    return r.json();
  },

  async deleteTask(id) {
    console.log('🗑️ Deleting task', id);
    const r = await fetch(`${API_BASE_URL}/tasks/${id}`, { method: 'DELETE' });
    if (!r.ok) {
      const body = await r.text().catch(() => '');
      console.error('❌ Delete failed:', body || r.statusText);
      throw new Error('Failed to delete task');
    }
    return r.json();
  },

  /* ========== Legacy helpers (optional) ========== */
  async getScenarios() {
    try {
      const response = await fetch(`${API_BASE_URL}/scenarios`);
      if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      return [];
    }
  },

  async deleteScenario(scenarioId) {
    // Kept for back-compat; routes to /tasks/{id}
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${scenarioId}`, { method: 'DELETE' });
      return response.ok;
    } catch (error) {
      console.error('Error deleting scenario:', error);
      return false;
    }
  },

  /* ================= Mock ================= */
  getMockAnalysis(scenarioData) {
    const feasibility = Math.floor(Math.random() * 30) + 70;
    const impact = Math.floor(Math.random() * 30) + 70;
    return {
      id: Date.now().toString(),
      ...scenarioData,
      createdAt: new Date().toISOString(),
      aiAnalysis: {
        feasibility,
        impact,
        risks: [
          'Market adoption may be slower than anticipated',
          'Resource allocation conflicts with existing priorities',
          'Technical dependencies on third-party vendors',
          'Competitive response could accelerate timeline pressures',
        ],
        opportunities: [
          'First-mover advantage in emerging market segment',
          'Potential for strategic partnerships with key players',
          'Strong alignment with long-term company vision',
          'Opportunity to establish industry standards',
        ],
        recommendation:
          feasibility > 80 && impact > 80
            ? 'High priority - Recommend immediate execution with full resource allocation'
            : feasibility > 70
            ? 'Medium priority - Validate assumptions with user research before proceeding'
            : 'Low priority - Consider alternative approaches or defer until resources available',
        keyMetrics: [
          { label: 'Est. User Impact', value: `${Math.floor(Math.random() * 500 + 100)}K users`, trend: 'up' },
          { label: 'Time to Market', value: scenarioData.timeline, trend: 'neutral' },
          { label: 'Resource Efficiency', value: `${Math.floor(Math.random() * 30) + 70}%`, trend: 'up' },
          { label: 'Market Fit Score', value: `${Math.floor(Math.random() * 20) + 75}/100`, trend: 'up' },
        ],
      },
    };
  },
};

/* ---- Back-compat shims so older code paths keep working ---- */
if (!API.getCurrentTasks) {
  API.getCurrentTasks = API.getTodayTasks;
}

/* Node export (optional) */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API;
}
