// JavaScript for Play/Pause Functionality
  const playButton = document.getElementById('play-button');
  const audioElement = document.getElementById('audio');
  let audio = null;  // Will store the audio player instance

  // Load the audio file when user selects it
  document.getElementById('audio').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
      const fileURL = URL.createObjectURL(file);
      audio = new Audio(fileURL);
      audio.loop = false;  // Set whether the audio should loop
    }
  });

  // Play/pause functionality when play button (SVG) is clicked
  playButton.addEventListener('click', function () {
    if (!audio) {
      alert("Please pick a song to play.");
      return;
    }

    if (audio.paused) {
      audio.play();
      // Switch to pause icon when playing
      playButton.innerHTML = `<path d="M4 3h3v10H4zM9 3h3v10H9z"/>`;  // Pause icon path
    } else {
      audio.pause();
      // Switch to play icon when paused
      playButton.innerHTML = `<path d="M10.804 8 5 4.633v6.734zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696z"/>`;  // Play icon path
    }
  });

