//REQUIRED PACKAGES AND TOOLS:
//-express
//-fluent-ffmpeg
//-ffmppeg
//-yt-dlp
//spotify-web-api-node
//Again, here is the command to install everything: npm install express fluent-ffmpeg node-fetch spotify-web-api-node

const express = require('express'); //Used to create simple web server for testing
const ffmpeg = require('fluent-ffmpeg'); //ffmpeg to handle audio processing
const {spawn} = require('child_process'); //Create child process for yt-dlp
const SpotifyWebApi = require('spotify-web-api-node'); //For Spotify API
const app = express();
const ffmpegLocation = '/usr/bin/ffmpeg'; //Path to ffmpeg

//Using Node-fetch API. I had to import it dynamically as I was getting strange errors without doing it. Here is how I found out about it: https://stackoverflow.com/questions/69087292/requirenode-fetch-gives-err-require-esm
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

//Spotify API ID's
const spotifyApi = new SpotifyWebApi({
    clientId: '2ebf735cd56a46189a2558fe30c1733e',
    clientSecret: '460c2c3aaacc4e6cb737563dbc27d053'
});

//Spotify to MP3 endpoint
app.get('/convertSpotify', async (req, res) => 
    {
    const spotifyUrl = req.query.url;
    if (!spotifyUrl)
    {
        return res.status(400).send('Please provide Spotify URL.');
    }
    //Use Spotify API to get song ID
    const trackId = spotifyUrl.split('track/')[1];
    if (!trackId) 
    {
        return res.status(400).send('Wrong Spotify URL.');
    }
    try 
    {
        //Login to Spotify API
        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body['access_token']);

        //Getting track details from Spotify's API
        const trackData = await spotifyApi.getTrack(trackId);
        const { name, artists } = trackData.body;
        const artistName = artists[0].name;
        const title = `${artistName} - ${name}`;
        console.log(`Searching for: ${title}`);//logging

        //Searching YouTube for the track as Spotify's API only allows a 30 second download.
        const searchQuery = encodeURIComponent(`${artistName} ${name}`);
        const searchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
        const searchResponse = await fetch(searchUrl);
        const searchText = await searchResponse.text();

        //Get first video ID from the search results on youtube
        const videoIdMatch = searchText.match(/"videoId":"(.*?)"/);
        if (!videoIdMatch) {
            return res.status(404).send('Could not find the song on YouTube.');
        }
        const videoId = videoIdMatch[1];
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

        //Headers for http response, makes sure audio is downloaded properly
        res.setHeader('Content-disposition', `attachment; filename="${title}.mp3"`);
        res.setHeader('Content-type', 'audio/mpeg');

        //yt-dlp: https://github.com/yt-dlp/yt-dlp, tried using ytdl-core but youtube didn't like it
        const ytDlpProcess = spawn('yt-dlp', ['-f', 'bestaudio', '-o', '-', youtubeUrl]);  //Pull only the audio using a new yt-dlp child proces and use best audio setting

        ytDlpProcess.stderr.on('data', data => //error catching
        {
            console.error(`yt-dlp error: ${data}`);
        });

        ytDlpProcess.on('error', err => //more error catching
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
        .on('end', () => console.log('MP3 conversion finished'))
        .on('error', (err) => //Error
    {
        console.error('Error during MP3 conversion:', err);
        res.status(500).send('Error during MP3 conversion');
    })
    .run();
    }
    catch (error)
    {
        console.error('Error processing Spotify track:', error);
        res.status(500).send('Failed to process Spotify track.');
    }
});

const PORT = process.env.PORT || 3000; //Local server to get it working.
app.listen(PORT, () => 
{
    console.log(`Server is running on port ${PORT}`);
});
