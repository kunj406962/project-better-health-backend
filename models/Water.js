const mongoose = require('mongoose');

const WaterSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  glasses: {
    type: Number,
    required: true,
    min: [0, 'Glasses cannot be negative'],
    max: [50, 'Maximum 50 glasses per entry']
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
WaterSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Water', WaterSchema);