//Ensures DOM content is loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
  //Audio input from DOM and visualiser area
  const area = document.getElementById("visualiser");
  const label = document.getElementById("label");
  //Global Variables for the visualizer
  let noise = new SimplexNoise();
  let renderer;
  let context;
  let source;
  let analyser;
  let isPlaying = false;
  let isVisualizerInitialized = false;
  let animationId;

  //Error handling for missing DOM elements
   if (!area){
      console.error("Visualiser area missing from DOM");
      return;
  }
  if (!label){
        console.error("Label missing from DOM");
        return;
  }
  
  //Fetching Audio from database
async function fetchAndVisualizeAudio(projectId) {
  try {
    const response = await fetch(`/project/${projectId}`);
    // Check if the response is OK (status 200)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
  }
    const data = await response.json();
    console.log("Fetched Data:", data);
    console.log("Audio Data:", data.base64Encoding);
    if (data.base64Encoding) {
      decodeAudioFromBase64(data.base64Encoding);
    } else {
      console.error("No base64 encoding");
    }
  } catch (error) {
    console.error("Error getting base64 audio", error);
  }
}
//Removes canvas elements to clear scene
function clearScene() {
  if (area && renderer) {
    const canvas = renderer.domElement; //Gets canvas from Three JS
    if (canvas && canvas.parentElement === area) {
      area.removeChild(canvas); //Removes the canvas from DOM
      renderer.dispose(); //Dispose the renderer
      renderer = null; //Reset the renderer
      console.log("Canvas and renderer cleared.");
    }
  } else {
    console.error("Visualizer container (#visualiser) or renderer is not properly initialized.");
  }
}

//Decodes the base64 audio input for the visualizer
async function decodeAudioFromBase64(base64Input){
  try {
    //Validates base64 input
    const isBase64 = (str) => {
      try {
        return btoa(atob(str)) === str;
      } catch (e) {
        return false;
      }
    };
    //error handling
    if (!isBase64(base64Input)) {
      console.error("Invalid Base64 string");
      return;
    }
  //decodes the original base 64 string to a binary string and store it as a typed array converted to bytes
  const binaryAudio = atob(base64Input);
  const len = binaryAudio.length;
  const bytes = new Uint8Array(len);
  //converting each character in the binary string to bytes
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryAudio.charCodeAt(i);
  }
  //Creating the audio context
  if (!context) {
    context = new (window.AudioContext || window.webkitAudioContext)();
    console.log("Audio context created");
  }
  //Creating the audio context and decoding the binary data to the audiobuffer
  const audioBuffer = await context.decodeAudioData(bytes.buffer); 
  console.log("Audio buffer decoded");

  //start visualiser
  clearScene();
  startVis(audioBuffer, context);

  if (audioBuffer) {
        if (source) {
          source.stop(); //Stops the previous source if it still exists
        }
        source = context.createBufferSource();
        source.buffer = audioBuffer;
        analyser = context.createAnalyser();
        source.connect(analyser);
        analyser.connect(context.destination);

        source.start();
        isPlaying = true;
      }
  
  //Marking the visualizer as initialized
  isVisualizerInitialized = true;
  console.log("Visualizer initialized");
} catch (error) {
  // Handle Specific Errors
  if (error.name === "Encoding Error") {
    console.error("Decoding failed");
    console.error("- Corrupted or invalid Base64 string");
    console.error("- Incompatible audio format (expected MP3 or WAV)");
  } else {
    console.error("Unexpected error during audio decoding:", error);
  }
}
}

