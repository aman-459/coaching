const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const Attendance = require('../models/Attendance');

router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const batches = await Batch.find({ owner: userId });

    let selectedBatch = null;
    let attendanceMap = {};
    const today = new Date().toISOString().split('T')[0];
    const selectedDate = req.query.date || today;

    if (batches.length > 0) {
      const requestedBatchId = req.query.batchId;
      if (requestedBatchId) {
        selectedBatch = await Batch.findOne({ _id: requestedBatchId, owner: userId }).populate('students');
      }
      if (!selectedBatch) {
        selectedBatch = await Batch.findOne({ _id: batches[0]._id, owner: userId }).populate('students');
      }

      if (selectedBatch) {
        const existingAttendance = await Attendance.findOne({
          owner: userId,
          batch: selectedBatch._id,
          date: selectedDate
        });

        if (existingAttendance) {
          existingAttendance.records.forEach(r => {
            attendanceMap[r.student.toString()] = r.status;
          });
        }
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

router.post('/save', async (req, res) => {
  try {
    const userId = req.user._id;
    const { batchId, date, attendance } = req.body;

    const batch = await Batch.findOne({ _id: batchId, owner: userId });
    if (!batch) return res.status(403).send('Unauthorized batch');

    const records = [];
    batch.students.forEach(studentId => {
      const idStr = studentId.toString();
      records.push({
        student: studentId,
        status: (attendance && attendance[idStr] === 'Present') ? 'Present' : 'Absent'
      });
    });

    await Attendance.findOneAndUpdate(
      { owner: userId, batch: batchId, date },
      { owner: userId, batch: batchId, date, records },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.redirect(`/attendance?batchId=${batchId}&date=${date}`);
  } catch (err) {
    res.status(500).send('Error saving attendance: ' + err.message);
  }
});

module.exports = router;