// *****************************************************
// <!-- Import Dependencies -->
// *****************************************************

const express = require('express'); 
const app = express();
const handlebars = require('express-handlebars');
const path = require('path');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const axios = require('axios');

// *****************************************************
// <!-- Connect to DB -->
// *****************************************************

const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: path.join(__dirname, 'src', 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'src', 'views', 'partials'),
});

// Database configuration
const dbConfig = {
  host: 'db',
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};

const db = pgp(dbConfig);

// Test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful');
    obj.done();
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// <!-- App Settings -->
// *****************************************************

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize session variables
app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  resave: false,
}));

// *****************************************************
// <!-- API Routes -->
// *****************************************************

app.get('/', (req, res) => {
  res.redirect('/login');
});

// Get info from user table
app.get('/all', (req, res) => {
  const all = 'SELECT * FROM users;';
  db.task('get-everything', task => {
    return task.batch([task.any(all)]);
  })
  .then(data => {
    res.status(200).json({ data: data[0] });
  })
  .catch(err => {
    console.log('Uh oh spaghettio');
    console.log(err);
    res.status(400).json({ data: '' });
  });
});

// REGISTER
app.get('/register', (req, res) => {
  res.render('pages/register', { error: false, message: undefined });
});

app.post('/register', async (req, res) => {
  const username = req.body.username;
  const hash_pass = await bcrypt.hash(req.body.password, 10);
  const query = 'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *;';
  
  db.any(query, [username, hash_pass])
    .then(() => {
      res.render('pages/login', { message: 'Account successfully registered!' });
    })
    .catch(err => {
      console.log(err);
      res.render('pages/register', { error: true, message: "Uh oh! Something went wrong, your user was invalid or already registered!" });
    });
});

// LOGIN
app.get('/login', (req, res) => {
  res.render('pages/login', { message: undefined });
});

app.post('/login', (req, res) => {
  const username = req.body.username;
  const query = 'SELECT * FROM users WHERE users.username = $1 LIMIT 1';
  
  db.one(query, [username])
    .then(async data => {
      const match = await bcrypt.compare(req.body.password, data.password);
      if (match) {
        req.session.user = { username: data.username };
        res.redirect('/mylibrary'); // Redirect to mylibrary after login
      } else {
        res.render('pages/login', { error: true, message: "Incorrect password." });
      }
    })
    .catch(err => {
      console.log(err);
      res.render('pages/login', { error: true, message: "No username found, register to make an account." });
    });
});

// Authentication Middleware
const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// Requires authentication for certain routes
app.use(auth);

// My Library
app.get('/mylibrary', (req, res) => {
  axios({
      url: `https://app.ticketmaster.com/discovery/v2/events.json`,
      method: 'GET',
      params: {
          apikey: process.env.API_KEY,
          keyword: 'Taylor',
          size: 10
      },
  })
  .then(results => {
      res.render('pages/mylibrary', { results: results.data._embedded.events }); // Render the mylibrary page
  })
  .catch(error => {
      res.status(401).json({
          error: true,
          message: 'API Call Failure!',
          results: '',
      });
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log(err);
      return res.redirect('/mylibrary'); // Redirect to mylibrary on error
    }
    res.redirect('/login');
  });
});

// *****************************************************
// <!-- Start Server-->
// *****************************************************
app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