//Helper to toggle play/pause
function togglePlayPause() {
  if (!context || !source) {
    console.error("Audio context or source is not initialized.");
    return;
  }

  if (isPlaying) {
    //Stop the audio and visualiser
    source.stop();
    cancelAnimationFrame(animationId);
    isPlaying = false;
    // Pause icon path
    playButton.innerHTML = `<path d="M4 3h3v10H4zM9 3h3v10H9z"/>`;
    console.log("Audio paused");
  } else {
    //Restarting audio and visualiser
    const newSource = context.createBufferSource();
    newSource.buffer = source.buffer;
    newSource.connect(analyser);
    analyser.connect(context.destination);
    newSource.start(0);
    //Updates the new source and restarts visualiser
    source = newSource; 
    
    render();
    isPlaying = true;
    // Play icon
    playButton.innerHTML = `<path d="M10.804 8 5 4.633v6.734zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696z"/>`;
    console.log("Audio playing");
  }}

  //Helper function to reset visualiser
  function resetVisualizer() {
    //Reset the sphere
    sphere.geometry.dispose(); // Dispose of the old geometry
    const geometry = new THREE.IcosahedronGeometry(20, 3);
    sphere.geometry = geometry;

    //Reset every vertex to original position
    sphere.geometry.verticesNeedUpdate = true;
    sphere.geometry.computeVertexNormals();
    sphere.geometry.computeFaceNormals();

    console.log("Visualizer reset");
  }
  //Play/Pause functionality when clicking on the visualiser
  area.addEventListener('click', async () => {
    if (!isVisualizerInitialized) {
      await fetchAndVisualizeAudio(1); //Fetches and visualises audio
      render();
    } else {
      // If initialized, toggle play/stop
      togglePlayPause();
    }
  });

  //Starting the visualizer
  function startVis(audioBuffer, context) {
    if (isVisualizerInitialized) {
      return;
    }
    analyser = context.createAnalyser();
    analyser.fftSize = 512;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    clearScene();
  
    //Initiliazing the scene, camera, and renderer for the visualiser
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, area.clientWidth / area.clientHeight, 0.1, 1000);
    camera.position.z = 100;
    //Rendering the scene using WEBGL with antialiasing which will make rendering smoother
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(area.clientWidth, area.clientHeight);
    renderer.setClearColor("#a959b5");
    area.appendChild(renderer.domElement);
  
    //Creating a geometry mesh with 20 sides
    const geometry = new THREE.IcosahedronGeometry(20, 3);
    const material = new THREE.MeshLambertMaterial({ color: "#0048ba", wireframe: true });
    const sphere = new THREE.Mesh(geometry, material);
  
    //Adding a light source set above the mesh for lightning
    const light = new THREE.DirectionalLight("#d6b6db", 0.8);
    light.position.set(0, 50, 100);
    scene.add(light);
    scene.add(sphere);
  
    //Resize handler for renderer
    window.addEventListener('resize', () => {
      renderer.setSize(area.clientWidth, area.clientHeight);
      camera.aspect = area.clientWidth / area.clientHeight;
      camera.updateProjectionMatrix();
    });
  
    //Function to stop rendering
    function stopRender() {
      if (animationId) {
        cancelAnimationFrame(animationId); //Stops animation loop
        animationId = null; //Reset animation ID
      }
    }
    //Rendering out the 3D mesh based on frequency
    render = function() {
      analyser.getByteFrequencyData(dataArray);
      //calculating initial frequency data
      const lowerHalf = dataArray.slice(0, (dataArray.length / 2) - 1);
      const upperHalf = dataArray.slice((dataArray.length / 2) - 1, dataArray.length - 1);
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
      renderer.render(scene, camera);
      //saves animation state
      animationId = requestAnimationFrame(render);
    };
    //Helper for frequency data mesh warping
    function WarpSphere(mesh, bassFrequency, trebleFrequency) {
      //Iterates through each vertex of the mesh and applies a multiplier to the position
      mesh.geometry.vertices.forEach(function (vertex, i) {
        const offset = mesh.geometry.parameters.radius;
        const amp = 7;
        //Time for noise calculation
        const time = window.performance.now();
        //Normalizing it retains the general shape of the mesh
        vertex.normalize();
        //multiplier for noise frequency
        const rf = 0.00001;
        const distance = (offset + bassFrequency) + noise.noise3D(vertex.x + time * rf * 4, vertex.y + time * rf * 6, vertex.z + time * rf * 7) * amp * trebleFrequency * 2;
        vertex.multiplyScalar(distance);
      });
      //Update mesh positions
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
    const fr = normalize(value, minValue, maxValue);
    const delta = outMax - outMin;
    return outMin + (fr * delta);
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