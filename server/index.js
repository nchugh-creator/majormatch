require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));

// Serve frontend
app.use(express.static(path.join(__dirname, '../public')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MajorMatch server running on port ${PORT}`));
