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
const ffmpeg = require('fluent-ffmpeg'); // ffmpeg to handle audio processing
const SpotifyWebApi = require('spotify-web-api-node'); // For Spotify API
const ffmpegLocation = '/usr/bin/ffmpeg'; // Path to ffmpeg
const fs = require('fs');

app.use(bodyParser.json({ limit: '100mb' })); // Adjust the size as needed
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
//const getBase64Encoding = require('./youtubeToMP3');

// *****************************************************
// <!-- Connect to DB -->
// *****************************************************

// Express handlebars
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: path.join(__dirname, 'src', 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'src', 'views', 'partials'),
});

// Database configuration
const dbConfig = {
  host: process.env.HOST, // UNCOMMENT FOR RENDER HOSTING
  // host: 'db', // UNCOMMMENT FOR LOCAL HOSTING
  port: 5432, // Default PostgreSQL port
  database: process.env.POSTGRES_DB, // Users DB from the .env file
  user: process.env.POSTGRES_USER, // PostgreSQL user
  password: process.env.POSTGRES_PASSWORD, // PostgreSQL password
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

// Opening Screen after Login!
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
    const query1 = 'INSERT INTO Library (library_id, library_name) VALUES ($1, $2) RETURNING *;';
    db.any(query1, [
      username,
      username + "'s Library"
    ])

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
        
        res.redirect('/home');

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
// clicking home nav link
app.get('/home', (req, res) => {
  res.render('pages/home', { title: 'Visualizer Home', username: req.session.user.username });
});

// clicking visualizer testing link
// Render the visualizer page
app.get('/visualizer', (req, res) => {
  const projectID = req.query.projectID;

  if (!projectID) {
    return res.status(400).send('Project ID is required to view the visualizer.');
  }

  res.render('pages/visualizer', { 
    title: 'Visualizer Home', 
    username: req.session.user.username,
    projectID: projectID 
  });
});

app.get('/visualizer/:projectId', async (req, res) => {
  console.log("Inside /visualizer/:projectId endpoint");
  try {
      const projectId = req.params.projectId;
      console.log("Received Project ID:", projectId);

      const query = 'SELECT base64_encoding FROM projects WHERE project_id = $1';
      const values = [projectId];

      console.log("Executing Query:", query);
      console.log("With Values:", values);

      const project = await db.query(query, values);

      console.log("Query Result:", project);

      // Access the base64 encoding from the first row
      const base64Encoding = project;

      if (!base64Encoding) {
          console.error("No Base64 encoding found for the given Project ID.");
          return res.status(404).json({ error: "Project not found or no Base64 encoding exists." });
      }

      console.log("Base64 Encoding Retrieved:", base64Encoding);

      res.json({ base64Encoding });
  } catch (error) {
      console.error("Error fetching project data:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
});



// *********************** MY LIBRARY API ROUTES **************************
app.get('/home', (req, res) => {
  res.redirect('/mylibrary');  // Redirect to My Library if authenticated
});

// Fetch user-specific songs when loading the library
app.get('/mylibrary', (req, res) => {
  const userId = req.session.user.username; // Get logged-in user's username
  console.log("Fetching library for user:", userId); // Debug log

  const query = `
      SELECT * FROM Projects
      WHERE library_id = $1;
  `;

  db.any(query, [userId])
      .then(data => {
          console.log("Fetched library data:", data); // Debug log
          res.render('pages/mylibrary', { 
              title: 'My Library', 
              username: userId,
              results: data, // Send songs to the Handlebars template
          });
      })
      .catch(err => {
          console.error("Error fetching library:", err);
          res.render('pages/mylibrary', {
              title: 'My Library',
              username: userId,
              results: [], // Pass an empty array in case of an error
              error: 'Failed to fetch your songs. Please try again later.',
          });
      });
});







// *********************** LOGOUT API ROUTE **************************

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.render('pages/logout', {
      message: "You have successfully been logged out!"
  });
});

// *********************** CONVERTERS **************************

// Using Node-fetch API. Dynamically imported due to strange errors.
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Spotify API credentials
const spotifyApi = new SpotifyWebApi({
    clientId: '2ebf735cd56a46189a2558fe30c1733e',
    clientSecret: '460c2c3aaacc4e6cb737563dbc27d053'
});

app.post('/convertAudioToBase64', (req, res) => {
  const { filePath } = req.body;

  if (!filePath) {
      return res.status(400).json({ message: 'File path is required.' });
  }

  let base64Data = '';
  ffmpeg(filePath)
      .toFormat('mp3')
      .on('data', chunk => {
          base64Data += chunk.toString('base64');
      })
      .on('end', () => {
          res.status(200).json({ base64Encoding: base64Data });
      })
      .on('error', error => {
          console.error('Error converting to Base64:', error);
          res.status(500).json({ message: 'Failed to convert audio to Base64.' });
      });
});

// Spotify to MP3 conversion endpoint
app.post('/convertSpotify', async (req, res) => {
    const spotifyUrl = req.query.url;
    if (!spotifyUrl) {
        return res.status(400).send('Please provide a Spotify URL.');
    }

    const trackId = spotifyUrl.split('track/')[1];
    if (!trackId) {
        return res.status(400).send('Wrong Spotify URL.');
    }

    try {
        // Login to Spotify API
        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body['access_token']);

        // Getting track details from Spotify's API
        const trackData = await spotifyApi.getTrack(trackId);
        const { name, artists } = trackData.body;
        const artistName = artists[0].name;
        const title = `${artistName} - ${name}`;
        console.log(`Searching for: ${title}`); // Logging

        // Searching YouTube for the track
        const searchQuery = encodeURIComponent(`${artistName} ${name}`);
        const searchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
        const searchResponse = await fetch(searchUrl);
        const searchText = await searchResponse.text();

        // Get first video ID from search results on YouTube
        const videoIdMatch = searchText.match(/"videoId":"(.*?)"/);
        if (!videoIdMatch) {
            return res.status(404).send('Could not find the song on YouTube.');
        }
        const videoId = videoIdMatch[1];
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

        // Set headers for the HTTP response to ensure proper audio download
        res.setHeader('Content-disposition', `attachment; filename="${title}.mp3"`);
        res.setHeader('Content-type', 'audio/mpeg');

        // yt-dlp: Use yt-dlp to download audio (not ytdl-core)
        const ytDlpProcess = spawn('yt-dlp', ['-f', 'bestaudio', '-o', '-', youtubeUrl]);

        ytDlpProcess.stderr.on('data', data => {
            console.error(`yt-dlp error: ${data}`);
        });

        ytDlpProcess.on('error', err => {
            console.error('Error spawning yt-dlp:', err);
            res.status(500).send('Error fetching video with yt-dlp');
        });

        // Convert audio using ffmpeg and pipe it to response
        const ffmpegProcess = ffmpeg(ytDlpProcess.stdout)
            .setFfmpegPath(ffmpegLocation)
            .withAudioCodec('libmp3lame')
            .toFormat('mp3')
            .on('start', commandLine => console.log('FFmpeg command:', commandLine))
            .on('progress', progress => console.log('Processing:', progress))
            .on('stderr', stderrLine => console.log('Stderr output:', stderrLine))
            .on('end', () => {
                console.log('MP3 conversion and encoding finished.');
                res.send('MP3 conversion and encoding finished. Check console for output.');
            })
            .on('error', err => {
                console.error('Error during MP3 conversion:', err);
                res.status(500).send({ error: 'Error during MP3 conversion' });
            });

        // Output MP3 data as a Base64 string
        let mp3Data = [];
        ffmpegProcess.pipe()
            .on('data', chunk => mp3Data.push(chunk)) // Collect data in chunks
            .on('end', () => {
                const base64Audio = Buffer.concat(mp3Data).toString('base64');
                console.log('Base64 Encoded MP3:', base64Audio); // Output Base64 for testing
            });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An unexpected error occurred.');
    }
});

