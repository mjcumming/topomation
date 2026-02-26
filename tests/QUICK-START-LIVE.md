# Quick Start: Live HA Testing

**Get running in 5 minutes!**

For this repo's dev container workflow, use **`DEV-CONTAINER-HA.md`** as the canonical reference for where HA runs and how to restart it.

## Option 1: Use Your Existing HA (Fastest)

### Step 1: Get Your Token

1. Open your Home Assistant: `http://your-ha:8123`
2. Click your profile (bottom left)
3. Scroll to "Long-Lived Access Tokens"
4. Click "Create Token"
5. Name it: "Integration Testing"
6. Copy the token

### Step 2: Configure Tests

```bash
cd /workspaces/topomation/tests

# Copy template
cp ha-config.env.template ha-config.env

# Edit with your details
nano ha-config.env
```

Paste your token:

```bash
HA_URL="http://localhost:8123"  # Your HA URL
HA_TOKEN="eyJ0eXAiOiJ..."        # Token you just copied
TEST_MODE="live"
TEST_TIMEOUT=10
```

### Step 3: Run Tests

```bash
# From project root
make test-live

# Or directly
./tests/run-live-tests.sh
```

That's it! ✅

---

## Option 2: Spin Up Test HA (Isolated)

### Step 1: Start Test HA

```bash
# Start test HA in Docker
make test-ha-up

# Wait for startup (check logs)
make test-ha-logs
# Press Ctrl+C when you see "Home Assistant initialized"
```

### Step 2: Complete Setup

1. Visit: http://localhost:8124
2. Create user:
   - Name: "Test User"
   - Username: `test`
   - Password: `test123456`
3. Skip location/analytics

### Step 3: Add Integration

1. Settings → Devices & Services
2. Add Integration → Search "Topomation"
3. Click "Topomation" → Submit

### Step 4: Get Token

1. Profile (bottom left) → Security
2. Long-Lived Access Tokens → Create Token
3. Name: "Integration Testing"
4. Copy token

### Step 5: Configure Tests

```bash
cd /workspaces/topomation/tests
cp ha-config.env.template ha-config.env
nano ha-config.env
```

Set:

```bash
HA_URL="http://localhost:8124"  # Note: 8124 for test HA!
HA_TOKEN="your_token_here"
TEST_MODE="live"
```

### Step 6: Run Tests

```bash
make test-live
```

### Step 7: Cleanup

```bash
# Stop test HA
make test-ha-down

# Or keep it running for future tests!
```

---

## Verify It's Working

### Test Connection

```bash
source tests/ha-config.env

curl -H "Authorization: Bearer $HA_TOKEN" \
     $HA_URL/api/
```

Should return: `{"message": "API running."}`

### Run Single Test

```bash
./tests/run-live-tests.sh tests/test-realworld.py::TestLocationAreaSync::test_ha_areas_imported_as_locations -v
```

---

## Common Commands

```bash
# Run all real-world tests against live HA
make test-live

# Run specific test class
pytest tests/test-realworld.py::TestEventFlowIntegration -v --live-ha

# Run with debug output
source tests/ha-config.env
pytest tests/test-realworld.py -v -s --live-ha --log-cli-level=DEBUG

# Run bidirectional sync tests
pytest tests/test-bidirectional-sync.py -v --live-ha

# Check test HA logs
make test-ha-logs
```

---

## Troubleshooting

### "Cannot connect to HA"

```bash
# Check HA is running
curl http://localhost:8123/api/  # or 8124 for test HA

# Check from container
docker exec -it your-dev-container curl http://host.docker.internal:8123/api/
```

### "Integration not loaded"

```bash
# Restart HA
# Visit: Settings → System → Restart

# Or via API
curl -X POST -H "Authorization: Bearer $HA_TOKEN" \
     $HA_URL/api/services/homeassistant/restart
```

### "Tests hang"

- Check `TEST_TIMEOUT=10` in ha-config.env
- Verify integration is loaded in HA
- Check HA logs: `make test-ha-logs`

### "Token invalid"

- Tokens don't expire but can be deleted
- Create new token: Profile → Security → Create Token
- Update ha-config.env with new token

---

## What Gets Tested

When running against live HA, tests validate:

✅ **Real area import** - HA areas → topology locations
✅ **Real sensor events** - Actual state changes trigger occupancy
✅ **Real timeout coordination** - Coordinator schedules actual timers
✅ **Real entity updates** - Binary sensors update in real HA
✅ **Real WebSocket API** - Frontend commands work correctly

---

## Next Steps

1. ✅ Get basic tests running
2. Create test areas in HA for more realistic tests
3. Add test sensors (motion, door, lights)
4. Run bidirectional sync tests
5. Test with your actual sensors!

---

**Still stuck?** Check the full guide: `RUN-AGAINST-HA.md`

**Working?** Great! Now you can test against real Home Assistant! 🎉
