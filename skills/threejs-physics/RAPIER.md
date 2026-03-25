# RAPIER.md — Rapier Physics Complete Reference

Rapier is a WASM-based physics engine — more accurate than cannon-es, faster for large scenes.

## Contents

- Setup and init
- World, rigid bodies, colliders
- Collider shapes
- Character controller
- Joints
- Collision events
- Sync with Three.js

---

## Install & Init

```bash
npm install @dimforge/rapier3d-compat
```

```js
import RAPIER from "@dimforge/rapier3d-compat";

// MUST await before any Rapier usage
await RAPIER.init();

const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
```

---

## Rigid Bodies

```js
// Static — never moves
const staticDesc = RAPIER.RigidBodyDesc.fixed();
const staticBody = world.createRigidBody(staticDesc);

// Dynamic — full physics simulation
const dynamicDesc = RAPIER.RigidBodyDesc.dynamic()
  .setTranslation(0, 5, 0)
  .setLinearDamping(0.1)
  .setAngularDamping(0.1);
const dynamicBody = world.createRigidBody(dynamicDesc);

// Kinematic position-based — move by setting position
const kinematicDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
const kinematicBody = world.createRigidBody(kinematicDesc);

// Kinematic velocity-based
const kvDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased();
```

---

## Colliders (shapes attached to bodies)

```js
// IMPORTANT: Rapier cuboid also uses HALF-extents
const collider = world.createCollider(
  RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5), // 1x1x1 cube
  dynamicBody,
);

// All collider shapes
RAPIER.ColliderDesc.cuboid(hx, hy, hz);
RAPIER.ColliderDesc.ball(radius);
RAPIER.ColliderDesc.cylinder(halfHeight, radius);
RAPIER.ColliderDesc.cone(halfHeight, radius);
RAPIER.ColliderDesc.capsule(halfHeight, radius);
RAPIER.ColliderDesc.trimesh(vertices, indices); // static only, Float32Array + Uint32Array
RAPIER.ColliderDesc.heightfield(nrows, ncols, heights, scale); // terrain

// Collider properties
const desc = RAPIER.ColliderDesc.ball(0.5)
  .setFriction(0.5)
  .setRestitution(0.3) // bounciness
  .setDensity(1.0)
  .setMass(1.0)
  .setSensor(false) // sensors detect but don't collide
  .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

const collider = world.createCollider(desc, body);
```

---

## Character Controller

```js
const controller = world.createCharacterController(0.01); // offset from surface
controller.setUp({ x: 0, y: 1, z: 0 });
controller.setMaxSlopeClimbAngle((45 * Math.PI) / 180);
controller.setMinSlopeSlideAngle((30 * Math.PI) / 180);
controller.enableAutostep(0.5, 0.2, true);
controller.enableSnapToGround(0.5);
controller.setApplyImpulsesToDynamicBodies(true);

// In loop:
const movement = { x: 0, y: -9.81 * delta, z: 0 }; // gravity + input
controller.computeColliderMovement(collider, movement);
const corrected = controller.computedMovement();

// Apply to kinematic body
const pos = characterBody.translation();
characterBody.setNextKinematicTranslation({
  x: pos.x + corrected.x,
  y: pos.y + corrected.y,
  z: pos.z + corrected.z,
});

// Is on ground?
controller.computedGrounded(); // boolean
```

---

## Joints

```js
// Fixed joint (weld)
const params = RAPIER.JointData.fixed(
  { x: 0, y: 0.5, z: 0 }, // anchor on body1 (local)
  { x: 0, y: 0, z: 1, w: 0 }, // frame on body1
  { x: 0, y: -0.5, z: 0 }, // anchor on body2 (local)
  { x: 0, y: 0, z: 1, w: 0 }, // frame on body2
);
world.createImpulseJoint(params, body1, body2, true);

// Revolute joint (hinge)
const revolute = RAPIER.JointData.revolute(
  { x: 0.5, y: 0, z: 0 }, // anchor on body1
  { x: -0.5, y: 0, z: 0 }, // anchor on body2
  { x: 0, y: 1, z: 0 }, // rotation axis
);
const joint = world.createImpulseJoint(revolute, body1, body2, true);

// Ball joint
const ball = RAPIER.JointData.spherical(
  { x: 0, y: 0.5, z: 0 },
  { x: 0, y: -0.5, z: 0 },
);
```

---

## Collision Events

```js
// Enable events on collider
const desc = RAPIER.ColliderDesc.ball(0.5).setActiveEvents(
  RAPIER.ActiveEvents.COLLISION_EVENTS,
);
const collider = world.createCollider(desc, body);

// Step and handle events
const eventQueue = new RAPIER.EventQueue(true);

// In loop:
world.step(eventQueue);

eventQueue.drainCollisionEvents((handle1, handle2, started) => {
  if (started) {
    // Collision began between collider handle1 and handle2
    const col1 = world.getCollider(handle1);
    const col2 = world.getCollider(handle2);
  }
});
```

---

## Sync with Three.js

```js
// After world.step():
const pos = body.translation(); // { x, y, z }
const rot = body.rotation(); // { x, y, z, w }

mesh.position.set(pos.x, pos.y, pos.z);
mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);

// Or use copy helpers
mesh.position.copy(body.translation());
mesh.quaternion.copy(body.rotation());
```

---

## Common Gotchas

- `await RAPIER.init()` is mandatory before any Rapier call — wrap in async function
- Rapier colliders use half-extents like cannon-es — `cuboid(0.5, 0.5, 0.5)` = 1×1×1
- Character controller requires a **kinematic** body, not dynamic
- Collision events require `setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)` on each collider
- Rapier has no `delta` parameter in `world.step()` — it uses a fixed timestep set at init
- For variable-rate stepping: `world.timestep = delta` before each `world.step()`
