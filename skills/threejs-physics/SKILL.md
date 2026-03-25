---
name: threejs-physics
description: Integrates physics engines with Three.js — cannon-es, Rapier (WASM), and Ammo.js. Covers rigid bodies, constraints, collision detection, character controllers, and physics-visual sync. Use when the user asks about physics, collisions, rigid bodies, gravity, constraints, joints, or physics simulation. Trigger keywords: physics, cannon-es, rapier, ammo.js, rigid body, collision, gravity, constraint, character controller.
---

# Three.js Physics

## cannon-es (simplest, JavaScript)

```bash
npm install cannon-es
```

See [CANNON.md](CANNON.md) for complete reference.

```js
import * as CANNON from "cannon-es";

// 1. Physics world
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.81, 0) });
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

// 2. Ground (static)
const groundBody = new CANNON.Body({ mass: 0 }); // mass 0 = static
groundBody.addShape(new CANNON.Plane());
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// 3. Box (dynamic)
const boxBody = new CANNON.Body({
  mass: 1,
  position: new CANNON.Vec3(0, 5, 0),
  shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)), // half-extents
});
world.addBody(boxBody);

// 4. Sync Three.js mesh to physics body
const boxMesh = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial(),
);
scene.add(boxMesh);

// 5. Render loop — step world, sync visuals
const fixedTimeStep = 1 / 60;
const maxSubSteps = 3;
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  world.step(fixedTimeStep, delta, maxSubSteps);

  // Sync mesh to body
  boxMesh.position.copy(boxBody.position);
  boxMesh.quaternion.copy(boxBody.quaternion);

  renderer.render(scene, camera);
}
```

## Rapier (WASM, most accurate)

```bash
npm install @dimforge/rapier3d-compat
```

See [RAPIER.md](RAPIER.md) for complete reference.

```js
import RAPIER from "@dimforge/rapier3d-compat";

await RAPIER.init(); // WASM init — must await before use

const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });

// Ground
const groundDesc = RAPIER.RigidBodyDesc.fixed();
const groundBody = world.createRigidBody(groundDesc);
const groundCollider = world.createCollider(
  RAPIER.ColliderDesc.cuboid(10, 0.1, 10),
  groundBody,
);

// Dynamic box
const boxDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 5, 0);
const boxBody = world.createRigidBody(boxDesc);
const boxCollider = world.createCollider(
  RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5),
  boxBody,
);

// Sync in loop
function animate() {
  requestAnimationFrame(animate);
  world.step();

  const pos = boxBody.translation();
  const rot = boxBody.rotation();
  boxMesh.position.set(pos.x, pos.y, pos.z);
  boxMesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);

  renderer.render(scene, camera);
}
```

## cannon-es: Common Shapes

```js
new CANNON.Sphere(radius);
new CANNON.Box(new CANNON.Vec3(hw, hh, hd)); // half-extents
new CANNON.Plane(); // infinite flat plane
new CANNON.Cylinder(rTop, rBottom, height, segments);
new CANNON.Trimesh(vertices, indices); // concave — expensive
new CANNON.ConvexPolyhedron(points, faces); // convex — preferred for custom
new CANNON.Heightfield(data, { elementSize: 1 }); // terrain
```

## cannon-es: Constraints & Joints

```js
// Lock two bodies together at a point
const constraint = new CANNON.PointToPointConstraint(
  bodyA,
  new CANNON.Vec3(0, 0.5, 0),
  bodyB,
  new CANNON.Vec3(0, -0.5, 0),
);
world.addConstraint(constraint);

// Hinge (door, wheel)
const hinge = new CANNON.HingeConstraint(bodyA, bodyB, {
  pivotA: new CANNON.Vec3(0.5, 0, 0),
  pivotB: new CANNON.Vec3(-0.5, 0, 0),
  axisA: new CANNON.Vec3(0, 1, 0),
  axisB: new CANNON.Vec3(0, 1, 0),
});
world.addConstraint(hinge);

// Lock constraint (weld)
const lock = new CANNON.LockConstraint(bodyA, bodyB);
world.addConstraint(lock);
```

## cannon-es: Collision Events

```js
boxBody.addEventListener("collide", (event) => {
  const contact = event.contact;
  const velocity = contact.getImpactVelocityAlongNormal();
  if (Math.abs(velocity) > 1.5) {
    playImpactSound();
  }
});
```

## cannon-es: Materials & Friction

```js
const iceMaterial = new CANNON.Material("ice");
const groundMaterial = new CANNON.Material("ground");

const iceGroundContact = new CANNON.ContactMaterial(
  iceMaterial,
  groundMaterial,
  { friction: 0.0, restitution: 0.3 }, // restitution = bounciness
);
world.addContactMaterial(iceGroundContact);

boxBody.material = iceMaterial;
groundBody.material = groundMaterial;
```

## Common Gotchas

- cannon-es `Box` uses **half-extents** — `new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5))` for a 1×1×1 cube
- Rapier must be `await RAPIER.init()` before any use — WASM needs to load
- `mass: 0` in cannon-es = static body (never moves)
- `world.step(fixedTimeStep, delta, maxSubSteps)` — use fixed step for determinism
- Don't use `Trimesh` for dynamic bodies in cannon-es — only static. Use `ConvexPolyhedron` instead.
- Sync mesh quaternion as `mesh.quaternion.copy(body.quaternion)` — both use the same XYZW format
- Rapier `cuboid` also uses half-extents: `ColliderDesc.cuboid(0.5, 0.5, 0.5)` for 1×1×1
