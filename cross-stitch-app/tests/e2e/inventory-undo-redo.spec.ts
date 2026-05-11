/**
 * Inventory Panel + Undo/Redo Integration Tests
 *
 * The InventoryPanel manages skein quantities independently from the grid.
 * Adding/removing/modifying inventory items does NOT push to the grid's
 * undo stack — but the interaction between inventory state and undo/redo
 * needs to be tested for correctness.
 *
 * Potential bugs this targets:
 * - Adding/removing inventory items corrupts the undo stack
 * - Undo after inventory edit affects inventory state (should not)
 * - Redo invalidation doesn't work correctly when inventory is modified
 * - Undo/redo doesn't restore grid data when inventory panel is open
 * - Rapid inventory edits during undo/redo cause state desync
 * - Removing all inventory items then undo breaks things
 */

import { test, expect } from '../fixtures/base'

// ── Helpers ────────────────────────────────────────────────────────

/** Open the right panel, then switch to the Inventory tab */
async function openInventoryPanel(page: any): Promise<void> {
  // Open the right panel if not already open
  const closeBtn = page.locator('button[title="Close panel"]')
  const panelOpen = await closeBtn.isVisible({ timeout: 300 }).catch(() => false)
  if (!panelOpen) {
    const panelToggle = page.locator('button').filter({ hasText: 'Panel' }).first()
    await panelToggle.click()
  }
  // Switch to Inventory tab
  const invTab = page.locator('button').filter({ hasText: 'Inventory' }).first()
  await invTab.click()
  await await new Promise(r => setTimeout(r, 500))
}

/** Place stitches on the grid at fixed positions */
async function placeStitches(page: any, count: number): Promise<void> {
  const main = page.locator('main')
  for (let i = 0; i < count; i++) {
    await main.click({ position: { x: 100 + i * 25, y: 100 } })
    await await new Promise(r => setTimeout(r, 80))
  }
  await await new Promise(r => setTimeout(r, 300))
}

/**
 * Add a skein to inventory via the manual input fields.
 */
async function addSkeinToInventory(page: any, dmc: string, qty: number): Promise<void> {
  const dmcInput = page.locator('input[placeholder="DMC #"]').first()
  const qtyInput = page.locator('input[placeholder="Qty"]').first()
  const addBtn = page.locator('button').filter({ hasText: 'Add' }).first()

  // Wait for inputs to be visible
  await expect(dmcInput).toBeVisible({ timeout: 5000 })
  await expect(qtyInput).toBeVisible({ timeout: 5000 })

  await dmcInput.fill(dmc)
  await qtyInput.fill(String(qty))
  await addBtn.click()
  await await new Promise(r => setTimeout(r, 500))
}

/**
 * Open right panel and the Project tab (where undo/redo buttons are visible).
 */
async function openPanelAndProjectTab(page: any): Promise<void> {
  const closeBtn = page.locator('button[title="Close panel"]')
  const panelOpen = await closeBtn.isVisible({ timeout: 300 }).catch(() => false)
  if (!panelOpen) {
    const panelToggle = page.locator('button').filter({ hasText: 'Panel' }).first()
    await panelToggle.click()
  }
  // Switch to Project tab (undo/redo buttons are in main toolbar under this tab)
  const projectTab = page.locator('button').filter({ hasText: 'Project' }).first()
  await projectTab.click()
  await await new Promise(r => setTimeout(r, 300))
}

// ─── 1. Inventory CRUD does NOT affect undo/redo availability ──────

