const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Batch = require('../models/Batch');

// List user's students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find({ owner: req.user._id }).populate('batch');
    res.render('students/index', { students, title: 'All Students' });
  } catch (err) {
    res.status(500).send('Error loading students: ' + err.message);
  }
});

// Form: New Student
router.get('/new', async (req, res) => {
  try {
    const batches = await Batch.find({ owner: req.user._id });
    res.render('students/new', { batches, title: 'Enroll New Student' });
  } catch (err) {
    res.status(500).send('Error loading form');
  }
});

// Create Student
router.post('/', async (req, res) => {
  try {
    const { name, phone, parentPhone, batchId, feesStatus } = req.body;

    if (batchId) {
      const validBatch = await Batch.findOne({ _id: batchId, owner: req.user._id });
      if (!validBatch) return res.status(403).send('Unauthorized batch');
    }

    const newStudent = new Student({
      name,
      phone,
      parentPhone,
      batch: batchId || null,
      feesStatus: feesStatus || 'Pending',
      owner: req.user._id
    });

    await newStudent.save();

    if (batchId) {
      await Batch.findByIdAndUpdate(batchId, { $push: { students: newStudent._id } });
    }

    res.redirect('/students');
  } catch (err) {
    res.status(400).send('Error enrolling student: ' + err.message);
  }
});

// Toggle Fee Status
router.patch('/:id/toggle-fee', async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, owner: req.user._id });
    if (!student) return res.status(404).send('Student not found');

    student.feesStatus = student.feesStatus === 'Paid' ? 'Pending' : 'Paid';
    await student.save();

    res.redirect('/students');
  } catch (err) {
    res.status(500).send('Error updating fee');
  }
});

// Form: Edit Student
router.get('/:id/edit', async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, owner: req.user._id });
    if (!student) return res.status(404).send('Student not found');

    const batches = await Batch.find({ owner: req.user._id });
    res.render('students/edit', { student, batches, title: `Edit ${student.name}` });
  } catch (err) {
    res.status(500).send('Error loading edit form');
  }
});

// Update Student
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, parentPhone, batchId, feesStatus } = req.body;
    const student = await Student.findOne({ _id: req.params.id, owner: req.user._id });
    if (!student) return res.status(404).send('Student not found');

    if (batchId) {
      const validBatch = await Batch.findOne({ _id: batchId, owner: req.user._id });
      if (!validBatch) return res.status(403).send('Unauthorized batch');
    }

    const oldBatchId = student.batch ? student.batch.toString() : null;
    const newBatchId = batchId ? batchId.toString() : null;

    if (oldBatchId !== newBatchId) {
      if (oldBatchId) await Batch.findByIdAndUpdate(oldBatchId, { $pull: { students: student._id } });
      if (newBatchId) await Batch.findByIdAndUpdate(newBatchId, { $push: { students: student._id } });
    }

    student.name = name;
    student.phone = phone;
    student.parentPhone = parentPhone;
    student.batch = batchId || null;
    student.feesStatus = feesStatus;
    await student.save();

    res.redirect('/students');
  } catch (err) {
    res.status(400).send('Error updating student: ' + err.message);
  }
});

// Delete Student
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (student && student.batch) {
      await Batch.findByIdAndUpdate(student.batch, { $pull: { students: student._id } });
    }
    res.redirect('/students');
  } catch (err) {
    res.status(500).send('Error deleting student');
  }
});

module.exports = router;