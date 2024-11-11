//REQUIRED PACKAGES AND TOOLS:
//-express
//-fluent-ffmpeg
//-ffmppeg
//-yt-dlp
//Here is a single command to install everything required on Debian based systems: sudo apt update && sudo apt install -y ffmpeg yt-dlp && npm install express fluent-ffmpeg

const express = require('express'); //Used to create simple web server for testing
const ffmpeg = require('fluent-ffmpeg'); //ffmpeg to handle audio processing
const {spawn} = require('child_process'); //Create child process for yt-dlp
const app = express();
const ffmpegLocation = '/usr/bin/ffmpeg'; //Path to ffmpeg

//Convert video
app.get('/convertVideo', async (req, res) =>
    {
    const videoId = 'YG3EhWlBaoI'; //Video ID from Youtube, change later for user input.
    const title = 'Luke'; //Change
    const url = `https://www.youtube.com/watch?v=${videoId}`; //Make sure user input is correct

    //Headers for http response, makes sure audio is downloaded properly
    res.setHeader('Content-disposition', `attachment; filename="${title}.mp3"`);
    res.setHeader('Content-type', 'audio/mpeg');
    //yt-dlp: https://github.com/yt-dlp/yt-dlp, tried using ytdl-core but youtube didn't like it
    const ytDlpProcess = spawn('yt-dlp', ['-f', 'bestaudio', '-o', '-', url]); //Pull only the audio using a new yt-dlp child proces and use best audio setting

    ytDlpProcess.stderr.on('data', data => //Error catching
    {
        console.error(`yt-dlp error: ${data}`);
    });

    ytDlpProcess.on('error', err => //More error catching
    {
        console.error('Error spawning yt-dlp:', err);
        res.status(500).send('Error fetching video with yt-dlp');
    });

    //Pipe yt-dlp audio stream output to ffmpeg in order to convert to MP3
    const ffmpegProcess = new ffmpeg({source: ytDlpProcess.stdout})//using fluent-ffmpeg, sets source as ytDlpProcess.stdout and audio stream from yt-dlp
        .setFfmpegPath(ffmpegLocation)//location
        .withAudioCodec('libmp3lame')//Uses libmp3lame codec to convert https://trac.ffmpeg.org/wiki/Encode/MP3
        .toFormat('mp3')//sets format as mp3
        .output(res)
        .on('start', commandLine => console.log('FFmpeg command:', commandLine))//Logs ffmpeg
        .on('progress', progress => console.log('Processing:', progress))//Logs details
        .on('stderr', stderrLine => console.log('Stderr output:', stderrLine))//Logs when its over
        .on('data', (chunk) => audioChunks.push(chunk)) //Store each chunk of audio data in array
        .on('end', () => 
            { //After converting, encode and send data as Base64
            const audioBuffer = Buffer.concat(audioChunks);
            const base64Audio = audioBuffer.toString('base64');
            res.json({audio: base64Audio});
            console.log('MP3 conversion finished and sent as Base64');
        })
        .on('error', (err) => //Error
        {
            console.error('Error during MP3 conversion:', err);
            res.status(500).send('Error during MP3 conversion');
        })
        .run();
});

const PORT = process.env.PORT || 3000; //Local server to get it working.
app.listen(PORT, () => 
{
    console.log(`Server is running on port ${PORT}`);
});
