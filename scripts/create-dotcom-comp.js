const fs = require('fs');
const uri = fs.readFileSync('.env.local', 'utf8').split('\n').find(l => l.startsWith('MONGODB_URI=')).split('=').slice(1).join('=');
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // Get Jordan and Riley's userIds
  const jordan = await db.collection('portfolios').findOne({ username: 'Jordan' });
  const riley = await db.collection('portfolios').findOne({ username: 'Riley' });
  if (!jordan || !riley) { console.log('Could not find Jordan/Riley portfolios'); return; }

  const startingCash = 10000;
  const totalDays = 7;

  // Jordan: defensive — heavy safety, consumer staples, healthcare (wins during dot-com crash)
  const jordanHoldings = [
    { assetId: 'treasury', assetType: 'safety', amount: 3000 },
    { assetId: 'consumer-staples', assetType: 'sector', amount: 2500 },
    { assetId: 'healthcare', assetType: 'sector', amount: 2000 },
    { assetId: 'risk-parity', assetType: 'strategy', amount: 1500 },
    { assetId: 'energy', assetType: 'sector', amount: 1000 },
  ];

  // Riley: aggressive tech — gets crushed in dot-com burst
  const rileyHoldings = [
    { assetId: 'tech', assetType: 'sector', amount: 3000 },
    { assetId: 'ai-robotics', assetType: 'sector', amount: 2500 },
    { assetId: 'semiconductors', assetType: 'sector', amount: 2000 },
    { assetId: 'momentum', assetType: 'strategy', amount: 1500 },
    { assetId: 'cybersecurity', assetType: 'sector', amount: 1000 },
  ];

  // Simulate the full 7-day competition using getDayMultiplier logic
  // Dot-com 1w returns by category:
  // techGrowth: -8%, finance: -3%, energy: +1%, healthcare: -2%,
  // consumerDef: 0%, consumerCyc: -5%, stratAggressive: -10%, stratModerate: -4%, stratDefensive: -1%,
  // safety: +0.3%

  // Category mapping
  const catMap = {
    'treasury': 'safety', 'consumer-staples': 'consumerDef', 'healthcare': 'healthcare',
    'risk-parity': 'stratDefensive', 'energy': 'energy',
    'tech': 'techGrowth', 'ai-robotics': 'techGrowth', 'semiconductors': 'techGrowth',
    'momentum': 'stratAggressive', 'cybersecurity': 'techGrowth'
  };

  const totalReturns = {
    techGrowth: -0.08, finance: -0.03, energy: 0.01, healthcare: -0.02,
    consumerDef: 0, consumerCyc: -0.05, stratAggressive: -0.10, stratModerate: -0.04,
    stratDefensive: -0.01, safety: 0.003, cash: 0.0002
  };

  // Shape: dotcom uses "slowStart" for tech, "gradual" for most others
  const shapeMap = {
    techGrowth: 'slowStart', finance: 'gradual', energy: 'gradual',
    healthcare: 'gradual', consumerDef: 'gradual', consumerCyc: 'slowStart',
    stratAggressive: 'slowStart', stratModerate: 'gradual', stratDefensive: 'gradual',
    safety: 'gradual', cash: 'gradual'
  };

  const shapes = {
    slowStart: [[0,0],[0.3,0.08],[0.5,0.2],[0.7,0.55],[0.85,0.82],[1,1]],
    gradual: [[0,0],[0.25,0.25],[0.5,0.5],[0.75,0.75],[1,1]],
  };

  function interpolate(shape, t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    for (let i = 1; i < shape.length; i++) {
      if (t <= shape[i][0]) {
        const [t0, v0] = shape[i - 1];
        const [t1, v1] = shape[i];
        return v0 + (v1 - v0) * ((t - t0) / (t1 - t0));
      }
    }
    return 1;
  }

  function getDayMult(assetId, day) {
    const cat = catMap[assetId];
    const totalRet = totalReturns[cat] || 0;
    if (totalRet === 0) return 1;
    const shapeName = shapeMap[cat] || 'gradual';
    const shape = shapes[shapeName] || shapes.gradual;
    const prevCum = 1 + totalRet * interpolate(shape, (day - 1) / totalDays);
    const currCum = 1 + totalRet * interpolate(shape, day / totalDays);
    return prevCum !== 0 ? currCum / prevCum : 1;
  }

  // Simulate day by day with 1440 intervals per day
  const INTERVALS_PER_DAY = 1440;
  const jHoldings = jordanHoldings.map(h => ({ ...h }));
  const rHoldings = rileyHoldings.map(h => ({ ...h }));
  const jHistory = [{ day: 0, value: startingCash }];
  const rHistory = [{ day: 0, value: startingCash }];

  for (let day = 0; day < totalDays; day++) {
    const applyDay = day + 1;
    // Apply returns in bulk (multiply by full day multiplier)
    for (const h of jHoldings) {
      const mult = getDayMult(h.assetId, applyDay);
      h.amount = Math.round(h.amount * mult * 100) / 100;
    }
    for (const h of rHoldings) {
      const mult = getDayMult(h.assetId, applyDay);
      h.amount = Math.round(h.amount * mult * 100) / 100;
    }

    const jVal = Math.round(jHoldings.reduce((s, h) => s + h.amount, 0) * 100) / 100;
    const rVal = Math.round(rHoldings.reduce((s, h) => s + h.amount, 0) * 100) / 100;
    jHistory.push({ day: applyDay, value: jVal });
    rHistory.push({ day: applyDay, value: rVal });
  }

  console.log('Jordan final:', jHistory[jHistory.length - 1]);
  console.log('Riley final:', rHistory[rHistory.length - 1]);

  // Competition started 8 days ago (completed 1 day ago)
  const startedAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

  const comp = {
    type: 'historical',
    scenario: 'dotcom-bubble',
    name: 'Dot-com Bubble Burst',
    description: 'Relive the infamous dot-com crash of March 2000. The NASDAQ lost 78% as internet hype collapsed. Can you protect your portfolio when the bubble pops?',
    timeframe: '1w',
    startingCash,
    currentDay: totalDays,
    currentInterval: 0,
    totalDays,
    startedAt,
    createdBy: jordan.userId,
    isGlobal: false,
    inviteCode: 'DOTCOM',
    status: 'completed',
    participants: [
      {
        userId: jordan.userId,
        username: 'Jordan',
        joinedAt: startedAt,
        cash: 0,
        holdings: jHoldings,
        valueHistory: jHistory,
      },
      {
        userId: riley.userId,
        username: 'Riley',
        joinedAt: startedAt,
        cash: 0,
        holdings: rHoldings,
        valueHistory: rHistory,
      },
    ],
    createdAt: startedAt,
    updatedAt: new Date(),
  };

  const result = await db.collection('competitions').insertOne(comp);
  console.log('Created competition:', result.insertedId.toString());
  console.log('Jordan wins:', jHistory[jHistory.length-1].value > rHistory[rHistory.length-1].value);

  await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