// YouTube video to MP3 conversion endpoint
app.post('/convertVideo', (req, res) => {
    const videoId = 'YG3EhWlBaoI'; // Example Video ID from YouTube, replace later with user input
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    // yt-dlp: Use yt-dlp to download audio
    const ytDlpProcess = spawn('yt-dlp', ['-f', 'bestaudio', '-o', '-', url]);

    ytDlpProcess.stderr.on('data', data => {
        console.error(`yt-dlp error: ${data}`);
    });

    ytDlpProcess.on('error', err => {
        console.error('Error with yt-dlp:', err);
        res.status(500).send('Error fetching video with yt-dlp');
    });

    // Convert audio using ffmpeg and pipe it to response
    const ffmpegProcess = ffmpeg(ytDlpProcess.stdout)
        .setFfmpegPath(ffmpegLocation)
        .withAudioCodec('libmp3lame')
        .toFormat('mp3')
        .on('start', commandLine => console.log('FFmpeg command:', commandLine))
        .on('progress', progress => console.log('Processing:', progress))
        .on('stderr', stderrLine => console.log('Stderr output:', stderrLine))
        .on('end', () => {
            console.log('MP3 conversion and encoding finished.');
            res.send('MP3 conversion and encoding finished. Check console for output.');
        })
        .on('error', err => {
            console.error('Error during MP3 conversion:', err);
            res.status(500).send({ error: 'Error during MP3 conversion' });
        });

    // Output MP3 data as a Base64 string
    let mp3Data = [];
    ffmpegProcess.pipe()
        .on('data', chunk => mp3Data.push(chunk)) // Collect data in chunks
        .on('end', () => {
            const base64Audio = Buffer.concat(mp3Data).toString('base64');
            console.log('Base64 Encoded MP3:', base64Audio); // Output Base64 for testing
        });
});

