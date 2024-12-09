//Global Variables
let audioContext, dataArray;
let particles, particlePositions, particleColors, plane;
const particleCount = 500;
const radius = 50;
let globalScale = 1;
let originalPositions;
let lineGeometry, lineMaterial, lines;
const maxConnections = 4;
const connections = [];
let audio;
let isPlaying = false;
const simplexNoise = new SimplexNoise();
//Loading DOM content before execution
document.addEventListener("DOMContentLoaded", () => {
  let context;
  let renderer;
  let analyser;
  let isVisualizerInitialized = false;
  const area = document.getElementById("visualiser");
  
  if (!area) {
      console.error("Visualizer container not found in the DOM.");
      return;
  }

//Fetches audio from the server/database
  async function fetchAndVisualizeAudio(projectId) {
    try {
        console.log("Fetching audio for Project ID:", projectId);

        const response = await fetch(`/visualizer/${projectId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        // Assuming data.base64Encoding is an array
        if (Array.isArray(data.base64Encoding) && data.base64Encoding.length > 0) {
            const base64String = data.base64Encoding[0].base64_encoding; // Access the first element's base64_encoding
            console.log("About to call decode: ", base64String);
            await decodeAudioFromBase64(base64String);
        } else {
            console.error("No valid Base64 encoding found in fetched data.");
        }
    } catch (error) {
        console.error("Error fetching and visualizing audio:", error);
    }
}


//Attaches the function to the global scope
window.fetchAndVisualizeAudio = fetchAndVisualizeAudio;
//Helper function to decode audio from base64
  async function decodeAudioFromBase64(base64Input) {
      try {
          const binaryAudio = atob(base64Input);
          const byteArray = new Uint8Array(binaryAudio.length);
          for (let i = 0; i < binaryAudio.length; i++) {
              byteArray[i] = binaryAudio.charCodeAt(i);
          }
          if (!context) {
              context = new (window.AudioContext || window.webkitAudioContext)();
              await context.resume(); //Ensure AudioContext is resumed
              console.log("AudioContext created and resumed.");
          }

          const audioBuffer = await context.decodeAudioData(byteArray.buffer);
          console.log("Audio buffer decoded.");
          console.log("Decoded audio buffer:", audioBuffer);

          initializeVisualizer(audioBuffer);
      } catch (error) {
          console.error("Error decoding Base64 audio:", error);
      }
  }
//Initialize the visualizer
function initializeVisualizer(audioBuffer) {
    if (isVisualizerInitialized)
    {
        return; 
    }
    //Setup scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, area.clientWidth / area.clientHeight, 0.1, 1000);
    camera.position.z = 100;

    //WebGL Renderer Setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(area.clientWidth, area.clientHeight);
    renderer.setClearColor("#000");
    area.appendChild(renderer.domElement);

    //Sphere setup
    const geometry = new THREE.IcosahedronGeometry(20, 3);
    const material = new THREE.MeshLambertMaterial({ color: "#0048ba", wireframe: true });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    //Lightning setup
    const light = new THREE.DirectionalLight("#ffffff", 0.8);
    light.position.set(0, 50, 100);
    scene.add(light);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1.5, 100);
    pointLight.position.set(0, 10, 10);
    scene.add(pointLight);

    //Mesh setup
    const planeGeometry = new THREE.PlaneGeometry(800, 800, 20, 20);
    const planeMaterial = new THREE.MeshLambertMaterial({color: 0x6904ce, side: THREE.DoubleSide, wireframe: true,});
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.set(0, -30, 0);
    scene.add(plane);

    //Particles setup
    particles = new THREE.BufferGeometry();
    particlePositions = new Float32Array(particleCount * 3);
    particleColors = new Float32Array(particleCount * 3);
    originalPositions = new Float32Array(particleCount * 3);

    //Offset particle positions for animation loop
    //Note: theta and phi represent angles in spherical coordinates
    for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(Math.random() * 2 - 1);

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        particlePositions[i * 3] = x;
        particlePositions[i * 3 + 1] = y;
        particlePositions[i * 3 + 2] = z;

        originalPositions[i * 3] = x;
        originalPositions[i * 3 + 1] = y;
        originalPositions[i * 3 + 2] = z;

        particleColors[i * 3] = 0.5;
        particleColors[i * 3 + 1] = 0.5;
        particleColors[i * 3 + 2] = 0.5;
        connections[i] = []; 
        }
    particles.setAttribute("position",new THREE.BufferAttribute(particlePositions, 3));
    particles.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    //Particle material params
    const particleMaterial = new THREE.PointsMaterial({size: 0.5, opacity: 0.8, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false});
    particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    //Drawing lines between particles
    lineGeometry = new THREE.BufferGeometry();
    const linePositions = [];
    const lineIndices = [];

    for (let i = 0; i < particleCount; i++) {
    const numConnections = Math.floor(Math.random() * (maxConnections - 2 + 1)) + 2;

    for (let j = 0; j < numConnections; j++) {
        let targetIndex;
        do {
        targetIndex = Math.floor(Math.random() * particleCount);
        } while (targetIndex === i || connections[i].includes(targetIndex));

        connections[i].push(targetIndex);
        linePositions.push(particlePositions[i * 3],
        particlePositions[i * 3 + 1],
        particlePositions[i * 3 + 2],
        particlePositions[targetIndex * 3],
        particlePositions[targetIndex * 3 + 1],
        particlePositions[targetIndex * 3 + 2]
        );
        lineIndices.push(linePositions.length / 3 - 2, linePositions.length / 3 - 1
        );
    }}
    
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    lineGeometry.setIndex(new THREE.BufferAttribute(new Uint16Array(lineIndices), 1));
    lineMaterial = new THREE.LineBasicMaterial({color: "purple", opacity: 0.30, transparent: true});
    lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    //Audio setup
    analyser = context.createAnalyser();
    analyser.fftSize = 512;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyser);
    analyser.connect(context.destination);
    source.start();

    isVisualizerInitialized = true;

    function render() {
    //Updating frequency data
    analyser.getByteFrequencyData(dataArray); 
    let average = 0;
    for (let i = 0; i < dataArray.length; i++) {
            average += dataArray[i];
    }
    average /= dataArray.length;

    var lowerHalfArray = dataArray.slice(0, (dataArray.length/2) - 1);
    var lowerAvg = avg(lowerHalfArray);
    var lowerAvgFr = lowerAvg / lowerHalfArray.length;
    //map avg frequency to scale
    globalScale = 1 + (average / 256);

    for (let i = 0; i < particleCount; i++) {
      const index = i * 3;
      //Update particle positions
      particlePositions[index] = originalPositions[index] * globalScale;
      particlePositions[index + 1] = originalPositions[index + 1] * globalScale;
      particlePositions[index + 2] = originalPositions[index + 2] * globalScale;
      //Update colors
      const colorIntensity = Math.min(globalScale * 0.5, 1);
      particleColors[index] = colorIntensity * 0.5;
      particleColors[index + 1] = 0.5 - colorIntensity * 0.2;
      particleColors[index + 2] = colorIntensity * 1.0;
    }
    particles.attributes.position.needsUpdate = true;
    particles.attributes.color.needsUpdate = true;
    //Maps the avg frequency to scale and color
    //Oscillate between 1 and 2
    const scale = 1 + average / 128;
    sphere.scale.set(scale, scale, scale);
    
    //Change the sphere's color based on audio data
    const colorIntensity = average / 255;
    //setting hue, saturation, and light
    sphere.material.color.setHSL(colorIntensity, 0.8, 0.5);
    //Rotating the sphere based on audio data
    sphere.rotation.x += average / 10000;
    sphere.rotation.y += average / 10000;

    //Connecting lines animation
    let lineIdx = 0;
    const positions = lineGeometry.attributes.position.array;
    for (let i = 0; i < particleCount/3; i++) {
        const currentPos = [
        particlePositions[i * 3],
        particlePositions[i * 3 + 1],
        particlePositions[i * 3 + 2],
        ];

    for (const targetIndex of connections[i]) {
        positions[lineIdx * 6] = currentPos[0];
        positions[lineIdx * 6 + 1] = currentPos[1];
        positions[lineIdx * 6 + 2] = currentPos[2];
        positions[lineIdx * 6 + 3] = particlePositions[targetIndex * 3];
        positions[lineIdx * 6 + 4] = particlePositions[targetIndex * 3 + 1];
        positions[lineIdx * 6 + 5] = particlePositions[targetIndex * 3 + 2];
        lineIdx++;
        }
    }
    lineGeometry.attributes.position.needsUpdate = true;

    //Ground mesh animation
    const position = plane.geometry.attributes.position;
    if (!position){
        return;
    }
    const vertex = new THREE.Vector3();
    const amp = 2;
    const time = Date.now();

    for (let i = 0; i < position.count; i++) {
        vertex.fromBufferAttribute(position, i);
        const noiseValue = simplexNoise.noise2D(
        vertex.x + time * 0.0003,
        vertex.y + time * 0.0001
        );
        const distance = noiseValue * amp;
        vertex.z = distance;
        position.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    position.needsUpdate = true;
    plane.geometry.computeVertexNormals();

    //Render the scene
    renderer.render(scene, camera);
    // Continue the animation loop
    requestAnimationFrame(render);
    }
    
      render();
  }

//   Normalizes the value to a specific range 
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
