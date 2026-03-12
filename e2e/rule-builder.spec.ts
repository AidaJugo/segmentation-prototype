import { test, expect, Page } from '@playwright/test'

async function createGroupAndSegment(page: Page, groupName = 'Loan Portfolio', segmentName = 'Fixed Rate Loans') {
  await page.getByRole('button', { name: 'New Segment Group' }).click()
  const groupInput = page.getByPlaceholder('Group name...')
  await groupInput.fill(groupName)
  await groupInput.press('Enter')

  const tree = page.locator('.border-r').first()
  await tree.getByRole('button', { name: 'Add Segment' }).click()
  const nameInput = tree.getByPlaceholder('Segment name...')
  await nameInput.fill(segmentName)
  await nameInput.press('Enter')
}

async function selectDimensionsAndClose(page: Page) {
  const charSection = page.getByText('Characteristics').first()
  await expect(charSection).toBeVisible()
  await charSection.click()

  const checkboxes = page.locator('input[type="checkbox"]:not(:disabled)')
  const count = await checkboxes.count()
  for (let i = 0; i < Math.min(5, count); i++) {
    if (!(await checkboxes.nth(i).isChecked())) {
      await checkboxes.nth(i).check()
    }
  }
  await page.getByRole('button', { name: 'Done' }).click()
}

