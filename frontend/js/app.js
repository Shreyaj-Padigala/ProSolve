/**
 * Main Application Logic
 */

// Application State
const AppState = {
    scenarios: [],              // today
    selectedScenarios: [],
    currentTab: 'overview',
    todayTasks: [],
    sessions: [],               // (not used now, but kept)
    historyTasksFlat: [],       // <— NEW: flattened list of *all* history tasks
  };
  

  function normalizeTask(t) {
    const isDB = Object.prototype.hasOwnProperty.call(t, "target_market") || Object.prototype.hasOwnProperty.call(t, "created_at");
    const dbId = (isDB ? t.id : null);
  
    const aiRaw = (isDB ? t.ai_analysis : t.aiAnalysis) || {};
    return {
      // if it’s from DB use the real id; otherwise let client items fall back
      id: dbId != null ? String(dbId) : String(t.id ?? Date.now()),
      name: t.name,
      description: t.description,
      targetMarket: isDB ? t.target_market : t.targetMarket,
      timeline: t.timeline,
      resources: t.resources ?? null,
      assumptions: t.assumptions ?? [],
      createdAt: t.created_at || t.createdAt || new Date().toISOString(),
      aiAnalysis: {
        feasibility: aiRaw.feasibility ?? 0,
        impact: aiRaw.impact ?? 0,
        risks: Array.isArray(aiRaw.risks) ? aiRaw.risks : [],
        opportunities: Array.isArray(aiRaw.opportunities) ? aiRaw.opportunities : [],
        recommendation: aiRaw.recommendation ?? "",
        keyMetrics: Array.isArray(aiRaw.keyMetrics) ? aiRaw.keyMetrics : [],
        aiReasons: aiRaw.aiReasons || aiRaw.reasons || null,
        aiRecommendationFull: aiRaw.aiRecommendationFull || aiRaw.recommendation || null,
        aiRaw
      }
    };
  }
  
  // ---------- Deletion + Delegated Click Helpers ----------
async function handleDelete(taskId) {
    try {
      await API.deleteTask(Number(taskId));
      AppState.selectedScenarios = AppState.selectedScenarios.filter(id => id !== String(taskId));
      await refreshTasksAndHistory();
      UI?.showToast && UI.showToast('Task deleted', 'success');
    } catch (e) {
      console.error(e);
      UI?.showToast && UI.showToast('Failed to delete task', 'error');
    }
  }
  
  /**
   * Delegate clicks for:
   *  - selecting a card via .custom-checkbox
   *  - deleting a task via .delete-task
   * Works for both Today and History grids.
   */
  function delegateCardClicks(containerEl) {
    if (!containerEl) return;
  
    containerEl.addEventListener('click', async (e) => {
      // Toggle select
      const checkbox = e.target.closest('.custom-checkbox');
      if (checkbox && checkbox.dataset.scenarioId) {
        toggleScenarioSelection(String(checkbox.dataset.scenarioId));
        return;
      }
  
      // Delete task
      const delBtn = e.target.closest('.delete-task');
      if (delBtn && delBtn.dataset.taskId) {
        e.preventDefault();
        if (confirm('Delete this task?')) {
          await handleDelete(delBtn.dataset.taskId);
        }
      }
    });
  }
  

  
// DOM Elements - will be initialized in init()
let elements = {};

