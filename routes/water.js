const express = require('express');
const Water = require('../models/Water');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected - user must be logged in
router.use(protect);

// Add a new water intake entry
router.post('/', async (req, res) => {
  try {
    const { glasses, date, notes } = req.body;

    // Basic validation
    if (!glasses && glasses !== 0) {
      return res.status(400).json({
        success: false,
        message: 'Number of glasses is required'
      });
    }

    if (glasses < 0 || glasses > 50) {
      return res.status(400).json({
        success: false,
        message: 'Glasses must be between 0 and 50'
      });
    }

    // Create water intake entry
    const waterEntry = await Water.create({
      user: req.user.id,
      glasses,
      date: date || new Date(),
      notes
    });

    res.status(201).json({
      success: true,
      data: waterEntry
    });

  } catch (error) {
    console.error('Add water intake error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all water intake entries for logged in user
router.get('/', async (req, res) => {
  try {
    const waterEntries = await Water.find({ user: req.user.id })
      .sort({ date: -1 }) // Most recent first
      .lean();

    // Calculate total glasses
    const totalGlasses = waterEntries.reduce((sum, entry) => sum + entry.glasses, 0);

    res.json({
      success: true,
      count: waterEntries.length,
      totalGlasses,
      data: waterEntries
    });

  } catch (error) {
    console.error('Get water entries error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get water intake for a specific date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    // Parse date (format: YYYY-MM-DD)
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const waterEntries = await Water.find({
      user: req.user.id,
      date: {
        $gte: startDate,
        $lt: endDate
      }
    }).lean();

    const totalForDate = waterEntries.reduce((sum, entry) => sum + entry.glasses, 0);

    res.json({
      success: true,
      date: date,
      totalGlasses: totalForDate,
      entries: waterEntries.length,
      data: waterEntries
    });

  } catch (error) {
    console.error('Get water by date error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get today's water intake
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const waterEntries = await Water.find({
      user: req.user.id,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).lean();

    const totalToday = waterEntries.reduce((sum, entry) => sum + entry.glasses, 0);

    res.json({
      success: true,
      date: today.toISOString().split('T')[0],
      totalGlasses: totalToday,
      entries: waterEntries.length,
      data: waterEntries
    });

  } catch (error) {
    console.error('Get today water error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get water statistics for period
router.get('/stats', async (req, res) => {
  try {
    const { period = 'week' } = req.query; // day, week, month, year
    
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const waterEntries = await Water.find({
      user: req.user.id,
      date: { $gte: startDate }
    }).lean();

    const totalGlasses = waterEntries.reduce((sum, entry) => sum + entry.glasses, 0);
    const averageDaily = waterEntries.length > 0 
      ? Math.round((totalGlasses / waterEntries.length) * 10) / 10
      : 0;

    // Group by date for daily breakdown
    const dailyData = {};
    waterEntries.forEach(entry => {
      const dateStr = entry.date.toISOString().split('T')[0];
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = 0;
      }
      dailyData[dateStr] += entry.glasses;
    });

    const stats = {
      period: period,
      totalEntries: waterEntries.length,
      totalGlasses: totalGlasses,
      averageDaily: averageDaily,
      dailyBreakdown: dailyData
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update a water entry
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { glasses, date, notes } = req.body;

    let waterEntry = await Water.findById(id);

    if (!waterEntry) {
      return res.status(404).json({
        success: false,
        message: 'Water entry not found'
      });
    }

    // Check if user owns this entry
    if (waterEntry.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this entry'
      });
    }

    // Update fields
    if (glasses !== undefined) {
      if (glasses < 0 || glasses > 50) {
        return res.status(400).json({
          success: false,
          message: 'Glasses must be between 0 and 50'
        });
      }
      waterEntry.glasses = glasses;
    }
    
    if (date !== undefined) waterEntry.date = date;
    if (notes !== undefined) waterEntry.notes = notes;

    await waterEntry.save();

    res.json({
      success: true,
      data: waterEntry
    });

  } catch (error) {
    console.error('Update water entry error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete a water entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const waterEntry = await Water.findById(id);

    if (!waterEntry) {
      return res.status(404).json({
        success: false,
        message: 'Water entry not found'
      });
    }

    // Check if user owns this entry
    if (waterEntry.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this entry'
      });
    }

    await waterEntry.deleteOne();

    res.json({
      success: true,
      message: 'Water entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete water entry error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;