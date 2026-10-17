const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const Student = require('../models/Student');

// List user's batches
router.get('/', async (req, res) => {
  try {
    const batches = await Batch.find({ owner: req.user._id });
    res.render('batches/index', { batches, title: 'All Batches' });
  } catch (err) {
    res.status(500).send('Error loading batches: ' + err.message);
  }
});

// Form: New Batch
router.get('/new', (req, res) => {
  res.render('batches/new', { title: 'Create Batch' });
});

// Create Batch
router.post('/', async (req, res) => {
  try {
    const { name, subject, schedule, monthlyFee } = req.body;
    await Batch.create({
      name,
      subject,
      schedule,
      monthlyFee,
      owner: req.user._id
    });
    res.redirect('/batches');
  } catch (err) {
    res.status(400).send('Error creating batch: ' + err.message);
  }
});

// Show single batch
router.get('/:id', async (req, res) => {
  try {
    const batch = await Batch.findOne({ _id: req.params.id, owner: req.user._id }).populate('students');
    if (!batch) return res.status(404).send('Batch not found');
    res.render('batches/show', { batch, title: batch.name });
  } catch (err) {
    res.status(500).send('Error fetching batch: ' + err.message);
  }
});

// Form: Edit Batch
router.get('/:id/edit', async (req, res) => {
  try {
    const batch = await Batch.findOne({ _id: req.params.id, owner: req.user._id });
    if (!batch) return res.status(404).send('Batch not found');
    res.render('batches/edit', { batch, title: `Edit ${batch.name}` });
  } catch (err) {
    res.status(500).send('Error loading edit page: ' + err.message);
  }
});

// Update Batch
router.put('/:id', async (req, res) => {
  try {
    const { name, subject, schedule, monthlyFee } = req.body;
    await Batch.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { name, subject, schedule, monthlyFee }
    );
    res.redirect(`/batches/${req.params.id}`);
  } catch (err) {
    res.status(400).send('Error updating batch: ' + err.message);
  }
});

// Delete Batch
router.delete('/:id', async (req, res) => {
  try {
    const batch = await Batch.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (batch) {
      await Student.updateMany({ batch: req.params.id, owner: req.user._id }, { $unset: { batch: '' } });
    }
    res.redirect('/batches');
  } catch (err) {
    res.status(500).send('Error deleting batch: ' + err.message);
  }
});

module.exports = router;