// Initialize DOM elements
function initializeElements() {
    console.log('🔍 Initializing DOM elements...');
    
    elements = {
        newScenarioBtn: document.getElementById('new-scenario-btn'),
        emptyCreateBtn: document.getElementById('empty-create-btn'),
        scenarioCreator: document.getElementById('scenario-creator'),
        closeCreatorBtn: document.getElementById('close-creator-btn'),
        cancelFormBtn: document.getElementById('cancel-form-btn'),
        scenarioForm: document.getElementById('scenario-form'),
        addAssumptionBtn: document.getElementById('add-assumption-btn'),
        assumptionsContainer: document.getElementById('assumptions-container'),
        emptyState: document.getElementById('empty-state'),
        tabsNavigation: document.getElementById('tabs-navigation'),
        tabContent: document.getElementById('tab-content'),
        scenariosGrid: document.getElementById('scenarios-grid'),
        selectionBanner: document.getElementById('selection-banner'),
        selectionCount: document.getElementById('selection-count'),
        compareSelectedBtn: document.getElementById('compare-selected-btn'),
        clearSelectionBtn: document.getElementById('clear-selection-btn'),
        compareCount: document.getElementById('compare-count'),
        compareTab: document.getElementById('compare-tab'),
        loadingOverlay: document.getElementById('loading-overlay'),

        // NEW
        todayTaskList: document.getElementById('today-task-list'),
        historyContainer: document.getElementById('history-container'),
        archiveTodayBtn: document.getElementById('archive-today-btn'),
    };
    
    const foundCount = Object.keys(elements).filter(k => elements[k] !== null).length;
    console.log(`✅ DOM elements initialized: ${foundCount}/${Object.keys(elements).length} found`);
    
    if (!elements.newScenarioBtn) {
        const btn = document.querySelector('#new-scenario-btn');
        if (btn) elements.newScenarioBtn = btn;
    }
    if (!elements.emptyCreateBtn) {
        const btn = document.querySelector('#empty-create-btn');
        if (btn) elements.emptyCreateBtn = btn;
    }
}

// Initialize the application
async function init() {
    initializeElements();
    setupEventListeners();
    updateUI();
    await refreshTasksAndHistory();   // <— ensure this is here
    checkBackendStatus().catch(() => {});
  }
  

// Check backend status and show indicator
async function checkBackendStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            const health = await response.json();
            if (health.llm_provider && health.llm_provider !== 'mock') {
                showBackendStatus('connected', `Connected to ${health.llm_provider} (${health.llm_model})`);
            } else {
                showBackendStatus('mock', 'Using mock data - Backend not configured');
            }
        }
    } catch (error) {
        console.warn('Backend not reachable:', error);
        showBackendStatus('disconnected', 'Backend not reachable - Using mock data');
    }
}

function showBackendStatus(status, message) {
    const existing = document.getElementById('backend-status');
    if (existing) existing.remove();
    
    const statusEl = document.createElement('div');
    statusEl.id = 'backend-status';
    statusEl.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-sm z-50 ${
        status === 'connected' ? 'bg-green-100 text-green-800 border border-green-300' :
        status === 'mock' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
        'bg-red-100 text-red-800 border border-red-300'
    }`;
    statusEl.innerHTML = `
        <div class="flex items-center gap-2">
            <span>${status === 'connected' ? '✅' : status === 'mock' ? '⚠️' : '❌'}</span>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(statusEl);
    
    if (status === 'connected') {
        setTimeout(() => {
            if (statusEl.parentNode) {
                statusEl.style.opacity = '0';
                statusEl.style.transition = 'opacity 0.5s';
                setTimeout(() => statusEl.remove(), 500);
            }
        }, 5000);
    }
}

