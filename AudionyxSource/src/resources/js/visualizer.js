
// let audioContext, audioAnalyser, audioSource, frequencyData;
// let particles, particlePositions, particleColors, plane;
// const particleCount = 500;
// const radius = 50;
// let globalScale = 1;
// let originalPositions;
// let lineGeometry, lineMaterial, lines;
// const maxConnections = 4;
// const connections = [];
// let audio;
// let isPlaying = false;
// let audioBuffer = null;
// let currentSource = "none";
// const simplexNoise = new SimplexNoise();
// document.getElementById("audioInput").addEventListener("change", handleAudioInput);
// document.getElementById("playPauseButton").addEventListener("click", togglePlayPause)

// window.onload = async () => {
//   const base64Audio = ""; //Replace with the actual Base64 audio string
//   await decodeAudioFromBase64(base64Audio);
//   startBase64Audio();
// };

// //Initialize the audio context and analyser
// function initAudioContext() {
//   if (!audioContext) {
//     audioContext = new (window.AudioContext || window.webkitAudioContext)();
//     audioAnalyser = audioContext.createAnalyser();
//     audioAnalyser.fftSize = 256;
//     frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
//   }
// }

// //Handle audio file upload
// function handleAudioInput(event) {
//   const file = event.target.files[0];
//   if (!file) return;

//   const urlObj = URL.createObjectURL(file);
//   initAudioContext();

//   const audio = new Audio(urlObj);
//   currentSource = "file";

//   audio.addEventListener("play", () => {
//     audioContext.resume();
//     isPlaying = true;
//   });

//   audio.addEventListener("pause", () => {
//     audioContext.suspend();
//     isPlaying = false;
//   });

//   // Set up the audio analyser
//   if (!audioAnalyser) {
//     audioAnalyser = audioContext.createAnalyser();
//     audioAnalyser.fftSize = 256;
//     frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
//   }

//   const mediaSource = audioContext.createMediaElementSource(audio);
//   mediaSource.connect(audioAnalyser);
//   audioAnalyser.connect(audioContext.destination);

//   audio.play();
// }


// async function decodeAudioFromBase64(base64Input) {
//   try {
//     const isBase64 = (str) => {
//       try {
//         return btoa(atob(str)) === str;
//       } catch (e) {
//         return false;
//       }
//     };

//     if (!isBase64(base64Input)) {
//       console.error("Invalid Base64 string");
//       return;
//     }

//     const binaryAudio = atob(base64Input);
//     const len = binaryAudio.length;
//     const bytes = new Uint8Array(len);
//     for (let i = 0; i < len; i++) {
//       bytes[i] = binaryAudio.charCodeAt(i);
//     }

//     initAudioContext();
//     audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
//     console.log("Audio buffer decoded");
//     currentSource = "base64";
//     if (audioBuffer) {
//       if (audioSource) {
//         audioSource.stop();
//       }
//       audioSource = audioContext.createBufferSource();
//       audioSource.buffer = audioBuffer;
//       audioAnalyser = audioContext.createAnalyser();
//       audioAnalyser.fftSize = 256
//       frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
//       audioSource.connect(audioAnalyser);
//       audioAnalyser.connect(audioContext.destination);

//       audioSource.start(0);
//     }
//   } catch (error) {
//     console.error("Error decoding Base64 audio:", error);
//   }
// }

// async function fetchBase64Audio(projectId) {
//   try {
//     const response = await fetch(`/project/${projectId}`);
//     if (!response.ok) {
//       throw new Error(`HTTP error! Status: ${response.status}`);
//     }
//     const data = await response.json();
//     if (data.base64Encoding) {
//       await decodeAudioFromBase64(data.base64Encoding);
//     } else {
//       console.error("No Base64 encoding found in the response");
//     }
//   } catch (error) {
//     console.error("Error fetching Base64 audio:", error);
//   }
// }

// function playPause(event) {
//   const file = event.target.files[0];
//   if (!file) {return};
//   //creates url for the file
//   const urlObj = URL.createObjectURL(file);
//   audio = document.getElementById("audio-player");
//   audio.src = urlObj;

//   if (!audioContext) {
//     audioContext = new (window.AudioContext || window.webkitAudioContext)();
//     audioAnalyser = audioContext.createAnalyser();
//     audioAnalyser.fftSize = 256;
//     frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
//   }

//   const audio = new Audio(urlObj);
//   const mediaElementSource = audioContext.createMediaElementSource(audio);
//   mediaElementSource.connect(audioAnalyser);
//   audioAnalyser.connect(audioContext.destination);

//   audio.addEventListener("play", () => {
//     isPlaying = true;
//   });
//   audio.addEventListener("pause", () => {
//     isPlaying = false;
//   });

//   audio.play();