// Uncomment to start the server locally
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });



// *********************** UPLOAD AND SAVING AUDIO API ROUTES **************************

app.post('/add-song', async (req, res) => {
  const { songTitle, songGenre, songType, youtubeUrl, spotifyUrl, base64Encoding, libraryId } = req.body;

  if (!songTitle || !songGenre || !songType || !base64Encoding || !libraryId) {
      return res.status(400).json({ message: 'All fields are required.' });
  }

  const url = songType === 'youtube' ? youtubeUrl : spotifyUrl;

  const query = `
      INSERT INTO Projects (library_id, songTitle, songGenre, fileType, url, base64_encoding)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
  `;

  try {
      const data = await db.one(query, [libraryId, songTitle, songGenre, songType, url, base64Encoding]);
      res.status(200).json({
          message: 'Song successfully added!',
          project: data,
      });
  } catch (error) {
      console.error('Error adding song:', error);
      res.status(500).json({ message: 'Failed to add song. Please try again.' });
  }
});


app.get('/library', async (req, res) => {
  try {
      const query = 'SELECT * FROM Projects';
      const results = await db.query(query);
      res.render('library', { results: results.rows, title: 'Library' });
  } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).send('Internal Server Error');
  }
});

app.post('/api/save-audio', async (req, res) => {
  const { songTitle, songGenre, base64Encoding } = req.body;
  const libraryId = req.session.user.username; // Use the username as the library_id
  const libraryName = `${libraryId}'s Library`; // You can customize this

  console.log('Incoming payload:', req.body);

  if (!songTitle || !songGenre || !base64Encoding) {
      console.error('Missing required fields:', { songTitle, songGenre, base64Encoding });
      return res.status(400).send({ error: 'Missing required fields.' });
  }

  try {
      // Check if library_id exists in the Library table
      const libraryExistsQuery = `
          SELECT COUNT(*) FROM Library WHERE library_id = $1;
      `;
      const { count } = await db.one(libraryExistsQuery, [libraryId]);

      // If the library_id doesn't exist, insert it
      if (parseInt(count, 10) === 0) {
          const insertLibraryQuery = `
              INSERT INTO Library (library_id, library_name, user_id)
              VALUES ($1, $2, $3);
          `;
          await db.none(insertLibraryQuery, [libraryId, libraryName, libraryId]);
          console.log(`Library created for user: ${libraryId}`);
      }

      // Insert the new project
      const insertProjectQuery = `
          INSERT INTO Projects (library_id, songTitle, songGenre, fileType, base64_encoding)
          VALUES ($1, $2, $3, 'mp3', $4) RETURNING *;
      `;
      const values = [libraryId, songTitle, songGenre, base64Encoding];

      console.log('Executing query:', insertProjectQuery);
      console.log('With values:', values);

      const result = await db.one(insertProjectQuery, values);

      console.log('Database insert successful:', result);

      res.status(200).send({ success: true, project: result });
  } catch (error) {
      console.error('Error in /api/save-audio route:', error.message, error.stack);
      res.status(500).send({ error: 'Internal server error while saving audio.' });
  }
});


app.post('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
      const query = 'DELETE FROM Projects WHERE project_id = $1';
      await db.query(query, [id]);

      res.redirect('/mylibrary');
  } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).send('Internal Server Error');
  }
});

app.get('/visualizer', async (req, res) => {
  console.log("In visualizer");
  const { projectID } = req.query;

  if (!projectID) {
      return res.status(400).send('No project ID provided.');
  }

  try {
      // Fetch the project details using the projectID
      const query = 'SELECT * FROM Projects WHERE project_id = $1';
      const project = await db.one(query, [projectID]);

      res.render('visualizer', {
          title: 'Audio Visualizer',
          projectID,
          base64Encoding: project.base64_encoding, // Pass the Base64 data for visualization
      });
  } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).send('Failed to load the visualizer.');
  }
});




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

app.listen(3000, () => {
    console.log('Server is listening on port 3000');
});


// TESTING FROM LAB 11

// module.exports = app.listen(3000);