test.describe('Prototype Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows empty state with no groups', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'New Segment Group' })).toBeVisible()
    await expect(page.getByText('Start by creating a segment group')).toBeVisible()
  })

  test('creates a segment group and shows it', async ({ page }) => {
    await page.getByRole('button', { name: 'New Segment Group' }).click()
    const groupInput = page.getByPlaceholder('Group name...')
    await groupInput.fill('Loan Portfolio')
    await groupInput.press('Enter')

    await expect(page.getByText('Loan Portfolio', { exact: true })).toBeVisible()
    await expect(page.getByText('No segments yet')).toBeVisible()
  })

  test('adds a segment to a group', async ({ page }) => {
    await createGroupAndSegment(page)
    await expect(page.getByText('Fixed Rate Loans', { exact: true })).toBeVisible()
  })

  test('shows dimension selector on first leaf click (no dimensions configured)', async ({ page }) => {
    await createGroupAndSegment(page)
    await page.getByText('Fixed Rate Loans', { exact: true }).click()
    await expect(page.getByText('Configure Dimensions')).toBeVisible()
    await expect(page.getByText('Before defining rules, select which dimensions')).toBeVisible()
  })

  test('shows rule builder after configuring dimensions', async ({ page }) => {
    await createGroupAndSegment(page)
    await page.getByText('Fixed Rate Loans', { exact: true }).click()
    await selectDimensionsAndClose(page)

    await expect(page.getByText(/dims/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Condition' })).toBeVisible()
  })

  test('no legend bar visible', async ({ page }) => {
    await expect(page.getByText('Updated Segment')).not.toBeVisible()
    await expect(page.getByText('Production Use')).not.toBeVisible()
  })

  test('shows parent node message when clicking a non-leaf', async ({ page }) => {
    await createGroupAndSegment(page)
    const tree = page.locator('.border-r').first()
    await tree.getByText('Fixed Rate Loans', { exact: true }).click()
    await selectDimensionsAndClose(page)

    const plusButtons = tree.getByTitle('Add child segment')
    await plusButtons.first().click()
    const nameInput = tree.getByPlaceholder('Segment name...')
    await nameInput.fill('Sub Segment')
    await nameInput.press('Enter')

    await tree.getByText('Fixed Rate Loans', { exact: true }).click()
    await expect(page.getByText('This is a group node')).toBeVisible()
  })

  test('adds a condition and shows summary', async ({ page }) => {
    await createGroupAndSegment(page)
    await page.getByText('Fixed Rate Loans', { exact: true }).click()
    await selectDimensionsAndClose(page)

    await page.getByRole('button', { name: 'Add Condition' }).click()
    await expect(page.getByRole('combobox').first()).toBeVisible()

    await page.getByText('Select values...').click()
    const firstCheckbox = page.locator('.absolute .max-h-\\[180px\\] label').first()
    await firstCheckbox.click()

    await expect(page.getByText('Groups are connected by OR')).toBeVisible()

    await page.getByRole('button', { name: 'Save Rules' }).click()
    await expect(page.getByText('This segment:').first()).toBeVisible()
  })

  test('exception section has description text', async ({ page }) => {
    await createGroupAndSegment(page)
    await page.getByText('Fixed Rate Loans', { exact: true }).click()
    await selectDimensionsAndClose(page)

    await expect(page.getByText('Exclude specific instruments from the matched set above')).toBeVisible()
  })

  test('Save Rules button appears when conditions have values', async ({ page }) => {
    await createGroupAndSegment(page)
    await page.getByText('Fixed Rate Loans', { exact: true }).click()
    await selectDimensionsAndClose(page)

    await expect(page.getByRole('button', { name: 'Save Rules' })).not.toBeVisible()

    await page.getByRole('button', { name: 'Add Condition' }).click()
    await page.getByText('Select values...').click()
    const firstCheckbox = page.locator('.absolute .max-h-\\[180px\\] label').first()
    await firstCheckbox.click()

    await expect(page.getByRole('button', { name: 'Save Rules' })).toBeVisible()
  })

  test('can delete a segment group', async ({ page }) => {
    page.on('dialog', dialog => dialog.accept())
    await createGroupAndSegment(page)

    const groupRow = page.locator('.group\\/grp').first()
    await groupRow.hover()
    await page.getByTitle('Delete group').first().click()

    await expect(page.getByText('Loan Portfolio', { exact: true })).not.toBeVisible()
    await expect(page.getByText('Start by creating a segment group')).toBeVisible()
  })

  test('new segment starts in edit mode', async ({ page }) => {
    await page.getByRole('button', { name: 'New Segment Group' }).click()
    const groupInput = page.getByPlaceholder('Group name...')
    await groupInput.fill('Test Group')
    await groupInput.press('Enter')

    const tree = page.locator('.border-r').first()
    await tree.getByRole('button', { name: 'Add Segment' }).click()

    const nameInput = tree.getByPlaceholder('Segment name...')
    await expect(nameInput).toBeVisible()
    await expect(nameInput).toBeFocused()
  })

  test('group coverage visible after saving rules', async ({ page }) => {
    await createGroupAndSegment(page)
    await page.getByText('Fixed Rate Loans', { exact: true }).click()
    await selectDimensionsAndClose(page)

    await page.getByRole('button', { name: 'Add Condition' }).click()
    await page.getByText('Select values...').click()
    const firstCheckbox = page.locator('.absolute .max-h-\\[180px\\] label').first()
    await firstCheckbox.click()

    await page.getByRole('button', { name: 'Save Rules' }).click()
    await expect(page.getByText('This segment:').first()).toBeVisible()

    await page.getByText('Loan Portfolio', { exact: true }).click()
    await expect(page.getByRole('tab', { name: 'Coverage' })).toBeVisible()
    await expect(page.getByText('Portfolio Coverage').first()).toBeVisible()
    await expect(page.getByText(/1,000 instruments/i).first()).toBeVisible()
  })

  test('group mnemonic is editable', async ({ page }) => {
    await page.getByRole('button', { name: 'New Segment Group' }).click()
    const groupInput = page.getByPlaceholder('Group name...')
    await groupInput.fill('Loan Portfolio')
    await groupInput.press('Enter')

    const badge = page.getByText('LOANPORTFOL', { exact: false }).first()
    await expect(badge).toBeVisible()
    await badge.click()

    const mnemonicInput = page.locator('input[maxlength="12"]')
    await expect(mnemonicInput).toBeVisible()
    await mnemonicInput.clear()
    await mnemonicInput.fill('LOANS')
    await mnemonicInput.press('Enter')

    await expect(page.getByText('LOANS')).toBeVisible()
  })

  test('dims badge shows on group header after configuration', async ({ page }) => {
    await createGroupAndSegment(page)
    await page.getByText('Fixed Rate Loans', { exact: true }).click()
    await selectDimensionsAndClose(page)

    await expect(page.getByText(/dims/)).toBeVisible()
  })
})

