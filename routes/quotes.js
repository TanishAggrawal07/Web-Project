const { Router } = require('express');
const Institution = require('../models/Institution');

const router = Router();

router.get('/phases', (_req, res) => {
  res.json({
    phases: [
      { phase: 'gold', description: 'Premium visibility and co-branding' },
      { phase: 'silver', description: 'Enhanced placement and campus activations' },
      { phase: 'platinum', description: 'Exclusive coverage with headline status' }
    ]
  });
});

router.get('/tiers', async (_req, res) => {
  try {
    const tiers = await Institution.find({
      tiers: { $exists: true, $ne: [] }
    }).select('institutionName contactName tiers');

    res.json({ tiers });
  } catch (err) {
    res.status(500).json({ error: 'Unable to load sponsorship tiers' });
  }
});

module.exports = router;
