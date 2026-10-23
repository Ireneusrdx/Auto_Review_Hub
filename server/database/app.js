/*jshint esversion: 8 */
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3030;

app.use(cors());
app.use(require('body-parser').urlencoded({ extended: false }));
app.use(express.json());

// Seed data lives in data/ in the repo. The Docker image also copies the
// JSON files to the service root, so check both locations instead of
// assuming the process working directory.
function loadSeed(fileName, key) {
  const candidates = [
    path.join(__dirname, 'data', fileName),
    path.join(__dirname, fileName),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return JSON.parse(fs.readFileSync(candidate, 'utf8'))[key];
    }
  }
  throw new Error(`Seed file not found: ${fileName}`);
}

const reviews_data = loadSeed('reviews.json', 'reviews');
const dealerships_data = loadSeed('dealerships.json', 'dealerships');

// In Docker Compose the Mongo host is the `mongo_db` service name.
// For a local run set MONGO_URL, e.g. mongodb://127.0.0.1:27017/
const mongoUrl = process.env.MONGO_URL || 'mongodb://mongo_db:27017/';

const Reviews = require('./review');
const Dealerships = require('./dealership');

// Seed only after the connection is open. Doing this at import time raced
// the connection and could silently insert into a dead connection.
async function seedDatabase() {
  try {
    await Reviews.deleteMany({});
    await Reviews.insertMany(reviews_data);
    await Dealerships.deleteMany({});
    await Dealerships.insertMany(dealerships_data);
    console.log('Database seeded');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

mongoose.connect(mongoUrl, { dbName: 'dealershipsDB' })
  .then(() => {
    console.log('MongoDB connected');
    return seedDatabase();
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Express route to home
app.get('/', async (req, res) => {
  res.send('Welcome to the Mongoose API');
});

// Express route to fetch all reviews
app.get('/fetchReviews', async (req, res) => {
  try {
    const documents = await Reviews.find();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Express route to fetch reviews by a particular dealer
app.get('/fetchReviews/dealer/:id', async (req, res) => {
  try {
    const documents = await Reviews.find({ dealership: req.params.id });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Express route to fetch all dealerships
app.get('/fetchDealers', async (req, res) => {
  try {
    const documents = await Dealerships.find();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Express route to fetch Dealers by a particular state
app.get('/fetchDealers/:state', async (req, res) => {
  try {
    const documents = await Dealerships.find({ state: req.params.state });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Express route to fetch dealer by a particular id
app.get('/fetchDealer/:id', async (req, res) => {
  try {
    const documents = await Dealerships.find({ id: req.params.id });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Express route to insert review
app.post('/insert_review', express.raw({ type: '*/*' }), async (req, res) => {
  try {
    const data = typeof req.body === 'object' && !Buffer.isBuffer(req.body)
      ? req.body
      : JSON.parse(req.body.toString());
    const documents = await Reviews.find().sort({ id: -1 });
    const new_id = documents.length > 0 ? documents[0].id + 1 : 1;

    const review = new Reviews({
      'id': new_id,
      'name': data.name,
      'dealership': data.dealership,
      'review': data.review,
      'purchase': data.purchase,
      'purchase_date': data.purchase_date,
      'car_make': data.car_make,
      'car_model': data.car_model,
      'car_year': data.car_year,
    });

    const savedReview = await review.save();
    res.json(savedReview);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error inserting review' });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
