const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  parentPhone: String,
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  feesStatus: {
    type: String,
    enum: ['Paid', 'Pending'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);