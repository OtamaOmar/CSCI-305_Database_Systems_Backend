require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./db/connection');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth',              require('./routes/auth'));
app.use('/api/patients',          require('./routes/patients'));
app.use('/api/notifications',     require('./routes/notifications'));
app.use('/api/doctors',           require('./routes/doctors'));
app.use('/api/cases',             require('./routes/cases'));
app.use('/api/appointments',      require('./routes/appointments'));
app.use('/api/prescriptions',     require('./routes/prescriptions'));
app.use('/api/departments',       require('./routes/departments'));
app.use('/api/locations',         require('./routes/locations'));
app.use('/api/medical-files',     require('./routes/medical-files'));
app.use('/api/hospital-files',    require('./routes/hospital-files'));
app.use('/api/rooms',             require('./routes/rooms'));
app.use('/api/room-reservations', require('./routes/room-reservations'));
app.use('/api/users',             require('./routes/users'));
app.use('/api/roles',             require('./routes/roles'));
app.use('/api/invitations',       require('./routes/invitations'));
app.use('/api/contact',           require('./routes/contact'));
app.use('/api/dashboard',         require('./routes/dashboard'));
app.use('/api/reports',           require('./routes/reports'));
app.use('/api/staff-schedule',    require('./routes/staff-schedule'));
app.use('/api/ambulances',        require('./routes/ambulances'));
app.use('/api/triage',            require('./routes/triage'));

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
    console.error('Database connection failed:', err);
  }
});
