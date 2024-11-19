//REQUIRED PACKAGES AND TOOLS:
//-express
//-fluent-ffmpeg
//-ffmppeg
//-yt-dlp
//Here is a single command to install everything required on Debian based systems: sudo apt update && sudo apt install -y ffmpeg yt-dlp && npm install express fluent-ffmpeg
//Not sure how the install will work on other computers

const express = require('express'); //Used to create simple web server for testing
const ffmpeg = require('fluent-ffmpeg'); //ffmpeg to handle audio processing
const {spawn} = require('child_process'); //Create child process for yt-dlp
const app = express();
const ffmpegLocation = '/usr/bin/ffmpeg'; //Path to ffmpeg

//Convert video
app.get('/convertVideo', (req, res) =>
    {
    const videoId = 'YG3EhWlBaoI'; //Video ID from Youtube, change later for user input.
    const url = `https://www.youtube.com/watch?v=${videoId}`; //Make sure user input is correct
    //yt-dlp: https://github.com/yt-dlp/yt-dlp, tried using ytdl-core but youtube didn't like it
    const ytDlpProcess = spawn('yt-dlp', ['-f', 'bestaudio', '-o', '-', url]); //Pull only the audio using a new yt-dlp child proces and use best audio setting

    ytDlpProcess.stderr.on('data', data => console.error(`yt-dlp error: ${data}`));

    ytDlpProcess.on('error', err => //More error catching
    {
        console.error('Error with yt-dlp:', err);
        res.status(500).send('Error fetching video with yt-dlp');
    });

    //Pipe yt-dlp output directly to ffmpeg for conversion
    const ffmpegProcess = ffmpeg(ytDlpProcess.stdout)//using fluent-ffmpeg, sets source as ytDlpProcess.stdout and audio stream from yt-dlp
        .setFfmpegPath(ffmpegLocation)//location
        .withAudioCodec('libmp3lame')//Uses libmp3lame codec to convert https://trac.ffmpeg.org/wiki/Encode/MP3
        .toFormat('mp3')//sets format as mp3
        .on('start', commandLine => console.log('FFmpeg command:', commandLine))//Logs ffmpeg
        .on('progress', progress => console.log('Processing:', progress))//Logs details
        .on('stderr', stderrLine => console.log('Stderr output:', stderrLine))//Logs when its over
        .on('end', () => 
        {
        console.log('MP3 conversion and encoding finished.');
        res.send('MP3 conversion and encoding finished. Check console for output.');
        })
        .on('error', err => 
        {
        console.error('Error during MP3 conversion:', err);
        res.status(500).send({ error: 'Error during MP3 conversion' });
        });
    //Output MP3 data as a Base64 string
    let mp3Data = [];
    ffmpegProcess.pipe()
    .on('data', chunk => mp3Data.push(chunk)) //Collect data in chunks
    .on('end', () => 
    {
    const base64Audio = Buffer.concat(mp3Data).toString('base64'); //convert base64 to string
    console.log('Base64 Encoded MP3:', base64Audio);//output string to console for testing
    });
    });
const PORT = process.env.PORT || 3000;//Change to support docker later but currently set up for local testing 
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
