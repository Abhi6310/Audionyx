//Audio input from DOM
const audioInput = document.getElementById("audio");
let noise = new SimplexNoise(); //Simplex noise used for animating warping effect
//Creating the visualizer area
const area = document.getElementById("visualiser");
const label = document.getElementById("label");

//Detecting for audio file selection to test
audioInput.addEventListener("change", setAudio, false);
let audio = new Audio();
//handles audio file setup
function setAudio() {
  audio.pause();  //Pauses currently playing audio and gets the selected file
  const audioFile = this.files[0];  
  if (audioFile && audioFile.name.includes(".mp3")) { //making sure the file is mp3
    const audioURL = URL.createObjectURL(audioFile); //makes a URL for the audio file
    audio = new Audio(audioURL); //Using the file this creates the audio object
    //cleaning up the scene area and starting visualiser
    clearScene();
    startVis();
  } else {
    alert("Invalid File Type!");
  }
}

//Play/Pause functionality for clicking on the visualizer
area.addEventListener('click', async () => {
  //Audio context is the interface for an audio-processing graph built from linked audio modules
  //Pretty much a linked list of audio nodes in concept
  const context = new (window.AudioContext || window.webkitAudioContext)();
  await context.resume(); // Resume AudioContext when user interacts
  //If the audio is paused, it replays, if it is playing, it pauses
  if (audio.paused) {
    audio.play();
    //removes the button and prompt when the audio is playing
    label.style.display = "none";
  } else {
    audio.pause();
    label.style.display = "flex";
  }
});
//removes all existing canvas elements effectively clearing the scene
function clearScene() {
  const canvas = area.firstElementChild;
  //removes all elements
  if (canvas) {
    area.removeChild(canvas);
  }
}
//starting the visualizer
function startVis() {
  //adding functionality next
}

//Normalizes the value to a specific range 
function fractionate(val, minVal, maxVal) {
  return (val - minVal) / (maxVal - minVal);
}
//Modulates the value to a new range
function modulate(val, minVal, maxVal, outMin, outMax) {
  const fr = fractionate(val, minVal, maxVal); //Normalizing the value
  const delta = outMax - outMin;  //Calculating output range
  return outMin + (fr * delta); //Scaling and retuning value in output range
}
//Calculates the average of an array
function avg(arr) {
  return arr.reduce((sum, b) => sum + b) / arr.length;
}
//Calculates the max value of an array
function max(arr) {
  return arr.reduce((a, b) => Math.max(a, b));
}