// Setup all event listeners
// Setup all event listeners
function setupEventListeners() {
    if (elements.newScenarioBtn) elements.newScenarioBtn.addEventListener('click', showCreator);
    if (elements.emptyCreateBtn) elements.emptyCreateBtn.addEventListener('click', showCreator);
    if (elements.closeCreatorBtn) elements.closeCreatorBtn.addEventListener('click', hideCreator);
    if (elements.cancelFormBtn) elements.cancelFormBtn.addEventListener('click', hideCreator);
  
    if (elements.scenarioForm) elements.scenarioForm.addEventListener('submit', handleFormSubmit);
    if (elements.addAssumptionBtn) elements.addAssumptionBtn.addEventListener('click', addAssumptionInput);
  
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(btn.dataset.tab);
    }));
  
    if (elements.compareSelectedBtn) elements.compareSelectedBtn.addEventListener('click', () => switchTab('compare'));
    if (elements.clearSelectionBtn) elements.clearSelectionBtn.addEventListener('click', clearSelection);
  
    // 🔁 Use delegated click handling for both Today and History areas:
    //    - selection via .custom-checkbox
    //    - deletion via .delete-task
    delegateCardClicks(document.getElementById('scenarios-grid'));   // Today list container
    delegateCardClicks(document.getElementById('history-groups'));   // History container
  
    // Archive today's tasks
    if (elements.archiveTodayBtn) {
      elements.archiveTodayBtn.addEventListener('click', async () => {
        const name = prompt('Session name?', 'Saved Session');
        try {
          await API.archiveCurrentTasks({ name: name || 'Saved Session' });
          UI.showToast('Saved current tasks into a session', 'success');
          await refreshTasksAndHistory();
        } catch (err) {
          console.error(err);
          UI.showToast('Failed to archive tasks', 'error');
        }
      });
    }
    // 1) Delete buttons (works in both Today and History)
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="delete-task"]');
    if (!btn) return;
  
    const id = btn.getAttribute('data-id');
    if (!id) return;
  
    if (!confirm('Delete this task? This cannot be undone.')) return;
  
    try {
      const ok = await API.deleteScenario(id);
      if (!ok) throw new Error('Delete failed');
      UI.showToast('Deleted', 'success');
      await refreshTasksAndHistory();
    } catch (err) {
      console.error(err);
      UI.showToast('Failed to delete', 'error');
    }
  });
  
  // 2) Selection inside history cards
  const historyContainer = document.getElementById('history-groups');
  if (historyContainer) {
    historyContainer.addEventListener('click', (e) => {
      const checkbox = e.target.closest('.custom-checkbox');
      if (!checkbox) return;
      const sid = checkbox.dataset.scenarioId;
      if (!sid) return;
  
      // toggle selected IDs
      const i = AppState.selectedScenarios.indexOf(sid);
      if (i > -1) AppState.selectedScenarios.splice(i, 1);
      else AppState.selectedScenarios.push(sid);
  
      updateUI();
    });
  }
  
  }
  

// Expose function globally IMMEDIATELY (before it's defined)
window.showCreatorForm = null; // Will be set below