test.describe('Dimension Selector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('opens via first leaf click on unconfigured group', async ({ page }) => {
    await createGroupAndSegment(page)
    await page.getByText('Fixed Rate Loans', { exact: true }).click()
    await expect(page.getByText('Configure Dimensions')).toBeVisible()
    await expect(page.getByText('Characteristics')).toBeVisible()
  })

  test('shows dimension categories', async ({ page }) => {
    await createGroupAndSegment(page)
    await page.getByText('Fixed Rate Loans', { exact: true }).click()
    await expect(page.getByText('Characteristics')).toBeVisible()
    await expect(page.getByText('Measures (Numeric)')).toBeVisible()
    await expect(page.getByText('Flags')).toBeVisible()
  })

  test('identifiers are not selectable', async ({ page }) => {
    await createGroupAndSegment(page)
    await page.getByText('Fixed Rate Loans', { exact: true }).click()
    const identifiers = page.getByText('Identifiers')
    await identifiers.click()
    const instrumentId = page.getByText('Instrument ID')
    await expect(instrumentId).toBeVisible()
    await expect(page.getByText('not segmentable').first()).toBeVisible()
  })

  test('search filters dimensions', async ({ page }) => {
    await createGroupAndSegment(page)
    await page.getByText('Fixed Rate Loans', { exact: true }).click()
    await page.getByPlaceholder('Search dimensions...').fill('risk')
    await expect(page.getByText('Risk Rating', { exact: true })).toBeVisible()
    await expect(page.getByText('Risk Rating Code', { exact: true })).toBeVisible()
  })

  test('Done button closes selector and shows rule builder', async ({ page }) => {
    await createGroupAndSegment(page)
    await page.getByText('Fixed Rate Loans', { exact: true }).click()

    await page.getByText('Characteristics').first().click()
    const checkboxes = page.locator('input[type="checkbox"]:not(:disabled)')
    await checkboxes.first().check()

    await page.getByRole('button', { name: 'Done' }).click()
    await expect(page.getByText('Configure Dimensions')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Condition' })).toBeVisible()
  })

  test('reopens via dims badge in tree after initial config', async ({ page }) => {
    await createGroupAndSegment(page)
    await page.getByText('Fixed Rate Loans', { exact: true }).click()
    await selectDimensionsAndClose(page)

    await page.getByText(/dims/).first().click()
    await expect(page.getByText('Configure Dimensions')).toBeVisible()
  })

  test('multiple dimension selections all persist', async ({ page }) => {
    await createGroupAndSegment(page)
    await page.getByText('Fixed Rate Loans', { exact: true }).click()

    await page.getByText('Characteristics').first().click()
    const checkboxes = page.locator('input[type="checkbox"]:not(:disabled)')
    const toCheck = Math.min(5, await checkboxes.count())
    for (let i = 0; i < toCheck; i++) {
      await checkboxes.nth(i).check()
    }

    for (let i = 0; i < toCheck; i++) {
      await expect(checkboxes.nth(i)).toBeChecked()
    }

    await page.getByRole('button', { name: 'Done' }).click()
    const dimBadge = page.getByText(/dims/).first()
    await expect(dimBadge).toContainText(`${toCheck}`)
  })

  test('selected dimensions appear in rule builder condition dropdown', async ({ page }) => {
    await createGroupAndSegment(page)
    await page.getByText('Fixed Rate Loans', { exact: true }).click()

    await page.getByText('Characteristics').first().click()
    const firstDimLabel = await page.locator('input[type="checkbox"]:not(:disabled)').first().locator('..').locator('.text-sm.text-surface-700').textContent()
    await page.locator('input[type="checkbox"]:not(:disabled)').first().check()
    await page.getByRole('button', { name: 'Done' }).click()

    await page.getByRole('button', { name: 'Add Condition' }).click()
    const dropdown = page.getByRole('combobox').first()
    await expect(dropdown).toBeVisible()

    const options = dropdown.locator('option')
    const texts: string[] = []
    for (let i = 0; i < await options.count(); i++) {
      texts.push(await options.nth(i).textContent() ?? '')
    }
    expect(texts.some(t => t === firstDimLabel)).toBe(true)
  })
})

test.describe('Matched Instruments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows matched instruments section after saving rules', async ({ page }) => {
    await createGroupAndSegment(page)
    await page.getByText('Fixed Rate Loans', { exact: true }).click()
    await selectDimensionsAndClose(page)

    await expect(page.getByText('Matched Instruments')).not.toBeVisible()

    await page.getByRole('button', { name: 'Add Condition' }).click()
    await page.getByText('Select values...').click()
    const firstCheckbox = page.locator('.absolute .max-h-\\[180px\\] label').first()
    await firstCheckbox.click()

    await expect(page.getByText('Matched Instruments')).not.toBeVisible()

    await page.getByRole('button', { name: 'Save Rules' }).click()
    await expect(page.getByText('Matched Instruments')).toBeVisible()
  })

  test('instruments tab shows table after saving', async ({ page }) => {
    await createGroupAndSegment(page)
    await page.getByText('Fixed Rate Loans', { exact: true }).click()
    await selectDimensionsAndClose(page)

    await page.getByRole('button', { name: 'Add Condition' }).click()
    await page.getByText('Select values...').click()
    const firstCheckbox = page.locator('.absolute .max-h-\\[180px\\] label').first()
    await firstCheckbox.click()

    await page.getByRole('button', { name: 'Save Rules' }).click()

    await expect(page.getByRole('tab', { name: 'Instruments' })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Rules/ })).toBeVisible()
    await expect(page.getByPlaceholder('Search matched instruments...')).toBeVisible()
    await expect(page.getByText('Balance')).toBeVisible()
  })
})
