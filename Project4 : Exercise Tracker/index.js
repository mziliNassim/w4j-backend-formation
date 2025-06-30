require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const User = require('./models/User');

// Middlewars
const app = express();
app.use(cors())
app.use(express.static('public'))
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err.message));


// UI Render
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



// Create a new user
app.post('/api/users', async (req, res) => {
  try {
    const user = new User({ username: req.body.username });
    await user.save();
    res.status(201).json({ username: user.username, _id: user._id });
  } catch (err) {
    res.status(500).json({error : err.message});
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({error : err.message});
  }
});


// Add an exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { description, duration, date } = req.body;
    const user = await User.findById(req.params._id);
    if (!user) return res.status(404).json({err : "User not found"});
    
    const exerciseDate = date ? new Date(date) : new Date();
    const exercise = { description, duration: Number(duration), date: exerciseDate };
    
    user.log.push(exercise);
    await user.save();
    
    res.status(201).json({
      username: user.username,
      description,
      duration: Number(duration),
      date: exerciseDate.toDateString(),
      _id: user._id
    });    
  } catch (err) {
    res.status(500).json({error : err.message});
  }
});


// Get user logs (with optional query params)
app.get('/api/users/:_id/logs', async (req, res) => {
  try{ 
    const { from, to, limit } = req.query;
    const user = await User.findById(req.params._id);
    if (!user) return res.status(404).send("User not found");

    let logs = user.log.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString()
    }));

    if (from) {
      const fromDate = new Date(from);
      logs = logs.filter(e => new Date(e.date) >= fromDate);
    }

    if (to) {
      const toDate = new Date(to);
      logs = logs.filter(e => new Date(e.date) <= toDate);
    }

    if (limit) {
      logs = logs.slice(0, Number(limit));
    }

    res.json({
      _id: user._id,
      username: user.username,
      count: logs.length,
      log: logs
    });
  } catch (err) {
    res.status(500).json({error : err.message});
  }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
