# Setting Up Test Topology

This guide shows you how to create a hierarchical home structure for testing Home Topology.

## Goal Structure

```
Home (Building)
├── Ground Floor
│   ├── Living Room
│   ├── Kitchen
│   └── Hallway
└── First Floor
    ├── Master Bedroom
    └── Guest Bedroom
```

## Method 1: Using the Script (Easiest)

1. Get a Long-Lived Access Token:

   - Go to your Profile (bottom left in HA)
   - Scroll to "Long-Lived Access Tokens"
   - Click "Create Token"
   - Copy the token

2. Run the script:

   ```bash
   cd /workspaces/home-topology-ha
   python3 scripts/setup-test-topology.py
   ```

3. Paste your token when prompted

## Method 2: Using Developer Tools → Actions

Unfortunately, WebSocket commands aren't available via the Actions UI. You'll need to use Method 1 or Method 3.

## Method 3: Using Browser Console

1. Open Home Assistant in your browser
2. Open DevTools (F12)
3. Go to Console tab
4. Paste and run this:

```javascript
// Get WebSocket connection
const ws = hassConnection.conn.socket;

// Helper to send command and wait for response
const sendCommand = (command) => {
  return new Promise((resolve) => {
    const id = Math.random();
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener("message", handler);
        resolve(msg);
      }
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id, ...command }));
  });
};

// Create locations
(async () => {
  // Root
  await sendCommand({
    type: "home_topology/locations/create",
    name: "Home",
    parent_id: null,
  });

  // Floors
  await sendCommand({
    type: "home_topology/locations/create",
    name: "Ground Floor",
    parent_id: "home",
  });

  await sendCommand({
    type: "home_topology/locations/create",
    name: "First Floor",
    parent_id: "home",
  });

  // Ground floor rooms
  await sendCommand({
    type: "home_topology/locations/create",
    name: "Living Room",
    parent_id: "ground_floor",
  });

  await sendCommand({
    type: "home_topology/locations/create",
    name: "Kitchen",
    parent_id: "ground_floor",
  });

  await sendCommand({
    type: "home_topology/locations/create",
    name: "Hallway",
    parent_id: "ground_floor",
  });

  // First floor rooms
  await sendCommand({
    type: "home_topology/locations/create",
    name: "Master Bedroom",
    parent_id: "first_floor",
  });

  await sendCommand({
    type: "home_topology/locations/create",
    name: "Guest Bedroom",
    parent_id: "first_floor",
  });

  console.log("✅ Topology created!");
})();
```

## Method 4: Configure in Home Assistant

If your HA version supports floors:

1. Go to **Settings → Areas, labels & zones**
2. Create floors: "Ground Floor" and "First Floor"
3. Create/edit areas and assign them to floors
4. Restart the Home Topology integration

## Viewing Your Topology

After setup, go to:

- **Settings → Devices & Services → Home Topology**
- Or use WebSocket command:

```javascript
await sendCommand({ type: "home_topology/locations/list" });
```

## What You Should See

After setup, the Entities page will show sensors for:

- Home (building-level)
- Each floor (aggregated)
- Each room (individual)

Each location gets:

- `sensor.<location>_ambient_light`
- `binary_sensor.<location>_is_bright`
- `binary_sensor.<location>_is_dark`
- `binary_sensor.<location>_occupancy`
