require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const authRoutes = require('./Routers/authRoutes');
const adminRoutes = require('./Routers/adminRoutes');
const videoRoutes = require('./Routers/videoRoutes');
const publicRoutes = require('./Routers/publicRoutes');

// Initialize background cron jobs
require('./cronJobs/videoCleanup');

const app = express();
const PORT = process.env.PORT || 3000;

const clientUrls = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : [];

const allowedOrigins = [
  'https://csrcandid.in',
  // 'http://localhost:5173',
  ...clientUrls
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      // callback(null, false) prevents Express from throwing a 500 Internal Server Error
      callback(null, false);
    }
  },
  credentials: true
}));



app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads statically for icons
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/public', publicRoutes);

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://ananttade56:Anjangaon852%40@cluster0.rhe9zug.mongodb.net/?appName=Cluster0')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error connecting to MongoDB', err);
  });
