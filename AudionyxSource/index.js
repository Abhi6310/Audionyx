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


// Opening Screen to Login!
app.get('/', (req, res) => {
  res.redirect('/mylibrary'); 
});

// Get info from user table
app.get('/all', (req, res) => {
  const all = 'SELECT * FROM users;';
  db.task('get-everything', task => {
    return task.batch([task.any(all)]);
  })
  .then(data => {
    res.status(200).json({
      data: data[0]
    });
  })
  .catch(err => {
    console.log('Uh oh spaghettio');
    console.log(err);
    res.status(400).json({
      data: '',
    });
  });
});

// REGISTER
const user = {
  username: undefined,
  password: undefined,
};

app.get('/register', (req, res) => {
  if (req.session.user) {
    res.render('pages/register', {
      error: true,
      message: "Please logout before attempting to sign up for an account."
    });
  } else {
    res.render('pages/register');
  }
});

app.post('/register', async (req, res) => {
  const username = req.body.username;
  const hash_pass = await bcrypt.hash(req.body.password, 10);
  const query = 'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *;';
  db.any(query, [
    username,
    hash_pass
  ])
  .then(data => {
    res.render('pages/login', {
      message: 'Account successfully created!'
    });
  })
  .catch(err => {
    console.log(err);
    res.render('pages/register', {
      error: true,
      message: "Uh oh! Something went wrong, your username was invalid or already registered!"
    });
  });
});

// LOGIN
app.get('/login', (req, res) => {
  if (req.session.user) {
    res.render('pages/login', {
      error: true,
      message: "You are already logged in. Please logout before attempting to login again."
    });
  } else {
    res.render('pages/login', {
      message: undefined,
    });
  }
});

app.post('/login', (req, res) => {
  const username = req.body.username;
  const query = 'SELECT * FROM users WHERE users.username = $1 LIMIT 1';
  const values = [username];

  db.one(query, values)
    .then(async data => {
      user.username = data.username;
      user.password = data.password;
      const match = await bcrypt.compare(req.body.password, user.password);

      if (match) {
        req.session.user = user;
        req.session.save();

        res.redirect('/mylibrary');

      } else {
        res.render('pages/login', {
          error: true,
          message: "Incorrect password."
        });
      }
    })
    .catch(err => {
      console.log(err);
      res.render('pages/login', {
        error: true,
        message: "No username found, sign up to make an account."
      });
    });
});


// Authentication Middleware
const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// Requires authentication for certain routes
app.use(auth);

// Home - Render home page if authenticated
app.get('/home', (req, res) => {
  res.render('pages/home', { title: 'Visualizer Home', username: req.session.user.username });
});

// Home to my library
app.get('/home', (req, res) => {
  res.redirect('/mylibrary');  // Redirect to My Library if authenticated
});

// My Library - Render mylibrary page if authenticated
app.get('/mylibrary', (req, res) => {
  res.render('pages/mylibrary', { title: 'My Library', username: req.session.user.username });
});


// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.render('pages/logout', {
      message: "You have successfully been logged out!"
  });
});

// *****************************************************
// <!-- Start Server -->
// *****************************************************
app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
