---
name: threejs-audio
description: Adds spatial and non-spatial audio to Three.js scenes using AudioListener, Audio, PositionalAudio, AudioAnalyser, and AudioLoader. Use when the user asks about 3D audio, spatial sound, positional audio, audio visualization, background music, or Web Audio API integration. Trigger keywords: audio, sound, PositionalAudio, AudioListener, AudioAnalyser, spatial audio, 3D sound, music visualization.
---

# Three.js Audio

## Setup — AudioListener

```js
// One AudioListener per scene, attached to camera
const listener = new THREE.AudioListener();
camera.add(listener);
```

## Global (Non-Spatial) Audio

```js
const sound = new THREE.Audio(listener);
const loader = new THREE.AudioLoader();

// Async load
const buffer = await loader.loadAsync("/audio/music.mp3");
sound.setBuffer(buffer);
sound.setLoop(true);
sound.setVolume(0.5);

// Must start on user gesture (browser autoplay policy)
document.addEventListener("click", () => sound.play(), { once: true });

// Controls
sound.pause();
sound.stop();
sound.isPlaying; // boolean
sound.offset = 10; // start at 10 seconds
sound.playbackRate = 1.5; // 1.5x speed
```

## Positional (Spatial) Audio

```js
// Sound whose volume/pan changes based on distance and angle to camera
const posSound = new THREE.PositionalAudio(listener);

const buffer = await new THREE.AudioLoader().loadAsync("/audio/engine.mp3");
posSound.setBuffer(buffer);
posSound.setLoop(true);
posSound.setRefDistance(2); // distance at which volume = 1 (full)
posSound.setRolloffFactor(1); // how fast volume drops with distance
posSound.setDistanceModel("inverse"); // 'linear', 'inverse', 'exponential'
posSound.setMaxDistance(50); // beyond this distance, volume = 0
posSound.setDirectionalCone(180, 360, 0.1); // innerAngle, outerAngle, outerGain

// Attach to a mesh — sound follows the object
mesh.add(posSound);
document.addEventListener("click", () => posSound.play(), { once: true });
```

## AudioAnalyser (visualization)

```js
const analyser = new THREE.AudioAnalyser(sound, 32); // sound, fftSize

function animate() {
  requestAnimationFrame(animate);

  const data = analyser.getFrequencyData(); // Uint8Array, length = fftSize/2
  const avg = analyser.getAverageFrequency(); // 0–255

  // Drive visuals with audio data
  mesh.scale.setScalar(1 + avg / 255);

  // Per-frequency band control
  for (let i = 0; i < data.length; i++) {
    bars[i].scale.y = (data[i] / 255) * maxHeight;
  }

  renderer.render(scene, camera);
}
```

## Web Audio API (direct access)

```js
// Access underlying Web Audio context and nodes
const audioContext = listener.context;

// Create filter
const filter = audioContext.createBiquadFilter();
filter.type = "lowpass";
filter.frequency.value = 1000;

// Connect: source → filter → destination
sound.setFilter(filter);

// Gain control
sound.setVolume(0.8); // wraps GainNode

// Access raw audio node
const gainNode = sound.gain; // GainNode
gainNode.gain.setValueAtTime(0, audioContext.currentTime);
gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 2);
```

## Multiple Sounds / Preloading

```js
const manager = new THREE.LoadingManager();
const loader = new THREE.AudioLoader(manager);

const sounds = {};
sounds.jump = await loader.loadAsync("/audio/jump.wav");
sounds.land = await loader.loadAsync("/audio/land.wav");
sounds.music = await loader.loadAsync("/audio/bg.mp3");

function playJump() {
  const s = new THREE.Audio(listener);
  s.setBuffer(sounds.jump);
  s.play();
  // one-shot: auto-cleanup on end
  s.onEnded = () => s.disconnect();
}
```

## Common Gotchas

- Browsers block autoplay — always start audio inside a user gesture handler (`click`, `touchstart`)
- One `AudioListener` per scene — multiple listeners cause unexpected behavior
- `PositionalAudio` must be added to an `Object3D` (mesh, group) to be positioned
- `AudioAnalyser` fftSize must be a power of 2 between 32 and 32768 — data array length = fftSize / 2
- `sound.stop()` resets playback position — `sound.pause()` preserves it
- Use `new THREE.Audio(listener)` for one-shot effects (not reusing the same Audio object)
- Audio context may be in 'suspended' state until first user interaction — check `listener.context.state`