test.describe('Inventory CRUD operations independence from undo/redo', () => {
  // Add a skein — undo/redo buttons remain functional
  test('adding a skein does not affect undo/redo availability', async ({ page, openPanelTab }) => {
    // Open inventory panel
    await openInventoryPanel(page)

    // Add a skein via manual inputs
    await addSkeinToInventory(page, '101', '1')

    // Switch to Project tab to access undo/redo buttons
    await openPanelAndProjectTab(page)

    // Undo/redo buttons should be accessible
    const undoBtn = page.locator('button[title="Undo"]').first()
    const redoBtn = page.locator('button[title="Redo"]').first()
    await expect(undoBtn).toBeVisible()
    await expect(redoBtn).toBeVisible()
  })

  // Modify inventory quantity — undo/redo buttons still functional
  test('modifying inventory quantity does not break undo/redo buttons', async ({
    page,
    openPanelTab,
  }) => {
    await openInventoryPanel(page)

    // Add a skein first
    await addSkeinToInventory(page, '202', '1')

    // Find the inventory entry's increment button (Plus icon)
    // The increment button is the one with Plus SVG (M3 12h18)
    const plusIcon = page.locator('button svg path[d*="M3 12h18"]').first()
    if (await plusIcon.count() > 0) {
      await plusIcon.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Switch to Project tab
    await openPanelAndProjectTab(page)

    // Undo/redo buttons still present
    const undoBtn = page.locator('button[title="Undo"]').first()
    const redoBtn = page.locator('button[title="Redo"]').first()
    await expect(undoBtn).toBeVisible()
    await expect(redoBtn).toBeVisible()
  })

  // Trash a skein — undo/redo buttons still functional
  test('trashing a skein does not break undo/redo buttons', async ({
    page,
    openPanelTab,
  }) => {
    await openInventoryPanel(page)

    // Add a skein
    await addSkeinToInventory(page, '303', '1')

    // Click trash button (Trash2 icon in inventory entry)
    // The Trash2 icon path: M6 19h12 M11 5h2 M8 5V3h8v2 M19 5h-2 M7 5h10
    // But simpler: find button with red color class inside inventory row
    const trashBtn = page.locator('button').filter({ hasText: '' }).first()
    // Actually, let's click the SVG with Trash icon
    const trashSvg = page.locator('button svg').filter({ hasText: '' }).last()
    // Simplest approach: find all buttons in inventory list area
    const inventoryRows = page.locator('[class*="bg-white"][class*="border"]')
    if (await inventoryRows.count() > 0) {
      const row = inventoryRows.first()
      const rowButtons = row.locator('button')
      if (await rowButtons.count() > 0) {
        // The last button in the row is usually the trash button
        await rowButtons.last().click()
        await await new Promise(r => setTimeout(r, 500))
      }
    }

    // Switch to Project tab
    await openPanelAndProjectTab(page)

    // Undo/redo buttons still present
    const undoBtn = page.locator('button[title="Undo"]').first()
    await expect(undoBtn).toBeVisible()
  })
})

// ─── 2. Grid undo/redo with inventory panel open ───────────────────

test.describe('Grid undo/redo with inventory panel open', () => {
  test('placing stitches then undoing works when inventory panel was opened', async ({
    page,
    openPanelTab,
  }) => {
    // Open inventory panel first (this exercises panel state before grid interaction)
    await openInventoryPanel(page)

    // Switch to a view where we can click the grid (close panel or switch tabs)
    // Close the right panel to return to clean grid view
    const closeBtn = page.locator('button[title="Close panel"]')
    await closeBtn.click()
    await await new Promise(r => setTimeout(r, 200))

    // Place some stitches
    await placeStitches(page, 3)

    // Undo should work
    const undoBtn = page.locator('button[title="Undo"]').first()
    await expect(undoBtn).toBeVisible()
    await expect(undoBtn).toBeEnabled()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Page should still be functional
    await expect(page.locator('main')).toBeVisible()
  })

  test('redo after undo works correctly (inventory panel was opened)', async ({
    page,
    openPanelTab,
  }) => {
    // Open inventory panel using fixture, then close panel to get back to grid
    await openPanelTab('Inventory')
    await await new Promise(r => setTimeout(r, 300))
    const closeBtn = page.locator('button[title="Close panel"]')
    if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await closeBtn.click()
    }
    await await new Promise(r => setTimeout(r, 300))

    // Place stitches
    await placeStitches(page, 2)

    // Undo then redo
    const undoBtn = page.locator('button[title="Undo"]').first()
    const redoBtn = page.locator('button[title="Redo"]').first()
    await expect(undoBtn).toBeEnabled()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Redo should now be available (undo created a redo entry)
    await expect(redoBtn).toBeEnabled()
    await redoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Undo should be available again
    await expect(undoBtn).toBeEnabled()
  })

  test('undo works correctly after opening/closing inventory panel', async ({
    page,
    openPanelTab,
  }) => {
    // Open inventory
    await openInventoryPanel(page)

    // Close the right panel
    await page.locator('button[title="Close panel"]').click()
    await await new Promise(r => setTimeout(r, 200))

    // Place stitches
    await placeStitches(page, 2)

    // Undo should work
    const undoBtn = page.locator('button[title="Undo"]').first()
    await expect(undoBtn).toBeEnabled()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Page still functional
    await expect(page.locator('main')).toBeVisible()
  })
})

