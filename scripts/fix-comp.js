const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const mongoLine = envFile.split('\n').find(l => l.startsWith('MONGODB_URI='));
const MONGODB_URI = mongoLine.split('=').slice(1).join('=');

const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const comp = await db.collection('competitions').findOne({ inviteCode: 'DEMO1M' });
  if (!comp) { console.log('Competition not found'); return; }

  console.log('Found:', comp.name);
  console.log('Starting cash:', comp.startingCash);

  // Set startedAt to 13 days ago
  const thirteenDaysAgo = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
  const startingCash = comp.startingCash; // $10,000

  // Jordan: diversified, cash=0, all invested
  // Riley: aggressive tech, cash=0, all invested
  const participants = comp.participants.map(p => {
    if (p.username === 'Jordan') {
      return {
        ...p,
        cash: 0,
        holdings: [
          { assetId: 'tech', assetType: 'sector', amount: 2500 },
          { assetId: 'healthcare', assetType: 'sector', amount: 2000 },
          { assetId: 'consumer-staples', assetType: 'sector', amount: 1500 },
          { assetId: 'risk-parity', assetType: 'strategy', amount: 2000 },
          { assetId: 'treasury', assetType: 'safety', amount: 2000 },
        ],
        valueHistory: [{ day: 0, value: startingCash }]
      };
    } else {
      // Riley: aggressive
      return {
        ...p,
        cash: 0,
        holdings: [
          { assetId: 'ai-robotics', assetType: 'sector', amount: 3000 },
          { assetId: 'semiconductors', assetType: 'sector', amount: 3000 },
          { assetId: 'momentum', assetType: 'strategy', amount: 2500 },
          { assetId: 'cybersecurity', assetType: 'sector', amount: 1500 },
        ],
        valueHistory: [{ day: 0, value: startingCash }]
      };
    }
  });

  await db.collection('competitions').updateOne(
    { _id: comp._id },
    { $set: {
      startedAt: thirteenDaysAgo,
      currentDay: 0,
      currentInterval: 0,
      status: 'active',
      participants
    }}
  );

  console.log('Updated startedAt to:', thirteenDaysAgo.toISOString());
  console.log('Jordan: $0 cash, $10k in 5 holdings');
  console.log('Riley: $0 cash, $10k in 4 holdings');
  console.log('Will advance to day 13 on next fetch');

  await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
