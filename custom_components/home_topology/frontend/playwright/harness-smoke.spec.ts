import { test, expect } from '@playwright/test';

/**
 * Harness Smoke Test
 * Verified against the new Flat Rendering Pattern (ADR-HA-008)
 */
test.describe('Mock Harness Smoke Test', () => {

  test.beforeEach(async ({ page }) => {
    // Go to the mock harness
    await page.goto('/mock-harness.html');
    // Wait for the panel to load
    await expect(page.locator('home-topology-panel')).toBeVisible();
  });

  test('visual verification: icons and hierarchy', async ({ page }) => {
    // 1. Verify icons are NOT "?"
    // The MockHaIcon renders the emoji equivalent. "mdi:layers" -> "≡"
    const houseIcon = page.locator('ht-location-tree [data-id="house"] .location-icon ha-icon');
    await expect(houseIcon).toBeVisible();
    const iconText = await houseIcon.textContent();
    expect(iconText).not.toBe('?');

    // 2. Verify deep nesting (5 levels from mock data)
    // House → Main Floor → Kitchen → Pantry → Pantry Shelf → Top Shelf
    const topShelf = page.locator('ht-location-tree [data-id="pantry-shelf-top"]');
    await expect(topShelf).toBeVisible();

    // Check indentation (depth 5 -> 5 * 24 = 120px)
    const style = await topShelf.evaluate((el) => window.getComputedStyle(el).marginLeft);
    expect(style).toBe('120px');
  });

  test('interaction: inline rename via double-click', async ({ page }) => {
    const kitchenName = page.locator('ht-location-tree [data-id="kitchen"] .location-name');
    await expect(kitchenName).toHaveText('Kitchen');

    // Double click to enter edit mode
    await kitchenName.dblclick();

    // Verify input appears with correct value
    const input = page.locator('ht-location-tree .location-name-input');
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('Kitchen');

    // Rename and press Enter
    await input.fill('Gourmet Kitchen');
    await input.press('Enter');

    // Verify name updated in tree
    await expect(kitchenName).toHaveText('Gourmet Kitchen');
  });

  test('interaction: new location creation and persistence', async ({ page }) => {
    // 1. Click New Location
    await page.click('text=+ New Location');

    // 2. Verify dialog is visible and name field is focused
    const dialog = page.locator('ht-location-dialog ha-dialog');
    await expect(dialog).toBeVisible();

    const nameInput = dialog.locator('input[aria-label="name"]');
    await expect(nameInput).toBeFocused();

    // 3. Fill form
    await nameInput.fill('Deep Cellar');
    await dialog.locator('select[aria-label="type"]').selectOption('area');

    // Select "Basement" as parent (depth 1)
    await dialog.locator('select[aria-label="parent_id"]').selectOption({ label: 'Basement' });

    // 4. Create
    const createBtn = dialog.locator('mwc-button[slot="primaryAction"]');
    await expect(createBtn).toBeEnabled();
    await createBtn.click();

    // 5. Verify it appears in the tree under Basement
    const newLoc = page.locator('ht-location-tree [data-id^="loc-"]', { hasText: 'Deep Cellar' }).first();
    await expect(newLoc).toBeVisible();

    // Check indentation (Basement is depth 0, Deep Cellar should be depth 1 -> 24px)
    const style = await newLoc.evaluate((el) => window.getComputedStyle(el).marginLeft);
    expect(style).toBe('24px');
  });

  test('interaction: drag and drop reordering', async ({ page }) => {
    // Note: Playwright mouse drag is the most reliable way to test SortableJS
    const kitchen = page.locator('ht-location-tree [data-id="kitchen"] .drag-handle');
    const livingRoom = page.locator('ht-location-tree [data-id="living-room"]');

    const source = await kitchen.boundingBox();
    const target = await livingRoom.boundingBox();

    if (source && target) {
      // Drag kitchen below living room
      await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
      await page.mouse.down();
      // Move to middle of Living Room then further down to ensure it drops AFTER
      await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 30 });
      await page.mouse.move(target.x + target.width / 2, target.y + target.height + 20, { steps: 30 });
      await page.mouse.up();
    }

    // Verify Kitchen is now AFTER Living Room in the DOM (flat list order)
    const items = await page.locator('ht-location-tree .tree-item').evaluateAll(els =>
      els.map(el => el.getAttribute('data-id'))
    );

    const kitchenIdx = items.indexOf('kitchen');
    const livingIdx = items.indexOf('living-room');

    expect(kitchenIdx).toBeGreaterThan(livingIdx);
  });
});