//   //Handling when song ends
//   audio.addEventListener("ended", () => {
//     URL.revokeObjectURL(urlObj);
//   });
//   audio.addEventListener("play", () => {
//     audioContext.resume();
//   });
//   //suspend context on pause
//   audio.addEventListener("pause", () => {
//     audioContext.suspend();
//   });

// }
// // Start Base64 audio playback
// function startBase64Audio() {
//   if (!audioBuffer) {
//     console.error("No Base64 audio buffer available");
//     return;
//   }

//   if (audioSource) {
//     audioSource.stop();
//   }

//   audioSource = audioContext.createBufferSource();
//   audioSource.buffer = audioBuffer;

//   audioSource.connect(audioAnalyser);
//   audioAnalyser.connect(audioContext.destination);

//   audioSource.start(0);
//   isPlaying = true;

//   audioSource.onended = () => {
//     isPlaying = false;
//   };
// }

// function togglePlayPause() {
//   if (!audioContext) {
//     console.error("Audio context is not initialized");
//     return;
//   }

//   if (currentSource === "none") {
//     console.error("No audio source selected");
//     return;
//   }

//   if (isPlaying) {
//     if (audioSource) {
//       audioSource.stop();
//       isPlaying = false;
//     }
//   } else if (currentSource === "base64" && audioBuffer) {
//     startBase64Audio();
//   } else {
//     console.error("No audio to play from the current source");
//   }
// }

// initializeVisualizer();
// animate();

// function initializeVisualizer() {
//   //Scene setup
//   scene = new THREE.Scene();
//   camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
//   renderer = new THREE.WebGLRenderer({ antialias: true });
//   renderer.setSize(window.innerWidth, window.innerHeight);
//   document.body.appendChild(renderer.domElement);
  
//   //Light setup
//   const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
//   scene.add(ambientLight);

//   const pointLight = new THREE.PointLight(0xffffff, 1.5, 100);
//   pointLight.position.set(0, 10, 10);
//   scene.add(pointLight);

//   //MESH setup
//   const planeGeometry = new THREE.PlaneGeometry(800, 800, 20, 20);
//   const planeMaterial = new THREE.MeshLambertMaterial({color: 0x6904ce, side: THREE.DoubleSide, wireframe: true,});
//   plane = new THREE.Mesh(planeGeometry, planeMaterial);
//   plane.rotation.x = -0.5 * Math.PI;
//   plane.position.set(0, -30, 0);
//   scene.add(plane);

//   //Verticies setup
//   particles = new THREE.BufferGeometry();
//   particlePositions = new Float32Array(particleCount * 3);
//   particleColors = new Float32Array(particleCount * 3);
//   originalPositions = new Float32Array(particleCount * 3); // Store the original positions

//   for (let i = 0; i < particleCount; i++) {
//     const theta = Math.random() * 2 * Math.PI;
//     const phi = Math.acos(Math.random() * 2 - 1);

//     const x = radius * Math.sin(phi) * Math.cos(theta);
//     const y = radius * Math.sin(phi) * Math.sin(theta);
//     const z = radius * Math.cos(phi);

//     particlePositions[i * 3] = x;
//     particlePositions[i * 3 + 1] = y;
//     particlePositions[i * 3 + 2] = z;

//     //Saving Original Positions
//     originalPositions[i * 3] = x;
//     originalPositions[i * 3 + 1] = y;
//     originalPositions[i * 3 + 2] = z;

//     //Initial colors for verticies
//     particleColors[i * 3] = 0.5;
//     particleColors[i * 3 + 1] = 0.5;
//     particleColors[i * 3 + 2] = 0.5;

//     connections[i] = []; // Initialize connections array for each particle
//   }
//   particles.setAttribute("position",new THREE.BufferAttribute(particlePositions, 3));
//   particles.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

//   const particleMaterial = new THREE.PointsMaterial({
//     size: 0.5,
//     opacity: 0.8,
//     blending: THREE.AdditiveBlending,
//     transparent: true,
//     depthWrite: false,
//   });

//   particleSystem = new THREE.Points(particles, particleMaterial);
//   scene.add(particleSystem);

//   //Line Setup
//   lineGeometry = new THREE.BufferGeometry();
//   const linePositions = [];
//   const lineIndices = [];

//   for (let i = 0; i < particleCount; i++) {
//     const numConnections =
//       Math.floor(Math.random() * (maxConnections - 2 + 1)) + 2;

//     for (let j = 0; j < numConnections; j++) {
//       let targetIndex;
//       do {
//         targetIndex = Math.floor(Math.random() * particleCount);
//       } while (targetIndex === i || connections[i].includes(targetIndex));

//       connections[i].push(targetIndex);

