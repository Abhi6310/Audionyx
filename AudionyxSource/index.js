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
const fs = require('fs');
//const getBase64Encoding = require('./youtubeToMP3');

// *****************************************************
// <!-- Connect to DB -->
// *****************************************************

const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: path.join(__dirname, 'src', 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'src', 'views', 'partials'),
});

// Database configuration IF YOU ARE USING DOCKER TO HOST LOCALLY.
// DO NOT PUSH WITH THIS CONFIG, IT WILL REMOVE OUR HOSTED WEBSITE
/*
const dbConfig = {
  host: 'db',
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};
*/

// Database configuration FOR CLOUD HOSTING DEPLOYMENT

const dbConfig = {
  host: process.env.POSTGRES_HOST, 
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
app.use(express.static(path.join(__dirname, 'src', 'resources')));
app.use('/resources', express.static(path.join(__dirname, 'src', 'resources')));
// Initialize session variables
app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  resave: false,
}));

// Serve static files
app.use('/resources', express.static(path.join(__dirname, 'src/resources')));

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

// *********************** REGISTER API ROUTES **************************
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

  
  // NEGATIVE REGISTER TEST CASE: Validate that username is no longer than 50 characters
  if (username.length > 50) {
    return res.status(400).json({ message: 'The username you entered exceeds the 50 character limit. Please choose a different username.' });
  }


  const hash_pass = await bcrypt.hash(req.body.password, 10);
  const query = 'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *;';
  db.any(query, [
    username,
    hash_pass
  ])
  .then(data => {
    // POSITIVE REGISTER TEST CASE
    /*
    res.status(200).json({ message: 'Account successfully created!' });
    */

    // ORIGINAL, COMMENT WHEN TESTING
    // /*
    res.render('pages/login', {
      message: 'Account successfully created!'
    });
    // */
  })

  .catch(err => {
    console.log(err);
    // NEGATIVE REGISTER TEST CASE 
    /*
    res.status(400).json({ message: 'Uh oh! Something went wrong, your username was invalid or already registered!' });
    */

    // ORIGINAL, COMMENT WHEN TESTING
    // /*
    res.render('pages/register', {
      error: true,
      message: "Uh oh! Something went wrong, your username was invalid or already registered!"
    });
    // */
  });

});

// *********************** LOGIN API ROUTES **************************
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
    // POSITIVE LOGIN TEST CASE -- will cause HTTP error b/c multiple requests
    /*
    res.status(200).json({ message: 'Login successful! Welcome back to Audionyx!' });
    */

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
      // NEGATIVE LOGIN TEST CASE 
      /*
      res.status(400).json({ message: 'No username found, sign up to make an account.' });
      */

      // ORIGINAL, COMMENT WHEN TESTING
      // /*
      res.render('pages/login', {
        error: true,
        message: "No username found, sign up to make an account."
      });
      // */

    });
});



// *********************** AUTHENTICATION MIDDLEWARE ***************************
const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// Requires authentication for certain routes
app.use(auth);

// *********************** HOME API ROUTES **************************
app.get('/home', (req, res) => {
  res.render('pages/home', { title: 'Visualizer Home', username: req.session.user.username });
});

// *********************** MY LIBRARY API ROUTES **************************
app.get('/home', (req, res) => {
  res.redirect('/mylibrary');  // Redirect to My Library if authenticated
});

app.get('/mylibrary', (req, res) => {
  res.render('pages/mylibrary', { title: 'My Library', username: req.session.user.username });
});

// app.post('/create-project', auth, async (req, res) => {
//   const { projectName, description, libraryName } = req.body; // Input from the client
//   const username = req.session.user.username; // Current logged-in user
  
//   try {
//     // Step 1: Check or create the library
//     let libraryId;

//     const libraryQuery = 'SELECT library_id FROM Library WHERE library_name = $1;';
//     const libraryResult = await db.any(libraryQuery, [libraryName]);

//     if (libraryResult.length > 0) {
//       libraryId = libraryResult[0].library_id;
//     } else {
//       const newLibraryQuery = 'INSERT INTO Library (library_name) VALUES ($1) RETURNING library_id;';
//       const newLibraryResult = await db.one(newLibraryQuery, [libraryName]);
//       libraryId = newLibraryResult.library_id;
//     }

//     // Step 2: Get the Base64 encoding from the external file
//     const base64Encoding = await getBase64Encoding();

//     // Step 3: Insert the project into the database
//     const projectQuery = `
//       INSERT INTO Projects (project_name, description, base64_encoding, library_id) 
//       VALUES ($1, $2, $3, $4) RETURNING project_id;
//     `;
//     const projectResult = await db.one(projectQuery, [projectName, description, base64Encoding, libraryId]);

//     res.status(200).json({ message: 'Project created successfully!', projectId: projectResult.project_id });
//   } catch (error) {
//     console.error('Error creating project:', error);
//     res.status(500).json({ message: 'Error creating project', error: error.message });
//   }
// });

// *********************** LOGOUT API ROUTE **************************

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.render('pages/logout', {
      message: "You have successfully been logged out!"
  });
});


// ******** LIBRARY
/*
// POST route for uploading MP3 files
app.post('/upload', upload.single('file'), (req, res) => {
  const { title, genre } = req.body;
  const fileUrl = `/uploads/${req.file.filename}`; // Path to the uploaded file

  const newTrack = new Track({
    title,
    genre,
    filetype: req.file.mimetype, 
    fileUrl,
  });

  newTrack.save()
    .then(() => res.redirect('/')) // Redirect back to the music library page after saving
    .catch((err) => res.status(500).send('Error uploading file: ' + err));
});

// DELETE route for deleting a file
app.post('/delete/:id', (req, res) => {
  const trackId = req.params.id;

  Track.findById(trackId)
    .then(track => {
      if (!track) {
        return res.status(404).send('Track not found');
      }

      // Delete the file from the server
      const filePath = path.join(__dirname, 'uploads', path.basename(track.fileUrl));
      require('fs').unlink(filePath, (err) => {
        if (err) {
          return res.status(500).send('Error deleting file: ' + err);
        }

        // Delete the track from the database
        Track.findByIdAndDelete(trackId)
          .then(() => res.redirect('/')) // Redirect back to the music library page after deleting
          .catch((err) => res.status(500).send('Error deleting track from database: ' + err));
      });
    })
    .catch((err) => res.status(500).send('Error finding track: ' + err));
});
*/


// *****************************************************
// <!-- TESTING FROM LAB 11 -->
// *****************************************************

/*
app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});
*/

// *****************************************************
// <!-- Start Server -->
// *****************************************************

// ONLY UNCOMMENT WHEN RUNNING LOCALLY, DO NOT PUSH PLEASE
/*
app.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
*/

// FOR RENDER DEPLOYMENT
app.listen(5432, () => {
  console.log(`Server is listening on port 5432`);
});


// TESTING FROM LAB 11

// module.exports = app.listen(3000);
