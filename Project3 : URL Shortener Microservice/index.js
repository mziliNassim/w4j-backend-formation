require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const app = express();

// Basic config
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// In-memory URL store
const urlDatabase = {};
let idCounter = 1;

// POST endpoint to shorten URL
app.post('/api/shorturl', (req, res) => {
  const original_url = req.body.url;

  try {
    const urlObj = new URL(original_url);

    // Validate URL using DNS
    dns.lookup(urlObj.hostname, (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }

      // Store and return shortened URL
      const short_url = idCounter++;
      urlDatabase[short_url] = original_url;

      res.json({
        original_url,
        short_url,
      });
    });
  } catch (e) {
    return res.json({ error: 'invalid url' });
  }
});


app.get('/api/shorturl/:short_url', (req, res) => {
  const short_url = parseInt(req.params.short_url);
  const original_url = urlDatabase[short_url];

  if (original_url) {
    res.redirect(original_url);
  } else {
    res.json({ error: 'No short URL found!' });
  }
});

const port = process.env.PORT || 3000
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