//       linePositions.push(
//         particlePositions[i * 3],
//         particlePositions[i * 3 + 1],
//         particlePositions[i * 3 + 2],
//         particlePositions[targetIndex * 3],
//         particlePositions[targetIndex * 3 + 1],
//         particlePositions[targetIndex * 3 + 2]
//       );
//       lineIndices.push(
//         linePositions.length / 3 - 2,
//         linePositions.length / 3 - 1
//       );
//     }
//   }

//   lineGeometry.setAttribute(
//     "position",
//     new THREE.BufferAttribute(new Float32Array(linePositions), 3)
//   );
//   lineGeometry.setIndex(
//     new THREE.BufferAttribute(new Uint16Array(lineIndices), 1)
//   );
//   lineMaterial = new THREE.LineBasicMaterial({
//     color: "white",
//     opacity: 0.05,
//     transparent: true,
//   });
//   lines = new THREE.LineSegments(lineGeometry, lineMaterial);
//   scene.add(lines);

//   //Set camera position
//   camera.position.z = 120;

//   //Setup audio input
//   const audioInput = document.getElementById("audioInput");
//   audioInput.addEventListener("change", handleAudioInput, false);

//   //Handle window resize
//   window.addEventListener("resize", () => {
//     camera.aspect = window.innerWidth / window.innerHeight;
//     camera.updateProjectionMatrix();
//     renderer.setSize(window.innerWidth, window.innerHeight);
//   });

// }

// function animate() {
//   requestAnimationFrame(animate);

//   if (audioAnalyser && !audioAnalyser.paused) {
//     audioAnalyser.getByteFrequencyData(frequencyData);
//     //calculate avg frequency
//     let avgFrequency = 0;
//     for (let i = 0; i < frequencyData.length; i++) {
//       avgFrequency += frequencyData[i];
//     }
//     avgFrequency /= frequencyData.length;
//     //lower half
//     var lowerHalfArray = frequencyData.slice(0, (frequencyData.length/2) - 1);
//     var lowerAvg = avg(lowerHalfArray);
//     var lowerAvgFr = lowerAvg / lowerHalfArray.length;
//     //map avg frequency to scale
//     globalScale = 1 + (avgFrequency / 256);

//     for (let i = 0; i < particleCount; i++) {
//       const index = i * 3;
//       //Update particle positions
//       particlePositions[index] = originalPositions[index] * globalScale;
//       particlePositions[index + 1] = originalPositions[index + 1] * globalScale;
//       particlePositions[index + 2] = originalPositions[index + 2] * globalScale;
//       //Update colors
//       const colorIntensity = Math.min(globalScale * 0.5, 1);
//       particleColors[index] = colorIntensity * 0.5;
//       particleColors[index + 1] = 0.5 - colorIntensity * 0.2;
//       particleColors[index + 2] = colorIntensity * 1.0;
//   }
//   particles.attributes.position.needsUpdate = true;
//   particles.attributes.color.needsUpdate = true;

//   //Update lines in between
//   let lineIdx = 0;
//   const positions = lineGeometry.attributes.position.array;
//   for (let i = 0; i < particleCount/3; i++) {
//     const currentPos = [
//       particlePositions[i * 3],
//       particlePositions[i * 3 + 1],
//       particlePositions[i * 3 + 2],
//     ];

//     for (const targetIndex of connections[i]) {
//       positions[lineIdx * 6] = currentPos[0];
//       positions[lineIdx * 6 + 1] = currentPos[1];
//       positions[lineIdx * 6 + 2] = currentPos[2];
//       positions[lineIdx * 6 + 3] = particlePositions[targetIndex * 3];
//       positions[lineIdx * 6 + 4] = particlePositions[targetIndex * 3 + 1];
//       positions[lineIdx * 6 + 5] = particlePositions[targetIndex * 3 + 2];
//       lineIdx++;
//     }
// }
//   lineGeometry.attributes.position.needsUpdate = true;
//   }

//   if (plane) {
//     animateGround(plane, globalScale);
//   }
  
//   particleSystem.rotation.y += 0.001;
//   particleSystem.rotation.x += 0.001;
//   lines.rotation.y += 0.001;
//   lines.rotation.x += 0.001;

//   renderer.render(scene, camera);

// }
// function onWindowResize() {
//   camera.aspect = window.innerWidth / window.innerHeight;
//   camera.updateProjectionMatrix();
//   renderer.setSize(window.innerWidth, window.innerHeight);
// }

// function animateGround(mesh, distortionFr) {
//   const position = mesh.geometry.attributes.position;
//   if (!position) return; //Safeguard if `position` is undefined

//   const vertex = new THREE.Vector3();
//   const amp = 2;
//   const time = Date.now();

//   for (let i = 0; i < position.count; i++) {
//     vertex.fromBufferAttribute(position, i);
//     const noiseValue = simplexNoise.noise2D(
//       vertex.x + time * 0.0003,
//       vertex.y + time * 0.0001
//     );
//     const distance = noiseValue * distortionFr * amp;
//     vertex.z = distance;
//     position.setXYZ(i, vertex.x, vertex.y, vertex.z);
//   }