// Show scenario creator
function showCreator(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    let form = document.getElementById('scenario-creator') || document.querySelector('#scenario-creator');
    if (!form) return alert('Error: Could not find the scenario form. Please refresh the page.');
    form.classList.remove('hidden');
    form.style.display = 'block';
    form.style.visibility = 'visible';
    form.style.opacity = '1';
    elements.scenarioCreator = form;
    setTimeout(() => { try { form.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch {} }, 100);
}

// Expose function globally for inline onclick handlers
window.showCreatorForm = showCreator;
(function(){ window.showCreatorForm = showCreator; })();

// Hide scenario creator
function hideCreator() {
    if (elements.scenarioCreator) elements.scenarioCreator.classList.add('hidden');
    if (elements.scenarioForm) elements.scenarioForm.reset();
    if (elements.assumptionsContainer) {
        elements.assumptionsContainer.innerHTML = `
            <div class="assumption-input flex gap-2">
                <input type="text" class="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-transparent text-slate-900 bg-white"
                       placeholder="e.g., Users will adopt new feature within 30 days">
            </div>
        `;
    }
}

// Add assumption input field
function addAssumptionInput() {
    const newInput = document.createElement('div');
    newInput.className = 'assumption-input flex gap-2';
    newInput.innerHTML = `
        <input type="text" class="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-transparent text-slate-900 bg-white"
               placeholder="e.g., Users will adopt new feature within 30 days">
        <button type="button" class="remove-assumption px-3 text-slate-400 hover:text-slate-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    `;
    newInput.querySelector('.remove-assumption').addEventListener('click', function() { newInput.remove(); });
    elements.assumptionsContainer.appendChild(newInput);
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
  
    const formData = {
      name: document.getElementById('scenario-name').value,
      description: document.getElementById('description').value,
      targetMarket: document.getElementById('target-market').value,
      timeline: document.getElementById('timeline').value,
      resources: document.getElementById('resources').value || null,
      assumptions: []
    };
  
    // Gather assumptions
    if (elements.assumptionsContainer) {
      const inputs = elements.assumptionsContainer.querySelectorAll('input');
      inputs.forEach(input => {
        const v = input.value.trim();
        if (v) formData.assumptions.push(v);
      });
    }
  
    // Show loading
    elements.loadingOverlay?.classList.remove('hidden');
  
    try {
      // 1) Get AI analysis
      const analyzed = await API.analyzeScenario(formData);
  
      // 2) Persist to DB with required field names/aliases
      await API.createTask({
        name: analyzed.name,
        description: analyzed.description,
        targetMarket: analyzed.targetMarket,
        timeline: analyzed.timeline,
        resources: analyzed.resources,
        assumptions: analyzed.assumptions,
        aiAnalysis: analyzed.aiAnalysis,
        createdAt: analyzed.createdAt,
      });
  
      // 3) Refresh Today's and History
      await refreshTasksAndHistory();
  
      // UI updates
      hideCreator();
      UI?.showToast && UI.showToast('Task created & saved!', 'success');
    } catch (error) {
      console.error(error);
      UI?.showToast && UI.showToast('Error creating task', 'error');
    } finally {
      elements.loadingOverlay?.classList.add('hidden');
    }
  }
  

// Toggle scenario selection
function toggleScenarioSelection(scenarioId) {
    const index = AppState.selectedScenarios.indexOf(scenarioId);
    if (index > -1) AppState.selectedScenarios.splice(index, 1);
    else AppState.selectedScenarios.push(scenarioId);
    updateUI();
}

// Clear selection
function clearSelection() {
    AppState.selectedScenarios = [];
    updateUI();
}

// Switch tabs
function switchTab(tabName) {
    AppState.currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) btn.classList.add('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active'); content.classList.add('hidden');
    });
    const activeContent = document.getElementById(`${tabName}-content`);
    if (activeContent) { activeContent.classList.remove('hidden'); activeContent.classList.add('active'); }
    if (tabName === 'compare') renderComparisonView();
    else if (tabName === 'insights') renderInsightsView();
}

// Update the entire UI
function updateUI() {
    const hasScenarios = AppState.scenarios.length > 0;
  
    if (elements.emptyState) elements.emptyState.classList.toggle('hidden', hasScenarios);
    if (elements.tabsNavigation) elements.tabsNavigation.classList.toggle('hidden', !hasScenarios);
  
    // ❗️Always clear the grid first
    if (elements.scenariosGrid) elements.scenariosGrid.innerHTML = '';
  
    if (hasScenarios) {
      renderScenarios();
      updateSelectionUI();
      if (AppState.currentTab === 'compare') renderComparisonView();
      else if (AppState.currentTab === 'insights') renderInsightsView();
    }
  
    if (elements.todayTaskList) UI.renderTodayList(elements.todayTaskList, AppState.todayTasks);
    if (elements.historyContainer) UI.renderHistoryGrouped(elements.historyContainer, AppState.sessions);
  }
  

// Render scenarios grid (existing cards)
function renderScenarios() {
    if (!elements.scenariosGrid) return;
    elements.scenariosGrid.innerHTML = AppState.scenarios
        .map(scenario => UI.renderScenarioCard(scenario, AppState.selectedScenarios.includes(scenario.id)))
        .join('');
}

