const { Router } = require('express');
const bcrypt = require('bcryptjs');
const Vendor = require('../models/Vendor');
const Institution = require('../models/Institution');
const Quote = require('../models/Quote');
const auth = require('../middleware/auth');
const { signToken } = require('../utils/tokens');

const router = Router();

router.post('/signup', async (req, res) => {
  try {
    const { businessName, contactName, email, password, phone, companyUrl } =
      req.body;

    if (!businessName?.trim() || !contactName?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const exists = await Vendor.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ error: 'Vendor already exists' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const vendor = await Vendor.create({
      businessName: businessName.trim(),
      contactName: contactName.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      phone: phone?.trim(),
      companyUrl: companyUrl?.trim()
    });

    const token = signToken({
      sub: vendor.id,
      role: 'vendor'
    });

    res.status(201).json({
      token,
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        contactName: vendor.contactName,
        email: vendor.email
      }
    });
  } catch (err) {
    console.error('Vendor signup error:', err.message);
    res.status(500).json({ error: 'Unable to sign up vendor' });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const vendor = await Vendor.findOne({ email: email.toLowerCase().trim() });
    if (!vendor) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, vendor.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({
      sub: vendor.id,
      role: 'vendor'
    });

    res.json({
      token,
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        contactName: vendor.contactName
      }
    });
  } catch (err) {
    // Simplified error handling: Pass error to the next middleware (global error handler)
    // console.error('Vendor signin error:', err.message); // Removed
    // res.status(500).json({ error: 'Unable to sign in vendor' }); // Removed
    res.status(500).json({ error: 'Unable to sign in vendor', details: err.message });
  }
});

router.get('/tiers', auth('vendor'), async (req, res) => {
  try {
    const institutions = await Institution.find({
      tiers: { $exists: true, $ne: [] }
    }).select('institutionName contactName tiers');

    res.json({ institutions });
  } catch (err) {
    // Simplified error handling: Pass error to the next middleware (global error handler)
    // res.status(500).json({ error: 'Unable to load tiers' }); // Removed
    res.status(500).json({ error: 'Unable to load tiers', details: err.message });
  }
});

router.post('/quotes', auth('vendor'), async (req, res) => {
  try {
    const { institutionId, tierPhase, vendorAmount, notes } = req.body;

    if (!institutionId || !tierPhase || vendorAmount === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (vendorAmount < 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const tier = institution.tiers.find(
      (item) => item.phase === tierPhase.toLowerCase()
    );

    if (!tier) {
      return res.status(400).json({ error: 'Tier unavailable' });
    }

    const quote = await Quote.create({
      vendor: req.user.sub,
      institution: institution.id,
      tierPhase: tier.phase,
      vendorAmount: Number(vendorAmount),
      institutionExpectation: tier.askingPrice,
      notes: notes?.trim() || ''
    });

    res.status(201).json({ quote });
  } catch (err) {
    // Simplified error handling: Pass error to the next middleware (global error handler)
    // console.error('Quote submission error:', err.message); // Removed
    // res.status(500).json({ error: 'Unable to submit quote' }); // Removed
    res.status(500).json({ error: 'Unable to submit quote', details: err.message });
  }
});

router.get('/quotes', auth('vendor'), async (req, res) => {
  try {
    const quotes = await Quote.find({ vendor: req.user.sub })
      .populate('institution', 'institutionName contactName email')
      .sort('-createdAt');

    res.json({ quotes });
  } catch (err) {
    // Simplified error handling: Pass error to the next middleware (global error handler)
    // res.status(500).json({ error: 'Unable to load quotes' }); // Removed
    res.status(500).json({ error: 'Unable to load quotes', details: err.message });
  }
});

module.exports = router;
