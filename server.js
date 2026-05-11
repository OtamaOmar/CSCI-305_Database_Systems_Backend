require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./db/connection');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
// app.use('/api/auth', require('./routes/auth'));

app.get('/', (req, res) => {
  res.json({ message: 'PulseED Backend API is running.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await testConnection();
    console.log('Database connected successfully.');
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
});
