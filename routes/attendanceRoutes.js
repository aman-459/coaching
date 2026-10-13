const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const Attendance = require('../models/Attendance');

// 1. Attendance Sheet View (Select Batch & Date)
router.get('/', async (req, res) => {
  try {
    const batches = await Batch.find({});
    const selectedBatchId = req.query.batchId || (batches[0] ? batches[0]._id : null);
    
    // Default today date in YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    const selectedDate = req.query.date || today;

    let selectedBatch = null;
    let attendanceMap = {};

    if (selectedBatchId) {
      selectedBatch = await Batch.findById(selectedBatchId).populate('students');
      
      // Existing attendance record find karo agar pehle se mark ho
      const existingAttendance = await Attendance.findOne({
        batch: selectedBatchId,
        date: selectedDate
      });

      if (existingAttendance) {
        existingAttendance.records.forEach(r => {
          attendanceMap[r.student.toString()] = r.status;
        });
      }
    }

    res.render('attendance/index', {
      batches,
      selectedBatch,
      selectedDate,
      attendanceMap,
      title: 'Daily Attendance'
    });
  } catch (err) {
    res.status(500).send('Error loading attendance: ' + err.message);
  }
});

// 2. Save / Update Attendance
router.post('/save', async (req, res) => {
  try {
    const { batchId, date, attendance } = req.body;
    // attendance object format: { [studentId]: "Present" | "Absent" }

    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).send('Batch not found');

    const records = [];
    batch.students.forEach(studentId => {
      const idStr = studentId.toString();
      records.push({
        student: studentId,
        status: (attendance && attendance[idStr] === 'Present') ? 'Present' : 'Absent'
      });
    });

    // Upsert (Agar entry exist kare toh update, warna insert)
    await Attendance.findOneAndUpdate(
      { batch: batchId, date },
      { batch: batchId, date, records },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.redirect(`/attendance?batchId=${batchId}&date=${date}`);
  } catch (err) {
    res.status(500).send('Error saving attendance: ' + err.message);
  }
});

module.exports = router;