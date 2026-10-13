const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD (easiest for day-level tracking)
    required: true
  },
  records: [
    {
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
      },
      status: {
        type: String,
        enum: ['Present', 'Absent'],
        default: 'Present'
      }
    }
  ]
}, { timestamps: true });

// Ek batch ki ek date par sirf ek attendance record ban sake
attendanceSchema.index({ batch: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);