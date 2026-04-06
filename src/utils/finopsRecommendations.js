/**
 * Recommandations FinOps dérivées des projets (budget, consommé, avancement).
 * Les économies estimées sont des ordres de grandeur pour la priorisation (pas de facturation réelle).
 */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function estimateSavingsOverrun(consumed, budget) {
  const overrun = consumed - budget * 0.78;
  return clamp(Math.round(Math.max(0, overrun) * 0.22 + budget * 0.04), 90, 2800);
}

function estimateSavingsWarning(budget) {
  return clamp(Math.round(budget * 0.055), 70, 900);
}

function estimateDeliveryLeak(consumed, budget, progress) {
  const expectedSpend = (budget * progress) / 100;
  const leak = consumed - expectedSpend;
  return clamp(Math.round(Math.max(0, leak) * 0.18), 55, 1400);
}

function estimateGreenSavings(consumed) {
  return clamp(Math.round(consumed * 0.045), 50, 520);
}

function estimatePortfolioSavings(totalBudget, totalConsumed) {
  const pressure = totalConsumed / totalBudget;
  return clamp(Math.round(totalBudget * Math.max(0, pressure - 0.52) * 0.14), 100, 3200);
}

/**
 * @param {Array<object>} projects
 * @returns {Array<{ id: string, type: string, priority: string, savings: number, titleKey: string, descKey: string, titleVars: object, descVars: object }>}
 */
export function buildFinOpsRecommendationsFromProjects(projects) {
  if (!Array.isArray(projects) || projects.length === 0) {
    return [];
  }

  const recs = [];
  const seen = new Set();

  const push = (rec) => {
    if (seen.has(rec.id)) return;
    seen.add(rec.id);
    recs.push(rec);
  };

  let totalBudget = 0;
  let totalConsumed = 0;

  for (const p of projects) {
    const budget = Number(p.budget) || 0;
    const consumed = Number(p.consumed) || 0;
    const progress = clamp(Number(p.progress) || 0, 0, 100);
    const name = String(p.name || '').trim() || '—';
    const status = p.status || 'active';
    const id = p.id;

    totalBudget += budget;
    totalConsumed += consumed;

    if (budget <= 0) continue;

    const ratio = consumed / budget;
    const pct = Math.round(ratio * 100);
    const remaining = Math.max(0, budget - consumed);

    if (ratio >= 0.88) {
      push({
        id: `finops-budget-critical-${id}`,
        type: 'cost',
        priority: 'high',
        savings: estimateSavingsOverrun(consumed, budget),
        titleKey: 'finops.dyn.budgetCriticalTitle',
        descKey: 'finops.dyn.budgetCriticalDesc',
        titleVars: { name },
        descVars: { name, pct },
        amounts: { consumed, budget },
      });
    } else if (ratio >= 0.62) {
      push({
        id: `finops-budget-warn-${id}`,
        type: 'cost',
        priority: 'medium',
        savings: estimateSavingsWarning(budget),
        titleKey: 'finops.dyn.budgetWarnTitle',
        descKey: 'finops.dyn.budgetWarnDesc',
        titleVars: { name },
        descVars: { name, pct },
        amounts: { consumed, budget },
      });
    }

    if (status === 'active' && progress < 98) {
      const spendPct = ratio * 100;
      if (spendPct > progress + 14) {
        const gap = Math.round(spendPct - progress);
        push({
          id: `finops-delivery-${id}`,
          type: 'cost',
          priority: gap > 22 ? 'high' : 'medium',
          savings: estimateDeliveryLeak(consumed, budget, progress),
          titleKey: 'finops.dyn.deliveryTitle',
          descKey: 'finops.dyn.deliveryDesc',
          titleVars: { name },
          descVars: { name, progress, spend: Math.round(spendPct), gap },
        });
      }
    }

    if (status === 'active' && ratio >= 0.78 && ratio < 0.88) {
      push({
        id: `finops-green-${id}`,
        type: 'green',
        priority: 'medium',
        savings: estimateGreenSavings(consumed),
        titleKey: 'finops.dyn.greenTitle',
        descKey: 'finops.dyn.greenDesc',
        titleVars: { name },
        descVars: { name, pct },
      });
    }

    if (status === 'completed' && ratio <= 0.96 && remaining >= 800) {
      push({
        id: `finops-complete-${id}`,
        type: 'cost',
        priority: 'low',
        savings: clamp(Math.round(remaining * 0.35), 40, 800),
        titleKey: 'finops.dyn.surplusTitle',
        descKey: 'finops.dyn.surplusDesc',
        titleVars: { name },
        descVars: { name, pct },
        amounts: { consumed, budget },
        remaining,
      });
    }

    if (status === 'active' && ratio < 0.38 && progress < 35) {
      push({
        id: `finops-idle-${id}`,
        type: 'cost',
        priority: 'low',
        savings: clamp(Math.round(budget * 0.035), 45, 500),
        titleKey: 'finops.dyn.idleTitle',
        descKey: 'finops.dyn.idleDesc',
        titleVars: { name },
        descVars: { name, progress, pct },
      });
    }
  }

  if (totalBudget > 0 && projects.length > 0) {
    const pr = totalConsumed / totalBudget;
    const portfolioPct = Math.round(pr * 100);
    if (pr >= 0.62) {
      push({
        id: 'finops-portfolio',
        type: 'cost',
        priority: portfolioPct >= 88 ? 'high' : portfolioPct >= 75 ? 'medium' : 'low',
        savings: estimatePortfolioSavings(totalBudget, totalConsumed),
        titleKey: 'finops.dyn.portfolioTitle',
        descKey: 'finops.dyn.portfolioDesc',
        titleVars: {},
        descVars: { pct: portfolioPct, n: projects.length },
      });
    }
  }

  const priorityRank = { high: 3, medium: 2, low: 1 };
  recs.sort((a, b) => {
    const pr = priorityRank[b.priority] - priorityRank[a.priority];
    if (pr !== 0) return pr;
    return b.savings - a.savings;
  });

  return recs.slice(0, 8);
}

export function deriveGreenKpisFromProjects(projects) {
  if (!Array.isArray(projects) || projects.length === 0) {
    return { energyEfficiency: 78, renewableEnergy: 58 };
  }
  let sumRatio = 0;
  let n = 0;
  for (const p of projects) {
    const b = Number(p.budget) || 0;
    if (b <= 0) continue;
    sumRatio += (Number(p.consumed) || 0) / b;
    n += 1;
  }
  const avgRatio = n ? sumRatio / n : 0.55;
  const energyEfficiency = Math.round(clamp(94 - avgRatio * 38, 44, 97));
  const renewableEnergy = Math.round(clamp(78 - (avgRatio - 0.52) * 45, 35, 88));
  return { energyEfficiency, renewableEnergy };
}

export function scaleCloudRow(row, portfolioRatio) {
  const p = clamp(portfolioRatio, 0.35, 0.98);
  const scale = 0.88 + p * 0.2;
  return {
    cpu: Math.max(8, Math.round(row.cpu * scale)),
    storage: Math.max(8, Math.round(row.storage * (0.95 + p * 0.1))),
    network: Math.max(8, Math.round(row.network * scale)),
    cost: Math.round(row.cost * (0.9 + p * 0.22)),
  };
}
