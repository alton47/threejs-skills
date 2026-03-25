# CANNON.md — cannon-es Complete Reference

## Contents

- World setup
- Bodies and shapes
- Materials and contact materials
- Constraints
- Collision events
- Spring forces
- Character controller pattern
- Performance tips

---

## World Setup

```js
import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger"; // optional debug viz

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.81, 0),
});

// Broadphase — collision detection algorithm
world.broadphase = new CANNON.SAPBroadphase(world); // faster for many bodies
// world.broadphase = new CANNON.NaiveBroadphase(); // simpler, ok for < 50 bodies

world.solver.iterations = 10; // more = more accurate, more expensive
world.allowSleep = true; // bodies go to sleep when still — huge perf win
```

---

## Bodies

```js
// Static body (never moves)
const staticBody = new CANNON.Body({ mass: 0 });

// Dynamic body (affected by physics)
const dynamicBody = new CANNON.Body({
  mass: 1,
  position: new CANNON.Vec3(0, 5, 0),
  linearDamping: 0.1, // air resistance for linear motion
  angularDamping: 0.1, // air resistance for rotation
  allowSleep: true,
  sleepSpeedLimit: 0.1,
  sleepTimeLimit: 1.0,
});

// Kinematic body (moved manually, affects others)
const kinematicBody = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC });
```

---

## Shapes

```js
// IMPORTANT: cannon-es Box uses HALF-extents
dynamicBody.addShape(new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5))); // 1x1x1 cube

dynamicBody.addShape(new CANNON.Sphere(0.5));                           // radius

dynamicBody.addShape(new CANNON.Cylinder(0.5, 0.5, 2, 8));            // rTop, rBottom, height, segments

dynamicBody.addShape(new CANNON.Plane());                               // infinite flat — always use with mass:0

// Convex hull — for custom convex shapes
const points = [new CANNON.Vec3(-1,0,0), new CANNON.Vec3(1,0,0), ...];
const faces = [[0,1,2], [0,2,3], ...];
dynamicBody.addShape(new CANNON.ConvexPolyhedron({ vertices: points, faces }));

// Trimesh — only for STATIC bodies (mass: 0)
const vertices = new Float32Array([...]);
const indices = new Int16Array([...]);
staticBody.addShape(new CANNON.Trimesh(vertices, indices));

// Heightfield — terrain
const matrix = [[0,1,0], [1,2,1], [0,1,0]]; // 2D array of heights
staticBody.addShape(new CANNON.Heightfield(matrix, { elementSize: 1 }));

world.addBody(dynamicBody);
```

---

## Materials & Contact Materials

```js
const metalMat = new CANNON.Material("metal");
const groundMat = new CANNON.Material("ground");
const iceMat = new CANNON.Material("ice");
const rubberMat = new CANNON.Material("rubber");

world.addContactMaterial(
  new CANNON.ContactMaterial(metalMat, groundMat, {
    friction: 0.3,
    restitution: 0.3, // bounciness: 0 = no bounce, 1 = full bounce
    contactEquationStiffness: 1e8,
    contactEquationRelaxation: 3,
  }),
);

world.addContactMaterial(
  new CANNON.ContactMaterial(rubberMat, groundMat, {
    friction: 0.9,
    restitution: 0.7,
  }),
);

world.addContactMaterial(
  new CANNON.ContactMaterial(iceMat, groundMat, {
    friction: 0.01,
    restitution: 0.1,
  }),
);

// Assign to bodies
dynamicBody.material = metalMat;
groundBody.material = groundMat;
```

---

## Constraints