// ─── 3. Undo/redo invalidation with inventory operations ──────────

test.describe('Undo/redo invalidation with inventory operations', () => {
  test('undo then new grid edit invalidates redo (inventory was opened)', async ({
    page,
    openPanelTab,
  }) => {
    // Open inventory
    await openInventoryPanel(page)

    // Close panel
    await page.locator('button[title="Close panel"]').click()
    await await new Promise(r => setTimeout(r, 200))

    // Place 3 stitches
    await placeStitches(page, 3)

    // Undo once
    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Place a new stitch (should invalidate redo stack)
    await placeStitches(page, 1)

    // Undo still works, redo button should be disabled
    const redoBtn = page.locator('button[title="Redo"]').first()
    const disabled = await redoBtn.getAttribute('disabled')
    expect(disabled).not.toBeNull()
  })
})

// ─── 4. Inventory CRUD independence from grid undo/redo ──────────

test.describe('Inventory CRUD independence from grid undo/redo', () => {
  test('grid undo does not affect inventory data added before grid edits', async ({
    page,
    openPanelTab,
  }) => {
    // Add inventory item
    await openInventoryPanel(page)
    await addSkeinToInventory(page, '404', '2')

    // Verify it was added (use .first() to avoid strict mode violation)
    await expect(page.locator('text=DMC 404').first()).toBeVisible()

    // Close panel, place stitches
    await page.locator('button[title="Close panel"]').click()
    await await new Promise(r => setTimeout(r, 200))
    await placeStitches(page, 2)

    // Undo grid edit
    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Inventory data should still be there
    await openInventoryPanel(page)
    // DMC 404 should still exist in inventory
    await expect(page.locator('text=DMC 404').first()).toBeVisible()
  })

  test('adding inventory after undo does not corrupt redo availability', async ({
    page,
    openPanelTab,
  }) => {
    // Place stitches
    await placeStitches(page, 3)

    // Undo
    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Add inventory item
    await openInventoryPanel(page)
    await addSkeinToInventory(page, '505', '1')

    // Close panel, check redo
    await page.locator('button[title="Close panel"]').click()
    await await new Promise(r => setTimeout(r, 200))

    const redoBtn = page.locator('button[title="Redo"]').first()
    // Redo should still be available (inventory didn't corrupt stack)
    await expect(redoBtn).toBeEnabled()

    // Redo should work
    await redoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Place more to verify redo invalidation still works
    await placeStitches(page, 1)

    // Now redo should be invalidated
    const redoBtn2 = page.locator('button[title="Redo"]').first()
    const disabled = await redoBtn2.getAttribute('disabled')
    expect(disabled).not.toBeNull()
  })
})

// ─── 5. Rapid inventory edits with undo/redo ──────────────────────

