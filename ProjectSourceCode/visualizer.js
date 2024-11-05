//Audio input from DOM
const audioInput = document.getElementById("audio");
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
  } else {
    alert("Invalid File Type!");
  }
}