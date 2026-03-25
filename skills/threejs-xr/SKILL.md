---
name: threejs-xr
description: Sets up WebXR in Three.js — VRButton, ARButton, XRSession, controllers, hand tracking, hit testing, and immersive experiences. Use when the user asks about VR, AR, WebXR, immersive experiences, XR controllers, hand tracking, or augmented reality. Trigger keywords: WebXR, VR, AR, VRButton, ARButton, XRSession, controller, hand tracking, immersive, augmented reality, virtual reality.
---

# Three.js WebXR

## VR Setup

```js
import { VRButton } from "three/addons/webxr/VRButton.js";

renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));

// XR render loop — use setAnimationLoop instead of requestAnimationFrame
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
// setAnimationLoop replaces requestAnimationFrame for XR — both VR and non-VR work
```

## AR Setup

```js
import { ARButton } from "three/addons/webxr/ARButton.js";

renderer.xr.enabled = true;

// AR with hit testing
document.body.appendChild(
  ARButton.createButton(renderer, {
    requiredFeatures: ["hit-test"],
    optionalFeatures: ["dom-overlay"],
    domOverlay: { root: document.body },
  }),
);

renderer.setAnimationLoop((timestamp, frame) => {
  if (frame) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();
    // hit test, place objects, etc.
  }
  renderer.render(scene, camera);
});
```

## Controllers

```js
// Controller 0 = right hand (usually), 1 = left hand
const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);
scene.add(controller1);
scene.add(controller2);

// Visual model for controllers
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
const controllerModelFactory = new XRControllerModelFactory();

const grip1 = renderer.xr.getControllerGrip(0);
grip1.add(controllerModelFactory.createControllerModel(grip1));
scene.add(grip1);

// Controller ray line
const geometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0, -1),
]);
const line = new THREE.Line(
  geometry,
  new THREE.LineBasicMaterial({ color: 0xffffff }),
);
line.scale.z = 5;
controller1.add(line.clone());
controller2.add(line.clone());

// Events
controller1.addEventListener("selectstart", onSelectStart);
controller1.addEventListener("selectend", onSelectEnd);
controller1.addEventListener("squeezestart", onSqueezeStart);
```

## Hand Tracking

```js
import { XRHandModelFactory } from "three/addons/webxr/XRHandModelFactory.js";

renderer.xr.enabled = true;
document.body.appendChild(
  VRButton.createButton(renderer, {
    optionalFeatures: ["hand-tracking"],
  }),
);

const handModelFactory = new XRHandModelFactory();

const hand1 = renderer.xr.getHand(0);
hand1.add(handModelFactory.createHandModel(hand1, "mesh")); // 'mesh', 'spheres', 'boxes'
scene.add(hand1);

const hand2 = renderer.xr.getHand(1);
hand2.add(handModelFactory.createHandModel(hand2, "mesh"));
scene.add(hand2);

// Hand joint positions (XRHand.joints is a Map)
hand1.addEventListener("pinchstart", (e) => {
  /* pinch detected */
});
hand1.addEventListener("pinchend", (e) => {
  /* pinch released */
});
```

## Hit Testing (AR — place objects on surfaces)

```js
let hitTestSource = null;
let hitTestSourceRequested = false;
const reticle = new THREE.Mesh(
  new THREE.RingGeometry(0.1, 0.15, 32),
  new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
);
reticle.matrixAutoUpdate = false;
reticle.visible = false;
scene.add(reticle);

renderer.setAnimationLoop((timestamp, frame) => {
  if (frame) {
    const refSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (!hitTestSourceRequested) {
      session.requestReferenceSpace("viewer").then((viewerSpace) => {
        session.requestHitTestSource({ space: viewerSpace }).then((source) => {
          hitTestSource = source;
        });
      });
      hitTestSourceRequested = true;
    }

    if (hitTestSource) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        reticle.visible = true;
        reticle.matrix.fromArray(hit.getPose(refSpace).transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
  }
  renderer.render(scene, camera);
});

// Place object at reticle
document.addEventListener("click", () => {
  if (reticle.visible) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x4488ff }),
    );
    mesh.position.setFromMatrixPosition(reticle.matrix);
    scene.add(mesh);
  }
});
```

## XR Teleportation

```js
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";

// Basic teleportation — move XR camera rig to target position
const cameraRig = new THREE.Group();
cameraRig.add(renderer.xr.getCamera()); // xr camera group
scene.add(cameraRig);

function teleportTo(position) {
  cameraRig.position.copy(position);
}
```

## Common Gotchas

- `requestAnimationFrame` does NOT work in XR — use `renderer.setAnimationLoop()`
- `setAnimationLoop(null)` stops the loop — call this on session end
- AR requires HTTPS — use ngrok or similar for local testing
- Hand tracking requires `'hand-tracking'` in `optionalFeatures` of the button config
- `renderer.xr.getCamera()` returns the XR camera group (both eye cameras) — don't use the regular camera for XR transforms
- `VRButton` handles session start/end automatically — don't manage XRSession manually unless you need custom behavior
- Always add controllers AND controller grips to scene — grip is for physical location of controller, controller is for ray/pointer
