require('dotenv').config({ path: 'server/.env' });
const mongoose = require('mongoose');
const Expert = require('./server/models/Expert');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const experts = await Expert.find({});
  console.log('Experts in DB:', experts.map(e => ({ name: e.name, email: e.email, token: e.token })));
  await mongoose.disconnect();
}

check();
