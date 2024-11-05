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


app.get('/', (req, res) => {
  res.redirect('/login');
});

// Get info from Users table
app.get('/all', (req, res) => {
  // Query to select all users, including their associated library_id
  const allUsersQuery = `
    SELECT username, email, created_at, library_id 
    FROM Users;
  `;
  
  db.task('get-everything', task => {
    return task.batch([task.any(allUsersQuery)]);
  })
  .then(data => {
    // Send back the data as a JSON response
    res.status(200).json({ data: data[0] });
  })
  .catch(err => {
    console.log('Uh oh spaghettio');
    console.log(err);
    res.status(400).json({ data: '' });
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
      message: undefined
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
      message: 'Account successfully registered!'
    });
  })
  .catch(err => {
    console.log(err);
    res.render('pages/register', {
      error: true,
      message: "Uh oh! Something went wrong, your user was invalid or already registered!"
    });
  });
});

// LOGIN
app.get('/login', (req, res) => {
  if (req.session.user) {
    res.render('pages/login', {
      error: true,
      message: undefined
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
      res.render('pages/register', {
        error: true,
        message: "No username found, register to make an account."
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
  if (!req.session.user) {
    return res.redirect('/login');  // Redirect to login if user is not authenticated
  }
  res.render('pages/home', { title: 'Visualizer Home', username: req.session.user.username });
});

//home to my library
app.get('/home', (req, res) => {
  res.redirect('/mylibrary');  // Redirect to My Library if authenticated
});

// My Library - Render mylibrary page if authenticated
app.get('/mylibrary', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');  // Redirect to login if user is not authenticated
  }
  res.render('pages/mylibrary', { title: 'My Library', username: req.session.user.username });
});




// Logout
app.get('/logout', (req, res) => {
  res.redirect('/login'); // Redirect to login if accessed via GET
});

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log(err);
      return res.redirect('/home'); 
    }
      res.redirect('/login');
  });
});

// *****************************************************
// <!-- Start Server -->
// *****************************************************
app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
