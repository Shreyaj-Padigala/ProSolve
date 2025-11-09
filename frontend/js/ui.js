/**
 * UI Rendering Functions
 */

const UI = {
    /**
     * Render a scenario card
     */
    renderScenarioCard(scenario, isSelected = false) {
        const ai = scenario?.aiAnalysis || {};
        const feasibility = Number.isFinite(ai.feasibility) ? ai.feasibility : 0;
        const impact = Number.isFinite(ai.impact) ? ai.impact : 0;
        const keyMetrics = Array.isArray(ai.keyMetrics) ? ai.keyMetrics : [];
        const risks = Array.isArray(ai.risks) ? ai.risks : [];
        const opportunities = Array.isArray(ai.opportunities) ? ai.opportunities : [];
      
        const scoreClass = (score) => {
          if (score >= 80) return 'score-high';
          if (score >= 60) return 'score-medium';
          return 'score-low';
        };
      
        const trendIcon = (trend) => {
          if (trend === 'up') return `
            <svg class="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
            </svg>`;
          if (trend === 'down') return `
            <svg class="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>`;
          return `
            <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
            </svg>`;
        };
      
        return `
          <div class="scenario-card ${isSelected ? 'selected' : ''} bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden fade-in" data-scenario-id="${scenario.id}">
            <div class="p-6 space-y-4">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-3">
                  <div class="custom-checkbox ${isSelected ? 'checked' : ''}" data-scenario-id="${scenario.id}">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <h3 class="text-lg font-bold text-slate-900 mb-2">${scenario.name || 'Untitled'}</h3>
                    <p class="text-sm text-slate-600">${scenario.description || ''}</p>
                  </div>
                </div>
                <button class="text-xs text-red-600 hover:underline" data-action="delete-task" data-id="${scenario.id}">Delete</button>
              </div>
      
              <div class="grid grid-cols-2 gap-3 text-sm pt-2">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  <span class="text-slate-600">${scenario.targetMarket || ''}</span>
                </div>
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span class="text-slate-600">${scenario.timeline || ''}</span>
                </div>
              </div>
      
              ${(Number.isFinite(feasibility) || Number.isFinite(impact) || keyMetrics.length || risks.length || opportunities.length) ? `
              <div class="space-y-3 pt-3 border-t border-slate-200">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-slate-600">Feasibility Score</span>
                  <span class="score-badge ${scoreClass(feasibility)}">${feasibility}%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width: ${feasibility}%"></div></div>
      
                <div class="flex items-center justify-between text-sm">
                  <span class="text-slate-600">Impact Score</span>
                  <span class="score-badge ${scoreClass(impact)}">${impact}%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width: ${impact}%"></div></div>
      
                <div class="grid grid-cols-2 gap-2 pt-2">
                  ${keyMetrics.slice(0, 2).map(metric => `
                    <div class="metric-card">
                      <div class="flex items-center justify-between mb-1">
                        <span class="text-xs text-slate-500">${metric.label ?? ''}</span>
                        ${trendIcon(metric.trend)}
                      </div>
                      <span class="text-sm font-semibold text-slate-900">${metric.value ?? ''}</span>
                    </div>
                  `).join('')}
                </div>
      
                <div class="flex gap-2 flex-wrap text-xs">
                  <span class="badge badge-outline">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    ${risks.length} Risks
                  </span>
                  <span class="badge badge-outline">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                    </svg>
                    ${opportunities.length} Opportunities
                  </span>
                </div>
              </div>
              ` : ''}
            </div>
          </div>
        `;
      },
      
      
    
      

    /**
     * Render comparison view
     */
    renderComparisonView(scenarios) {
        if (scenarios.length < 2) {
            return `
                <div class="bg-white rounded-lg shadow-md p-12 text-center">
                    <p class="text-slate-600">Select at least 2 scenarios to compare</p>
                </div>
            `;
        }

        const topScenario = scenarios.reduce((prev, current) => {
            const prevScore = (prev.aiAnalysis?.feasibility || 0) + (prev.aiAnalysis?.impact || 0);
            const currentScore = (current.aiAnalysis?.feasibility || 0) + (current.aiAnalysis?.impact || 0);
            return currentScore > prevScore ? current : prev;
        });

        return `
            <!-- Winner Card -->
            <div class="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-lg shadow-md border-2 border-violet-600 p-6 mb-6">
                <div class="flex items-center gap-2 mb-3">
                    <svg class="w-5 h-5 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                    <h2 class="text-xl font-bold text-slate-900">Recommended Scenario</h2>
                </div>
                <p class="text-sm text-slate-600 mb-4">Based on feasibility and impact analysis</p>
                <h3 class="text-lg font-bold text-slate-900 mb-2">${topScenario.name}</h3>
                <p class="text-slate-700 mb-4">${topScenario.description}</p>
                <div class="flex gap-4 text-sm">
                    <div class="flex items-center gap-2">
                        <span class="text-slate-600">Feasibility:</span>
                        <span class="badge badge-primary">${topScenario.aiAnalysis?.feasibility}%</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-slate-600">Impact:</span>
                        <span class="badge badge-primary">${topScenario.aiAnalysis?.impact}%</span>
                    </div>
                </div>
            </div>

            <!-- Comparison Table -->
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <div class="p-6 border-b border-slate-200">
                    <h2 class="text-xl font-bold text-slate-900">Side-by-Side Comparison</h2>
                    <p class="text-sm text-slate-600 mt-1">Detailed breakdown of each scenario</p>
                </div>
                <div class="overflow-x-auto">
                    <table class="comparison-table">
                        <thead>
                            <tr>
                                <th class="min-w-[150px]">Criteria</th>
                                ${scenarios.map(s => `
                                    <th class="min-w-[200px]">
                                        <div class="flex items-center gap-2">
                                            ${s.id === topScenario.id ? `
                                                <svg class="w-4 h-4 crown-icon" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                                </svg>
                                            ` : ''}
                                            <span>${s.name}</span>
                                        </div>
                                    </th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="font-medium text-slate-700">Feasibility</td>
                                ${scenarios.map(s => `
                                    <td>
                                        <div class="space-y-2">
                                            <span class="font-semibold text-slate-900">${s.aiAnalysis?.feasibility}%</span>
                                            <div class="progress-bar">
                                                <div class="progress-fill" style="width: ${s.aiAnalysis?.feasibility}%"></div>
                                            </div>
                                        </div>
                                    </td>
                                `).join('')}
                            </tr>
                            <tr>
                                <td class="font-medium text-slate-700">Impact</td>
                                ${scenarios.map(s => `
                                    <td>
                                        <div class="space-y-2">
                                            <span class="font-semibold text-slate-900">${s.aiAnalysis?.impact}%</span>
                                            <div class="progress-bar">
                                                <div class="progress-fill" style="width: ${s.aiAnalysis?.impact}%"></div>
                                            </div>
                                        </div>
                                    </td>
                                `).join('')}
                            </tr>
                            <tr>
                                <td class="font-medium text-slate-700">Target Market</td>
                                ${scenarios.map(s => `<td class="text-slate-700">${s.targetMarket}</td>`).join('')}
                            </tr>
                            <tr>
                                <td class="font-medium text-slate-700">Timeline</td>
                                ${scenarios.map(s => `<td class="text-slate-700">${s.timeline}</td>`).join('')}
                            </tr>
                            <tr>
                                <td class="font-medium text-slate-700">Key Risks</td>
                                ${scenarios.map(s => `
                                    <td>
                                        <ul class="space-y-1 text-sm text-slate-700">
                                            ${s.aiAnalysis?.risks.slice(0, 2).map(risk => `<li>• ${risk}</li>`).join('')}
                                        </ul>
                                    </td>
                                `).join('')}
                            </tr>
                            <tr>
                                <td class="font-medium text-slate-700">Opportunities</td>
                                ${scenarios.map(s => `
                                    <td>
                                        <ul class="space-y-1 text-sm text-slate-700">
                                            ${s.aiAnalysis?.opportunities.slice(0, 2).map(opp => `<li>• ${opp}</li>`).join('')}
                                        </ul>
                                    </td>
                                `).join('')}
                            </tr>
                            <tr>
                                <td class="font-medium text-slate-700">AI Recommendation</td>
                                ${scenarios.map(s => `<td class="text-sm text-slate-700">${s.aiAnalysis?.recommendation}</td>`).join('')}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * Render insights panel
     */
    renderInsightsPanel(scenarios) {
        if (scenarios.length === 0) {
            return `
                <div class="bg-white rounded-lg shadow-md p-12 text-center">
                    <p class="text-slate-600">Create scenarios to see AI-powered insights</p>
                </div>
            `;
        }

        const avgFeasibility = Math.round(scenarios.reduce((sum, s) => sum + (s.aiAnalysis?.feasibility || 0), 0) / scenarios.length);
        const avgImpact = Math.round(scenarios.reduce((sum, s) => sum + (s.aiAnalysis?.impact || 0), 0) / scenarios.length);

        const allRisks = scenarios.flatMap(s => s.aiAnalysis?.risks || []);
        const topRisks = [...new Set(allRisks)].slice(0, 5);

        const allOpportunities = scenarios.flatMap(s => s.aiAnalysis?.opportunities || []);
        const topOpportunities = [...new Set(allOpportunities)].slice(0, 5);

        const highPriority = scenarios.filter(s => (s.aiAnalysis?.feasibility || 0) > 75 && (s.aiAnalysis?.impact || 0) > 75);
        const mediumPriority = scenarios.filter(s => (s.aiAnalysis?.feasibility || 0) >= 60 && (s.aiAnalysis?.feasibility || 0) <= 75);

        return `
            <div class="space-y-6">
                <!-- Stats -->
                <div class="grid gap-6 md:grid-cols-3">
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <div class="text-sm font-medium text-slate-600 mb-2">Total Scenarios</div>
                        <div class="flex items-baseline gap-2">
                            <span class="text-3xl font-bold text-slate-900">${scenarios.length}</span>
                            <svg class="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <div class="text-sm font-medium text-slate-600 mb-2">Avg Feasibility</div>
                        <div class="flex items-baseline gap-2">
                            <span class="text-3xl font-bold text-slate-900">${avgFeasibility}%</span>
                            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <div class="text-sm font-medium text-slate-600 mb-2">Avg Impact</div>
                        <div class="flex items-baseline gap-2">
                            <span class="text-3xl font-bold text-slate-900">${avgImpact}%</span>
                            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Priority Breakdown -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <svg class="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                        Priority Breakdown
                    </h2>
                    <p class="text-sm text-slate-600 mb-4">Scenarios categorized by feasibility and impact</p>
                    <div class="space-y-4">
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                    <span class="badge badge-success">High Priority</span>
                                    <span class="text-sm text-slate-600">Feasibility > 75% & Impact > 75%</span>
                                </div>
                                <span class="font-semibold text-slate-900">${highPriority.length}</span>
                            </div>
                            ${highPriority.length > 0 ? `
                                <ul class="pl-6 space-y-1">
                                    ${highPriority.map(s => `<li class="text-sm text-slate-700">• ${s.name}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                    <span class="badge badge-warning">Medium Priority</span>
                                    <span class="text-sm text-slate-600">Feasibility 60-75%</span>
                                </div>
                                <span class="font-semibold text-slate-900">${mediumPriority.length}</span>
                            </div>
                            ${mediumPriority.length > 0 ? `
                                <ul class="pl-6 space-y-1">
                                    ${mediumPriority.map(s => `<li class="text-sm text-slate-700">• ${s.name}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Risks -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                        Common Risks Across Scenarios
                    </h2>
                    <p class="text-sm text-slate-600 mb-4">Most frequently identified challenges</p>
                    <ul class="space-y-2">
                        ${topRisks.map(risk => `
                            <li class="flex items-start gap-2 text-sm text-slate-700">
                                <span class="text-amber-600 mt-0.5">⚠</span>
                                <span>${risk}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <!-- Opportunities -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                        Strategic Opportunities
                    </h2>
                    <p class="text-sm text-slate-600 mb-4">Potential advantages identified by AI</p>
                    <ul class="space-y-2">
                        ${topOpportunities.map(opp => `
                            <li class="flex items-start gap-2 text-sm text-slate-700">
                                <span class="text-green-600 mt-0.5">✓</span>
                                <span>${opp}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <!-- Recommendations -->
                <div class="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-lg shadow-md border-2 border-violet-200 p-6">
                    <h2 class="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <svg class="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                        AI Strategic Recommendations
                    </h2>
                    <div class="space-y-3 text-slate-700">
                        ${highPriority.length > 0 ? `
                            <p><strong>Immediate Action:</strong> Focus on high-priority scenarios with strong feasibility and impact scores. 
                            Allocate primary resources to "${highPriority[0].name}" for maximum ROI.</p>
                        ` : `
                            <p><strong>Recommendation:</strong> Consider refining scenario assumptions or exploring alternative approaches to improve feasibility scores.</p>
                        `}
                        ${mediumPriority.length > 0 ? `
                            <p><strong>Validate & Iterate:</strong> Medium-priority scenarios should undergo user research and assumption testing before full commitment.</p>
                        ` : ''}
                        <p><strong>Risk Mitigation:</strong> Address common risks identified across scenarios to improve overall success probability.</p>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Show a toast notification
     */
    // --- replace your UI.showToast with this ---
    showToast(message, type = 'success') {
        // kill any existing toast so we never show both "Failed" and "Deleted"
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
    
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('role', 'status');
        toast.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            ${type === 'success'
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>'
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>'
            }
        </svg>
        <span>${message}</span>
        `;
        document.body.appendChild(toast);
    
        // auto-hide
        setTimeout(() => toast.remove(), 2200);
    }
  

    /* ========= NEW UI for Tasks + Sessions ========= */

    // Simple date/time helpers
    ,_fmtDateTime(iso) {
        const d = new Date(iso);
        return d.toLocaleString();
    },
    _dayKey(iso) {
        const d = new Date(iso);
        return [d.getFullYear(), String(d.getMonth()+1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
    },

    // Render Today's Work list
    renderTodayList(container, tasks = []) {
        container.innerHTML = '';
        if (!tasks.length) {
          container.innerHTML = '<li class="text-slate-500 text-sm">No tasks yet. Add one!</li>';
          return;
        }
        tasks.forEach(t => {
          const li = document.createElement('li');
          li.className = 'task-item py-2 border-b border-slate-100 last:border-0';
          li.innerHTML = `
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-slate-900 font-medium">${t.title || t.name || 'Untitled'}</div>
                ${t.details ? `<div class="text-sm text-slate-600">${t.details}</div>` : (t.description ? `<div class="text-sm text-slate-600">${t.description}</div>` : '')}
              </div>
              <div class="flex items-center gap-3">
                <button class="text-xs text-red-600 hover:underline" data-action="delete-task" data-id="${t.id}">Delete</button>
                <div class="text-xs text-slate-500 whitespace-nowrap">${this._fmtDateTime(t.created_at || t.createdAt)}</div>
              </div>
            </div>
          `;
          container.appendChild(li);
        });
      },
      
      

    // Group tasks by day within a session
    _groupTasksByDay(tasks = []) {
        const map = {};
        for (const t of tasks) {
            const key = this._dayKey(t.created_at);
            if (!map[key]) map[key] = [];
            map[key].push(t);
        }
        return map;
    },

    // Render Task History with sessions, each grouped by task day (newest day first)
    renderHistoryGrouped(container, groupsObj) {
        if (!container) return;
        container.innerHTML = '';
    
        // groupsObj is expected like: { "YYYY-MM-DD": [taskRow, ...], ... }
        const dates = Object.keys(groupsObj || {});
        if (!dates.length) {
            container.innerHTML = `
              <div class="text-sm text-slate-500 bg-white border border-slate-200 rounded-lg p-6">
                No past sessions yet.
              </div>`;
            return;
        }
    
        // Newest date first
        dates.sort((a, b) => (a < b ? 1 : -1));
    
        const sections = dates.map(dateKey => {
            const rows = Array.isArray(groupsObj[dateKey]) ? groupsObj[dateKey] : [];
            const normalized = rows.map(normalizeTask);
            const inner = normalized.map(t => this.renderScenarioCard(t, false)).join('');
            return `
              <div class="bg-white rounded-lg border border-slate-200">
                <div class="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-slate-700">${dateKey}</h3>
                  <span class="text-xs text-slate-500">${normalized.length} item(s)</span>
                </div>
                <div class="p-4 grid gap-4 md:grid-cols-2">
                  ${inner}
                </div>
              </div>
            `;
        });
    
        container.innerHTML = sections.join('');
    },
    
};

// Export for tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}
