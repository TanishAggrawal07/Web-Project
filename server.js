const path = require('path');
require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const vendorRoutes = require('./routes/vendors');
const institutionRoutes = require('./routes/institutions');
const quoteRoutes = require('./routes/quotes');

const app = express();
connectDB();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/vendors', vendorRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/quotes', quoteRoutes);

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    next();
  }
});

app.use((err, _req, res, _next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log("http://localhost:4000/")
});