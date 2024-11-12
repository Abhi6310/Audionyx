// //REQUIRED PACKAGES AND TOOLS:
// //-express
// //-fluent-ffmpeg
// //-ffmppeg
// //-yt-dlp
// //Here is a single command to install everything required on Debian based systems: sudo apt update && sudo apt install -y ffmpeg yt-dlp && npm install express fluent-ffmpeg

// const express = require('express'); //Used to create simple web server for testing
// const ffmpeg = require('fluent-ffmpeg'); //ffmpeg to handle audio processing
// const {spawn} = require('child_process'); //Create child process for yt-dlp
// const app = express();
// const ffmpegLocation = '/usr/bin/ffmpeg'; //Path to ffmpeg

// const pool = new Pool({
//     user: 'yourusername',
//     host: 'localhost',
//     database: 'yourdatabase',
//     password: 'yourpassword',
//     port: 5432,
// });

// //Convert video
// app.get('/convertVideo', async (req, res) =>
//     {
//     const videoId = 'YG3EhWlBaoI'; //Video ID from Youtube, change later for user input.
//     const title = 'Luke'; //Change
//     const url = `https://www.youtube.com/watch?v=${videoId}`; //Make sure user input is correct

//     //Headers for http response, makes sure audio is downloaded properly
//     res.setHeader('Content-disposition', `attachment; filename="${title}.mp3"`);
//     res.setHeader('Content-type', 'audio/mpeg');
//     //yt-dlp: https://github.com/yt-dlp/yt-dlp, tried using ytdl-core but youtube didn't like it
//     const ytDlpProcess = spawn('yt-dlp', ['-f', 'bestaudio', '-o', '-', url]); //Pull only the audio using a new yt-dlp child proces and use best audio setting

//     ytDlpProcess.stderr.on('data', data => //Error catching
//     {
//         console.error(`yt-dlp error: ${data}`);
//     });

//     ytDlpProcess.on('error', err => //More error catching
//     {
//         console.error('Error spawning yt-dlp:', err);
//         res.status(500).send('Error fetching video with yt-dlp');
//     });

//     //Pipe yt-dlp audio stream output to ffmpeg in order to convert to MP3
//     const ffmpegProcess = new ffmpeg({source: ytDlpProcess.stdout})//using fluent-ffmpeg, sets source as ytDlpProcess.stdout and audio stream from yt-dlp
//         .setFfmpegPath(ffmpegLocation)//location
//         .withAudioCodec('libmp3lame')//Uses libmp3lame codec to convert https://trac.ffmpeg.org/wiki/Encode/MP3
//         .toFormat('mp3')//sets format as mp3
//         .output(res)
//         .on('start', commandLine => console.log('FFmpeg command:', commandLine))//Logs ffmpeg
//         .on('progress', progress => console.log('Processing:', progress))//Logs details
//         .on('stderr', stderrLine => console.log('Stderr output:', stderrLine))//Logs when its over
//         .on('end', () => console.log('MP3 conversion finished'))
//         .on('error', (err) => //Error
//         {
//             console.error('Error during MP3 conversion:', err);
//             res.status(500).send('Error during MP3 conversion');
//         })
//         .run();
// });

// const PORT = process.env.PORT || 3000; //Local server to get it working.
// app.listen(PORT, () => 
// {
//     console.log(`Server is running on port ${PORT}`);
// });

const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const { spawn } = require('child_process');
const { Pool } = require('pg');

const app = express();
const ffmpegLocation = '/usr/bin/ffmpeg'; // Path to ffmpeg

// Set up PostgreSQL connection
const pool = new Pool({
    user: 'yourusername',
    host: 'localhost',
    database: 'yourdatabase',
    password: 'yourpassword',
    port: 5432,
});

// Convert and store video as Base64 in Projects table
app.get('/convertAndStore', async (req, res) => {
    const videoId = req.query.videoId || 'YG3EhWlBaoI'; // Dynamic video ID
    const title = req.query.title || 'Project Name';    // Project name
    const description = req.query.description || 'Project description';
    const libraryId = req.query.library_id || 1;        // Default to library_id 1 for now

    const url = `https://www.youtube.com/watch?v=${videoId}`;

    const ytDlpProcess = spawn('yt-dlp', ['-f', 'bestaudio', '-o', '-', url]);
    const chunks = []; // Array to store audio data chunks

    ytDlpProcess.stderr.on('data', data => console.error(`yt-dlp error: ${data}`));
    ytDlpProcess.on('error', err => {
        console.error('Error spawning yt-dlp:', err);
        res.status(500).send('Error fetching video with yt-dlp');
    });

    // Convert to MP3 and store in chunks array
    const ffmpegProcess = new ffmpeg({ source: ytDlpProcess.stdout })
        .setFfmpegPath(ffmpegLocation)
        .withAudioCodec('libmp3lame')
        .toFormat('mp3')
        .on('data', chunk => chunks.push(chunk))
        .on('end', () => {
            const buffer = Buffer.concat(chunks);
            const base64Audio = buffer.toString('base64');

            // Store in PostgreSQL database
            storeInProjects(title, description, base64Audio, libraryId)
                .then(() => {
                    res.send("Audio successfully stored in database.");
                })
                .catch(err => {
                    console.error('Database error:', err);
                    res.status(500).send('Error storing audio in database');
                });
        })
        .on('error', (err) => {
            console.error('Error during MP3 conversion:', err);
            res.status(500).send('Error during MP3 conversion');
        })
        .run();
});

// Function to insert project data into the Projects table
function storeInProjects(projectName, description, base64Encoding, libraryId) {
    const query = `
        INSERT INTO Projects (project_name, description, base64_encoding, library_id)
        VALUES ($1, $2, $3, $4)
    `;
    const values = [projectName, description, base64Encoding, libraryId];
    
    return pool.query(query, values);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