// Update selection UI
function updateSelectionUI() {
    const count = AppState.selectedScenarios.length;
    if (elements.selectionBanner) elements.selectionBanner.classList.toggle('hidden', count === 0);
    if (elements.selectionCount) elements.selectionCount.textContent = count;
    if (elements.compareSelectedBtn) elements.compareSelectedBtn.classList.toggle('hidden', count < 2);
    if (elements.compareCount) elements.compareCount.textContent = count;
    if (elements.compareTab) {
        elements.compareTab.disabled = count < 2;
        if (count < 2) elements.compareTab.classList.add('opacity-50', 'cursor-not-allowed');
        else elements.compareTab.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// Render comparison view
function renderComparisonView() {
    const pool = [...AppState.scenarios, ...AppState.historyTasksFlat];
    const selected = pool.filter(s => AppState.selectedScenarios.includes(s.id));
    const compareContent = document.getElementById('compare-content');
    if (compareContent) compareContent.innerHTML = UI.renderComparisonView(selected);
  }
  

// Render insights view
function renderInsightsView() {
    const insightsContent = document.getElementById('insights-content');
    if (insightsContent) insightsContent.innerHTML = UI.renderInsightsPanel(AppState.scenarios);
}

// Fetch Today + History from backend and render
async function refreshTasksAndHistory() {
    try {
      // Today (DB rows -> normalized)
      const todayRows = await API.getTodayTasks();
      const today = (todayRows || []).map(normalizeTask);
  
      AppState.scenarios = today;
      if (elements.todayTaskList) UI.renderTodayList(elements.todayTaskList, today);
      const todayEmpty = document.getElementById('today-empty');
      if (todayEmpty) todayEmpty.classList.toggle('hidden', today.length > 0);
  
      // History groups: { groups: { 'YYYY-MM-DD': [rows...] } }
      const { groups } = await API.getHistoryGroups();
  
      // Build history DOM + flat cache
      const historyContainer = document.getElementById('history-groups');
      AppState.historyTasksFlat = []; // reset
  
      if (!groups || Object.keys(groups).length === 0) {
        if (historyContainer) {
          historyContainer.innerHTML = `<div class="text-sm text-slate-500 bg-white border border-slate-200 rounded-lg p-6">No past sessions yet.</div>`;
        }
      } else {
        if (historyContainer) {
          historyContainer.innerHTML = Object.entries(groups).map(([date, tasks]) => {
            const normalized = tasks.map(normalizeTask);
            // store into flat cache for compare/selection
            AppState.historyTasksFlat.push(...normalized);
  
            return `
              <div class="bg-white rounded-lg border border-slate-200">
                <div class="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-slate-700">${date}</h3>
                  <span class="text-xs text-slate-500">${normalized.length} item(s)</span>
                </div>
                <div class="p-4 grid gap-4 md:grid-cols-2">
                  ${normalized.map(t => UI.renderScenarioCard(t, AppState.selectedScenarios.includes(t.id))).join('')}
                </div>
              </div>
            `;
          }).join('');
        }
      }
  
      // Re-render the main UI (keeps counts, compare/insights awareness)
      updateUI();
    } catch (err) {
      console.error('Failed to load tasks/sessions:', err);
    }
  }
  
  
  
  

// Start the application when DOM is ready
function startApp() {
    setTimeout(() => {
        try { init(); } catch (error) { console.error('❌ Error during initialization:', error); }
    }, 100);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

// Global click delegation for delete + select in both Today and History
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="delete-task"]');
    if (!btn) return;
  
    const idStr = btn.getAttribute('data-id');
    const idNum = Number(idStr);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      UI.showToast('Delete failed: invalid task id', 'error');
      return;
    }
  
    if (!confirm('Delete this task?')) return;
  
    try {
      const ok = await API.deleteScenario(idNum);
      if (!ok) throw new Error('Delete failed');
  
      // ✅ Optimistic local removal so the card disappears right away
      AppState.scenarios = AppState.scenarios.filter(s => String(s.id) !== String(idNum));
      updateUI();
  
      // Then fetch clean state from server (today + history)
      await refreshTasksAndHistory();
  
      UI.showToast('Deleted', 'success');
    } catch (err) {
      console.error(err);
      UI.showToast('Failed to delete', 'error');
    }
  });
  
  