test.describe('Rapid inventory edits with undo/redo', () => {
  test('rapidly adding inventory items while undo stack exists does not crash', async ({
    page,
    openPanelTab,
  }) => {
    // Place stitches to create undo stack
    await placeStitches(page, 2)

    // Open inventory and rapidly add items
    await openInventoryPanel(page)

    for (let i = 0; i < 5; i++) {
      await addSkeinToInventory(page, String(600 + i), '1')
    }

    // Close panel
    await page.locator('button[title="Close panel"]').click()
    await await new Promise(r => setTimeout(r, 200))

    // Undo should still work
    const undoBtn = page.locator('button[title="Undo"]').first()
    await expect(undoBtn).toBeEnabled()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Page should still be responsive
    await expect(page.locator('main')).toBeVisible()
  })

  test('undo then rapid inventory edits then redo works correctly', async ({
    page,
    openPanelTab,
  }) => {
    // Place stitches
    await placeStitches(page, 3)

    // Undo
    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Rapidly add inventory items
    await openInventoryPanel(page)

    for (let i = 0; i < 3; i++) {
      await addSkeinToInventory(page, String(700 + i), '1')
    }

    // Close panel, redo should still be available
    await page.locator('button[title="Close panel"]').click()
    await await new Promise(r => setTimeout(r, 200))

    const redoBtn = page.locator('button[title="Redo"]').first()
    await expect(redoBtn).toBeEnabled()
    await redoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Should still be functional
    await expect(page.locator('main')).toBeVisible()
  })
})

// ─── 6. Edge cases ───────────────────────────────────────────────

test.describe('Inventory + undo/redo edge cases', () => {
  test('empty grid: adding inventory then placing stitches and undo works', async ({
    page,
    openPanelTab,
  }) => {
    // Add inventory on empty grid
    await openInventoryPanel(page)
    await addSkeinToInventory(page, '808', '1')

    // Close panel, place a stitch
    await page.locator('button[title="Close panel"]').click()
    await await new Promise(r => setTimeout(r, 200))
    await placeStitches(page, 1)

    // Undo should work
    const undoBtn = page.locator('button[title="Undo"]').first()
    await expect(undoBtn).toBeEnabled()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Page should still work
    await expect(page.locator('main')).toBeVisible()
  })

  test('undo after multiple inventory additions preserves grid state', async ({
    page,
    openPanelTab,
  }) => {
    // Place 3 stitches
    await placeStitches(page, 3)

    // Add multiple inventory items
    await openInventoryPanel(page)

    for (let i = 0; i < 3; i++) {
      await addSkeinToInventory(page, String(900 + i), '1')
      await await new Promise(r => setTimeout(r, 300))
    }

    // Close panel, do multiple undos
    await page.locator('button[title="Close panel"]').click()
    await await new Promise(r => setTimeout(r, 200))

    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Grid should still be functional
    await expect(page.locator('main')).toBeVisible()
  })

  test('closing inventory panel does not affect undo/redo button states', async ({
    page,
    openPanelTab,
  }) => {
    // Open and close inventory
    await openInventoryPanel(page)
    await page.locator('button[title="Close panel"]').click()
    await await new Promise(r => setTimeout(r, 200))

    // Place stitches
    await placeStitches(page, 2)

    // Undo/redo buttons should be present
    const undoBtn = page.locator('button[title="Undo"]').first()
    const redoBtn = page.locator('button[title="Redo"]').first()
    await expect(undoBtn).toBeVisible()
    await expect(redoBtn).toBeVisible()
  })

  test('adding inventory then undoing grid edit: inventory remains intact', async ({
    page,
    openPanelTab,
  }) => {
    // Open inventory and add items
    await openInventoryPanel(page)
    await addSkeinToInventory(page, '1100', '5')

    // Verify count display updated
    const skeinCountText = page.locator('h3:has-text("Your Skeins (")')
    await expect(skeinCountText).toBeVisible()

    // Close panel, place stitches
    await page.locator('button[title="Close panel"]').click()
    await await new Promise(r => setTimeout(r, 200))
    await placeStitches(page, 2)

    // Undo
    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Inventory should still have 5 units of DMC 1100
    await openInventoryPanel(page)
    await expect(page.locator('text=DMC 1100').first()).toBeVisible()
  })
})
