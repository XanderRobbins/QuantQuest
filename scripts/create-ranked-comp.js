const fs = require('fs');
const uri = fs.readFileSync('.env.local', 'utf8').split('\n').find(l => l.startsWith('MONGODB_URI=')).split('=').slice(1).join('=');
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // Remove any old global comps
  await db.collection('competitions').deleteMany({ isGlobal: true });
  console.log('Cleared old global competitions');

  const now = new Date();
  const startingCash = 10000;

  const comp = {
    type: 'live',
    scenario: null,
    name: 'Weekly Ranked Challenge',
    description: 'The official QuantQuest ranked competition. Everyone starts with $10,000 — prove your investing skills against the entire community. New challenge every week!',
    timeframe: '1w',
    startingCash,
    currentDay: 0,
    currentInterval: 0,
    totalDays: 7,
    startedAt: now,
    createdBy: null,
    isGlobal: true,
    inviteCode: 'RANKED',
    status: 'active',
    participants: [],
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection('competitions').insertOne(comp);
  console.log('Created global ranked competition:', result.insertedId.toString());
  console.log('Invite code: RANKED');

  await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
