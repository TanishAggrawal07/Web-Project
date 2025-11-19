const { Router } = require('express');
const bcrypt = require('bcryptjs');
const Institution = require('../models/Institution');
const Quote = require('../models/Quote');
const auth = require('../middleware/auth');
const { signToken } = require('../utils/tokens');

const router = Router();

router.post('/signup', async (req, res) => {
  try {
    const { institutionName, contactName, email, password, phone } = req.body;

    if (!institutionName?.trim() || !contactName?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const exists = await Institution.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ error: 'Institution already exists' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const institution = await Institution.create({
      institutionName: institutionName.trim(),
      contactName: contactName.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      phone: phone?.trim()
    });

    const token = signToken({
      sub: institution.id,
      role: 'institution'
    });

    res.status(201).json({
      token,
      institution: {
        id: institution.id,
        institutionName: institution.institutionName,
        contactName: institution.contactName
      }
    });
  } catch (err) {
    console.error('Institution signup error:', err.message);
    res.status(500).json({ error: 'Unable to sign up institution' });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const institution = await Institution.findOne({ email: email.toLowerCase().trim() });
    if (!institution) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, institution.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({
      sub: institution.id,
      role: 'institution'
    });

    res.json({
      token,
      institution: {
        id: institution.id,
        institutionName: institution.institutionName,
        contactName: institution.contactName
      }
    });
  } catch (err) {
    console.error('Institution signin error:', err.message);
    res.status(500).json({ error: 'Unable to sign in institution' });
  }
});

router.post('/tiers', auth('institution'), async (req, res) => {
  try {
    const { phase, askingPrice, capacity, perks, expiresAt } = req.body;

    if (!phase?.trim() || askingPrice === undefined) {
      return res.status(400).json({ error: 'Phase and asking price required' });
    }

    const validPhases = ['gold', 'silver', 'platinum'];
    const sanitizedPhase = phase.toLowerCase().trim();
    if (!validPhases.includes(sanitizedPhase)) {
      return res.status(400).json({ error: 'Invalid phase. Must be gold, silver, or platinum' });
    }

    if (askingPrice < 0) {
      return res.status(400).json({ error: 'Price must be positive' });
    }

    if (capacity !== undefined && (capacity < 1 || capacity > 1000)) {
      return res.status(400).json({ error: 'Capacity must be between 1 and 1000' });
    }

    const institution = await Institution.findById(req.user.sub);
    if (!institution) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const filtered = institution.tiers.filter(
      (tier) => tier.phase !== sanitizedPhase
    );

    filtered.push({
      phase: sanitizedPhase,
      askingPrice: Number(askingPrice),
      capacity: capacity ? Number(capacity) : 1,
      perks: perks?.trim(),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    institution.tiers = filtered;
    await institution.save();

    res.status(201).json({ tiers: institution.tiers });
  } catch (err) {
    console.error('Tier creation error:', err.message);
    res.status(500).json({ error: 'Unable to save tier' });
  }
});

router.get('/tiers', auth('institution'), async (req, res) => {
  try {
    const institution = await Institution.findById(req.user.sub).select(
      'tiers institutionName'
    );
    res.json({ institution });
  } catch (err) {
    res.status(500).json({ error: 'Unable to load tiers' });
  }
});

router.get('/quotes', auth('institution'), async (req, res) => {
  try {
    const quotes = await Quote.find({ institution: req.user.sub })
      .populate('vendor', 'businessName contactName email')
      .sort('-createdAt');
    res.json({ quotes });
  } catch (err) {
    res.status(500).json({ error: 'Unable to load quotes' });
  }
});

router.patch('/quotes/:id/status', auth('institution'), async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'accepted', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be pending, accepted, or rejected' });
    }

    const quote = await Quote.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.sub },
      { status },
      { new: true }
    );

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json({ quote });
  } catch (err) {
    console.error('Quote status update error:', err.message);
    res.status(500).json({ error: 'Unable to update quote' });
  }
});

module.exports = router;