```js
// Point-to-point — like a ball joint
const ballJoint = new CANNON.PointToPointConstraint(
  bodyA,
  new CANNON.Vec3(0, 0.5, 0), // pivot on bodyA (local)
  bodyB,
  new CANNON.Vec3(0, -0.5, 0), // pivot on bodyB (local)
);
world.addConstraint(ballJoint);

// Hinge — like a door or wheel
const hinge = new CANNON.HingeConstraint(bodyA, bodyB, {
  pivotA: new CANNON.Vec3(0.5, 0, 0),
  pivotB: new CANNON.Vec3(-0.5, 0, 0),
  axisA: CANNON.Vec3.UNIT_Y, // rotation axis on bodyA
  axisB: CANNON.Vec3.UNIT_Y, // rotation axis on bodyB
});
world.addConstraint(hinge);
// Enable motor on hinge
hinge.enableMotor();
hinge.setMotorSpeed(2); // radians/sec
hinge.setMotorMaxForce(100);

// Lock — weld two bodies
const lock = new CANNON.LockConstraint(bodyA, bodyB);
world.addConstraint(lock);

// Distance — keep bodies at fixed distance (spring-like)
const dist = new CANNON.DistanceConstraint(bodyA, bodyB, 2); // target distance
world.addConstraint(dist);

// Remove constraint
world.removeConstraint(hinge);
```

---

## Collision Events

```js
// Per-body collision
bodyA.addEventListener("collide", (event) => {
  const { body: otherBody, contact } = event;
  const impactSpeed = contact.getImpactVelocityAlongNormal();
  if (Math.abs(impactSpeed) > 2) {
    playImpactSound(impactSpeed);
  }
});

// World-level — all collisions
world.addEventListener("beginContact", (event) => {
  const { bodyA, bodyB } = event;
});

world.addEventListener("endContact", (event) => {
  // bodies separated
});
```

---

## Applying Forces & Impulses

```js
// Continuous force (gravity-like, applied per frame)
body.applyForce(new CANNON.Vec3(0, 100, 0), body.position);

// Impulse — instant velocity change (jump, explosion)
body.applyImpulse(new CANNON.Vec3(0, 10, 0), body.position);

// Local force (relative to body orientation)
body.applyLocalForce(new CANNON.Vec3(0, 0, -10), new CANNON.Vec3(0, 0, 0));

// Set velocity directly
body.velocity.set(0, 5, 0);
body.angularVelocity.set(0, 1, 0);
```

---

## Character Controller Pattern

```js
// Pseudo character controller — sphere body + velocity control
const characterBody = new CANNON.Body({
  mass: 70,
  position: new CANNON.Vec3(0, 1, 0),
  linearDamping: 0.9, // high damping = quick stop
  angularDamping: 1.0, // prevent rotation
  fixedRotation: true, // never rotate the body
});
characterBody.addShape(new CANNON.Sphere(0.4));
world.addBody(characterBody);

const keys = {};
document.addEventListener("keydown", (e) => (keys[e.code] = true));
document.addEventListener("keyup", (e) => (keys[e.code] = false));

let onGround = false;
characterBody.addEventListener("collide", (e) => {
  // Check if hit something below
  const contact = e.contact;
  const normal = contact.ni;
  if (normal.y > 0.5) onGround = true;
});

// In render loop (before world.step):
const speed = 8;
const vel = characterBody.velocity;
if (keys["KeyW"]) vel.z = -speed;
if (keys["KeyS"]) vel.z = speed;
if (keys["KeyA"]) vel.x = -speed;
if (keys["KeyD"]) vel.x = speed;
if (keys["Space"] && onGround) {
  vel.y = 8;
  onGround = false;
}
```

---

## Render Loop

```js
const fixedTimeStep = 1 / 60;
const maxSubSteps = 3;
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1); // cap delta to avoid spiral of death
  world.step(fixedTimeStep, delta, maxSubSteps);

  // Sync all Three.js meshes to physics bodies
  for (const { mesh, body } of physicsObjects) {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  }

  renderer.render(scene, camera);
}
```

---

## Performance Tips

- `world.allowSleep = true` + body `allowSleep = true` — sleeping bodies skip physics
- Use simple shapes over Trimesh whenever possible — sphere and box are fastest
- `SAPBroadphase` over `NaiveBroadphase` for scenes with 20+ bodies
- Use `fixedRotation = true` for character bodies — prevents expensive rotation solve
- Cap delta time: `Math.min(delta, 0.1)` — prevents "spiral of death" on tab switch
- Batch syncing: only sync meshes with active (non-sleeping) bodies

```js
// Only sync awake bodies
if (!body.sleepState === CANNON.Body.SLEEPING) {
  mesh.position.copy(body.position);
  mesh.quaternion.copy(body.quaternion);
}
```
