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
    if (data.base64Encoding) {
      decodeAudioFromBase64(data.base64Encoding);
    } else {
      console.error("No base64 encoding");
    }
  } catch (error) {
    console.error("Error getting base64 audio", error);
  }
}

//Decodes the base64 audio input for the visualizer
async function decodeAudioFromBase64(base64Input){
  // //decodes the original base 64 string to a binary string and store it as a typed array converted to bytes
  // const binaryAudio = atob(base64Input);
  // const len = binaryAudio.length;
  // const bytes = new Uint8Array(len);
  // //converting each character in the binary string to bytes
  // for (let i = 0; i < len; i++) {
  //   bytes[i] = binaryAudio.charCodeAt(i);
  // }
  // //Creating the audio context and decoding the binary data to the audiobuffer
  // const context = new (window.AudioContext || window.webkitAudioContext)();
  // const audioBuffer = await context.decodeAudioData(bytes.buffer);
  
  // clearScene();
  // startVis(audioBuffer, context);

  //////////////////////////////////////////
// Remove any data URL prefix if present
// const base64Data = base64Input.includes(",") ? base64Input.split(",")[1].trim() : base64Input.trim();
const base64Data = "UklGRngAAABXQVZFZm10IBAAAAABAAEAgD4AAIA+AAABAAgAAAB9AAACABAAZGF0YQAAAAA=";
// Decode base64 to binary string
let binaryString;
try {
    binaryString = atob(base64Data);
} catch (error) {
    console.error("Error decoding base64 data:", error);
    return;
}

// Convert binary string to an ArrayBuffer
const len = binaryString.length;
const bytes = new Uint8Array(len);
for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
}

// Create AudioContext and decode audio data
const context = new (window.AudioContext || window.webkitAudioContext)();
try {
    const audioBuffer = await context.decodeAudioData(bytes.buffer);
    clearScene();
    startVis(audioBuffer, context);
} catch (error) {
    console.error("Error decoding audio data:", error);
}
//////////////////////////////////////////

}

//Ensures DOM content is loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
  //Audio input from DOM and visualiser area
  const area = document.getElementById("visualiser");
  const label = document.getElementById("label");

  let noise = new SimplexNoise(); //Simplex noise used for animating warping effect
  let context;
  let source;
  let isVisualizerInitialized = false;

  //Error handling for missing DOM elements
   if (!area){
      console.error("Visualiser area is missing from  DOM");
      return;
  }
  if (!label){
        console.error("Label is missing from the DOM.");
        return;
  }
  
  //Play/Pause functionality when clicking on the visualiser
  area.addEventListener('click', async () => {
    if (!isVisualizerInitialized){
      fetchAndVisualizeAudio(1); // Fetch and visualize audio
    } 
  });

  //Removes canvas elements to clear scene
  function clearScene() {
    const canvas = area.firstElementChild;
    if (canvas) {
      area.removeChild(canvas);
    }
  }
  
  //Starting the visualizer
  function startVis(audioBuffer, context) {
    if (isVisualizerInitialized) {
      return;
    }

    if (audioBuffer) {
      source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.start();
    }
    
    //Creating the analyser node to store frequency data for the visualizer
    const analyser = context.createAnalyser();
    source.connect(analyser);
    analyser.connect(context.destination);
    
    analyser.fftSize = 512;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
  
    //Initiliazing the scene, camera, and renderer for the visualiser
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, area.clientWidth / area.clientHeight, 0.1, 1000);
    camera.position.z = 100;
    //Rendering the scene using WEBGL with antialiasing which will make rendering smoother
    const renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(area.clientWidth, area.clientHeight);
    renderer.setClearColor("#838b8b");
    area.appendChild(renderer.domElement);
  
    //Creating a geometry mesh with 20 sides
    const geometry = new THREE.IcosahedronGeometry(20, 3);
    const material = new THREE.MeshLambertMaterial({ color: "#0048ba", wireframe: true });
    const sphere = new THREE.Mesh(geometry, material);
  
    //Adding a light source set above the mesh for lightning
    const light = new THREE.DirectionalLight("#ffffff", 0.8);
    light.position.set(0, 50, 100);
    scene.add(light);
    scene.add(sphere);
  
    //Resize handler for renderer
    window.addEventListener('resize', () => {
      renderer.setSize(area.clientWidth, area.clientHeight);
      camera.aspect = area.clientWidth / area.clientHeight;
      camera.updateProjectionMatrix();
    });
  
    //Rendering out the 3D mesh based on frequency
    function render() {
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
      requestAnimationFrame(render);
      renderer.render(scene, camera);
    }
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
    //Marking the visualizer as initialized
    isVisualizerInitialized = true;
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