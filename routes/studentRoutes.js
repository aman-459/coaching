const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Batch = require('../models/Batch');

// 1. All Students List
router.get('/', async (req, res) => {
  try {
    const students = await Student.find({}).populate('batch');
    res.render('students/index', { students, title: 'All Students' });
  } catch (err) {
    res.status(500).send('Error loading students: ' + err.message);
  }
});

// 2. Add Student Form (Batches dropdown ke liye batches fetch karenge)
router.get('/new', async (req, res) => {
  try {
    const batches = await Batch.find({});
    res.render('students/new', { batches, title: 'Enroll New Student' });
  } catch (err) {
    res.status(500).send('Error loading form');
  }
});

// 3. Create Student & Link with Batch
router.post('/', async (req, res) => {
  try {
    const { name, phone, parentPhone, batchId, feesStatus } = req.body;

    const newStudent = new Student({
      name,
      phone,
      parentPhone,
      batch: batchId,
      feesStatus: feesStatus || 'Pending'
    });

    await newStudent.save();

    // Batch ke students array me student ID push karo
    if (batchId) {
      await Batch.findByIdAndUpdate(batchId, {
        $push: { students: newStudent._id }
      });
    }

    res.redirect('/students');
  } catch (err) {
    res.status(400).send('Error enrolling student: ' + err.message);
  }
});

// 4. Quick Toggle Fees Status (Paid <-> Pending)
router.patch('/:id/toggle-fee', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).send('Student not found');

    student.feesStatus = student.feesStatus === 'Paid' ? 'Pending' : 'Paid';
    await student.save();

    res.redirect('back');
  } catch (err) {
    res.status(500).send('Error updating fee status');
  }
});

// Render Edit Student Form
router.get('/:id/edit', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    const batches = await Batch.find({});
    if (!student) return res.status(404).send('Student not found');
    res.render('students/edit', { student, batches, title: `Edit ${student.name}` });
  } catch (err) {
    res.status(500).send('Error loading form');
  }
});

// Update Student (PUT)
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, parentPhone, batchId, feesStatus } = req.body;
    const oldStudent = await Student.findById(req.params.id);

    // Agar batch change hua ho, toh old batch se ID remove aur new me push
    if (oldStudent.batch && oldStudent.batch.toString() !== batchId) {
      await Batch.findByIdAndUpdate(oldStudent.batch, { $pull: { students: oldStudent._id } });
      if (batchId) {
        await Batch.findByIdAndUpdate(batchId, { $push: { students: oldStudent._id } });
      }
    }

    await Student.findByIdAndUpdate(req.params.id, {
      name,
      phone,
      parentPhone,
      batch: batchId || null,
      feesStatus
    });

    res.redirect('/students');
  } catch (err) {
    res.status(400).send('Error updating student: ' + err.message);
  }
});

// Delete Student (DELETE)
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (student && student.batch) {
      await Batch.findByIdAndUpdate(student.batch, { $pull: { students: student._id } });
    }
    await Student.findByIdAndDelete(req.params.id);
    res.redirect('/students');
  } catch (err) {
    res.status(500).send('Error deleting student');
  }
});

module.exports = router;