const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  duration: {
    type: String,
    trim: true,
  },
  level: {
    type: String,
    trim: true,
  },
  icon: {
    type: String,
    trim: true,
  },
  syllabus: {
    type: [String],
    default: [],
  },
  features: {
    type: [String],
    default: [],
  },
  price: {
    type: String,
    trim: true,
  },
  rating: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