//   position.needsUpdate = true;
//   mesh.geometry.computeVertexNormals();
//   }
// //Normalizes the value to a specific range 
// function normalize(value, minValue, maxValue) {
//   return (value - minValue) / (maxValue - minValue);
// }
// //Scaling the value to a new range
// function modulate(value, minValue, maxValue, outMin, outMax) {
//   const fr = normalize(value, minValue, maxValue);
//   const delta = outMax - outMin;
//   return outMin + (fr * delta);
// }
// //Calculates the average of an array
// function avg(arr) {
//   return arr.reduce((sum, b) => sum + b) / arr.length;
// }
// //Calculates the max value of an array
// function max(arr) {
//   return arr.reduce((a, b) => Math.max(a, b));
// }

======================================================================================================

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

  // Make fetchAndVisualizeAudio globally accessible
  // async function fetchAndVisualizeAudio(projectId) {
  //     try {
  //         console.log("Fetching audio for Project ID:", projectId);

  //         const response = await fetch(`/visualizer/${projectId}`);

  //         if (!response.ok) {
  //             throw new Error(`HTTP error! Status: ${response.status}`);
  //         }

  //         const data = await response.json();
  //         if (data.base64Encoding) {
  //             await decodeAudioFromBase64(data.base64Encoding);
  //         } else {
  //             console.error("No Base64 encoding found in fetched data.");
  //         }
  //     } catch (error) {
  //         console.error("Error fetching and visualizing audio:", error);
  //     }
  // };

  // window.fetchAndVisualizeAudio = fetchAndVisualizeAudio;

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


// Attach the function to the global scope
window.fetchAndVisualizeAudio = fetchAndVisualizeAudio;

  async function decodeAudioFromBase64(base64Input) {
      try {
          const binaryAudio = atob(base64Input);
          const byteArray = new Uint8Array(binaryAudio.length);
          for (let i = 0; i < binaryAudio.length; i++) {
              byteArray[i] = binaryAudio.charCodeAt(i);
          }

          if (!context) {
              context = new (window.AudioContext || window.webkitAudioContext)();
              await context.resume(); // Ensure AudioContext is resumed
              console.log("AudioContext created and resumed.");
          }

          const audioBuffer = await context.decodeAudioData(byteArray.buffer);
          console.log("Audio buffer decoded.");
          console.log("Decoded audio buffer:", audioBuffer); // Inside your decoding function

          initializeVisualizer(audioBuffer);
      } catch (error) {
          console.error("Error decoding Base64 audio:", error);
      }
  }

  function initializeVisualizer(audioBuffer) {
      if (isVisualizerInitialized) return;

      // Set up Three.js scene
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, area.clientWidth / area.clientHeight, 0.1, 1000);
      camera.position.z = 100;

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(area.clientWidth, area.clientHeight);
      renderer.setClearColor("#000");
      area.appendChild(renderer.domElement);

      const geometry = new THREE.IcosahedronGeometry(20, 3);
      const material = new THREE.MeshLambertMaterial({ color: "#0048ba", wireframe: true });
      const sphere = new THREE.Mesh(geometry, material);

      scene.add(sphere);
      const light = new THREE.DirectionalLight("#ffffff", 0.8);
      light.position.set(0, 50, 100);
      scene.add(light);

      analyser = context.createAnalyser();
      analyser.fftSize = 512;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyser);
      analyser.connect(context.destination);
      source.start();

      isVisualizerInitialized = true;

      // function render() {
      //     analyser.getByteFrequencyData(dataArray);

      //     sphere.rotation.x += 0.01;
      //     sphere.rotation.y += 0.01;

      //     renderer.render(scene, camera);
      //     requestAnimationFrame(render);
      // }

      function render() {
        // Update frequency data from the analyser
        analyser.getByteFrequencyData(dataArray);
    
        // Calculate an average value of the frequency data
        let average = 0;
        for (let i = 0; i < dataArray.length; i++) {
            average += dataArray[i];
        }
        average /= dataArray.length; // Normalize
    
        // Map the average frequency to scale and color
        const scale = 1 + average / 128; // Scale between 1 and 2
        sphere.scale.set(scale, scale, scale); // Dynamically adjust the sphere's size
    
        // Change the sphere's color based on the audio data
        const colorIntensity = average / 255; // Normalize color intensity
        sphere.material.color.setHSL(colorIntensity, 0.8, 0.5); // Set hue, saturation, and lightness
    
        // Optional: Rotate the sphere based on average frequency
        sphere.rotation.x += average / 1000;
        sphere.rotation.y += average / 1000;
    
        // Render the scene
        renderer.render(scene, camera);
    
        // Continue the animation loop
        requestAnimationFrame(render);
    }
    
      render();
  }
});
