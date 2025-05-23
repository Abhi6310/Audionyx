//Ensures DOM content is loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
//Audio input from DOM
const audioInput = document.getElementById("audio");
let noise = new SimplexNoise(); //Simplex noise used for animating warping effect
//Creating the visualiser area
const area = document.getElementById("visualiser");
const label = document.getElementById("label");

//Error handling for missing elements
if (!audioInput) {
  console.error("Audio missing from DOM");
}else if (!area){
    console.error("Visualiser area is missing from  DOM");
}else if (!label){
      console.error("Label is missing from the DOM.");
    }

//Decodes the base64 for the visualizer
async function decodeAudioFromBase64(base64Input){
  //decode the original base 64 string to a binary string
  const binaryAudio = atob(base64Input);
  const len = binaryAudio.length;
  //makes a typed array that stores the binary data as bytes
  const bytes = new Uint8Array(len);
  //converting each character in the binary string to bytes
  for (let i = 0; i < len; i++) {
      bytes[i] = binaryAudio.charCodeAt(i);
  }
  //Creating the audio context for the web audio api
  const context = new (window.AudioContext || window.webkitAudioContext)();
  //Decoding the binary data into an audio buffer
  const audioBuffer = await context.decodeAudioData(bytes.buffer);
  //Cleaning up the scene area and starting visualiser with audio
  clearScene();
  startVis(audioBuffer, context);
}

//Detecting for audio file selection to test
audioInput.addEventListener("change", setAudio, false);
let audio = new Audio();
//Handles audio file setup
function setAudio() {
  audio.pause();  //Pauses playing audio and gets the right file
  const audioFile = this.files[0];  
  if (audioFile && audioFile.name.includes(".mp3")) { //Double checking file type for mp3
    const audioURL = URL.createObjectURL(audioFile); //Creates the audio object and element with file
    audio = new Audio(audioURL);

    //Sets up the initial visualizer with audio element
    const context = new (window.AudioContext || window.webkitAudioContext)();
    
    //Audio starts playing when the user clicks on the visualizer
    audio.onplay = () => {
      //Clean up the scene and start the visualizer
      clearScene();
      startVis(undefined, context);
    };
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
function startVis(audioBuffer, context) {
  // //Creating the audio source node to play audio
  // const source = context.createBufferSource();
  // //links the convered audio buffer to the source
  // source.buffer = audioBuffer;

  //TESTING
  // const source = audioBuffer ? context.createBufferSource() : context.createMediaElementSource(audio);
  // if (audioBuffer) source.buffer = audioBuffer;
  let source
  if (audioBuffer) {
    source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.start();
  } else {
    source = context.createMediaElementSource(audio);
  }
  
  //Creating the analyser node for frequency data for visualizer
  const analyser = context.createAnalyser();
  //connecting source to the analyzer and its output and starts playing
  source.connect(analyser);
  analyser.connect(context.destination);
  
  
  analyser.fftSize = 512; //Setting the FFT size for the analyzer (# of frequency bins)
  const bufferLength = analyser.frequencyBinCount;  //Finding the number of data points
  const dataArray = new Uint8Array(bufferLength); //Storing for the frequency data

  //Initiliazing the scene, camera, and renderer for threejs
  //Essentially creating a bunch of objects with an offset camera that lets us see into the scene
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 100;
  //Rendering the scene using WEBGL with antialiasing which will make rendering smoother
  const renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor("#838b8b");
  //Adding the renderer to the DOM
  area.appendChild(renderer.domElement);

  //Creating a geometry object with 20 sides
  const geometry = new THREE.IcosahedronGeometry(20, 3);
  //Making a texture mesh for the object
  const material = new THREE.MeshLambertMaterial({ color: "#0048ba", wireframe: true });
  //Combining the shape and mesh for the final mesh object
  const sphere = new THREE.Mesh(geometry, material);

  //Adding a light source set above the Mesh for lightning
  const light = new THREE.DirectionalLight("#ffffff", 0.8);
  light.position.set(0, 50, 100);
  scene.add(light);
  scene.add(sphere);

  //In case the window gets resized, adjust the renderer accordingly
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  //render the scene and update the 3D based on audio frequency
  function render() {
    //Getting the frequency data from the analyzer
    analyser.getByteFrequencyData(dataArray);
    //Splitting the data into two halves 
    const lowerHalf = dataArray.slice(0, (dataArray.length / 2) - 1);
    const upperHalf = dataArray.slice((dataArray.length / 2) - 1, dataArray.length - 1);
    //Finding the max and average of the two halves
    const lowerMax = max(lowerHalf);
    const upperAvg = avg(upperHalf);
    //Normalizing the values
    const lowerMaxFr = lowerMax / lowerHalf.length;
    const upperAvgFr = upperAvg / upperHalf.length;
    //Rotates the sphere slightly in all directions to give an animated spinning effect
    sphere.rotation.x += 0.001;
    sphere.rotation.y += 0.003;
    sphere.rotation.z += 0.005;
    //Changing the mesh's parameters based on the frequency data which creates a warping effect
    WarpSphere(sphere, modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4));
    //requesting the next frame in order to continously render
    requestAnimationFrame(render);
    //Renders the scene from the perspective of the camera object
    renderer.render(scene, camera);
  }
  //Helper to alter sphere mesh based on frequency data
  function WarpSphere(mesh, bassFr, treFr) {
    //Iterates through each vertex of the mesh
    mesh.geometry.vertices.forEach(function (vertex, i) {
      //finding the current radius
      const offset = mesh.geometry.parameters.radius;
      const amp = 7;
      //getting current time for animation calculations
      const time = window.performance.now();
      //Normalizing it retains the general shape of the mesh
      vertex.normalize();
      //multiplier for noise frequency
      const rf = 0.00001;
      //Calculating the distance to move the vertex based on the frequency data
      const distance = (offset + bassFr) + noise.noise3D(vertex.x + time * rf * 4, vertex.y + time * rf * 6, vertex.z + time * rf * 7) * amp * treFr * 2;
      //scaling the position by our calculated distance
      vertex.multiplyScalar(distance);
    });
    //Makes sure the mesh updates with the new vertex positions
    mesh.geometry.verticesNeedUpdate = true;
    mesh.geometry.computeVertexNormals();
    mesh.geometry.computeFaceNormals();
  }
  //starting the rendering loop
  render();
}

//Normalizes the value to a specific range 
function normalize(value, minValue, maxValue) {
  return (value - minValue) / (maxValue - minValue);
}
//Scaling the value to a new range
function modulate(value, minValue, maxValue, outMin, outMax) {
  const fr = normalize(value, minValue, maxValue); //Normalizing the value
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
});