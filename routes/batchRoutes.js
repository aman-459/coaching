const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');

// 1. Show all batches
router.get('/', async (req, res) => {
  try {
    const batches = await Batch.find({});
    res.render('batches/index', { batches, title: 'All Batches' });
  } catch (err) {
    res.status(500).send('Error loading batches');
  }
});

// 2. Render create batch form
router.get('/new', (req, res) => {
  res.render('batches/new', { title: 'Create Batch' });
});

// 3. Handle form submission
router.post('/', async (req, res) => {
  try {
    const { name, subject, schedule, monthlyFee } = req.body;
    await Batch.create({ name, subject, schedule, monthlyFee });
    res.redirect('/batches');
  } catch (err) {
    res.status(400).send('Error creating batch: ' + err.message);
  }
});

// 4. Show single batch details
router.get('/:id', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id).populate('students');
    if (!batch) return res.status(404).send('Batch not found');
    res.render('batches/show', { batch, title: batch.name });
  } catch (err) {
    res.status(500).send('Error fetching batch');
  }
});

// Render Edit Batch Form
router.get('/:id/edit', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).send('Batch not found');
    res.render('batches/edit', { batch, title: `Edit ${batch.name}` });
  } catch (err) {
    res.status(500).send('Error loading edit page');
  }
});

// Update Batch (PUT)
router.put('/:id', async (req, res) => {
  try {
    const { name, subject, schedule, monthlyFee } = req.body;
    await Batch.findByIdAndUpdate(req.params.id, { name, subject, schedule, monthlyFee });
    res.redirect(`/batches/${req.params.id}`);
  } catch (err) {
    res.status(400).send('Error updating batch: ' + err.message);
  }
});

// Delete Batch (DELETE)
router.delete('/:id', async (req, res) => {
  try {
    await Batch.findByIdAndDelete(req.params.id);
    // Student model me batch reference unassign karna
    await Student.updateMany({ batch: req.params.id }, { $unset: { batch: '' } });
    res.redirect('/batches');
  } catch (err) {
    res.status(500).send('Error deleting batch');
  }
});

module.exports = router;