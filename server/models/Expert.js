const mongoose = require('mongoose');

const expertSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  designation: { type: String, required: true },
  domain: { type: String, required: true },
  token: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Expert', expertSchema);
