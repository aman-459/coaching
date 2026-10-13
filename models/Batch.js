const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  schedule: String, // e.g., "MWF 5:00 PM"
  monthlyFee: { type: Number, required: true },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Batch', batchSchema);