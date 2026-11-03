import { test, expect } from '@playwright/test';

test('player gender persists in drafts and cast exports, including imported custom pronouns', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Names, one per line', { exact: true }).fill('Skizzo\nAdur');
  await page.getByRole('button', { name: 'Add to cast', exact: true }).click();
  const edit = () => page.getByRole('button', { name: 'Edit Skizzo, cast entry 1', exact: true }).click();
  const gender = () => page.getByLabel('Gender', { exact: true });
  const done = () => page.getByRole('button', { name: 'Done', exact: true }).click();
  const exported = async () => {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export cast', exact: true }).click();
    const stream = await (await pending).createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    return JSON.parse(Buffer.concat(chunks).toString()).cast;
  };
  await edit();
  await expect(gender()).toHaveValue('unspecified');
  await gender().selectOption('male');
  await done();
  await expect(page.getByText('Draft saved', { exact: true })).toBeVisible();
  await page.reload();
  await edit();
  await expect(gender()).toHaveValue('male');
  await done();
  const cast = await exported();
  expect(cast.players[0].pronouns).toEqual({ subject: 'he', object: 'him', possessive: 'his' });
  await edit();
  await gender().selectOption('female');
  await done();
  expect((await exported()).players[0].pronouns).toEqual({ subject: 'she', object: 'her', possessive: 'her' });
  await edit();
  await gender().selectOption('unspecified');
  await done();
  expect((await exported()).players[0].pronouns).toBeUndefined();

  cast.players[0].pronouns = { subject: 'xe', object: 'xem', possessive: 'xyr' };
  await page.locator('input[type=file]').first().setInputFiles({ name: 'cast.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(cast)) });
  await edit();
  await expect(gender()).toHaveValue('custom');
  await done();
  expect((await exported()).players[0].pronouns).toEqual(cast.players[0].pronouns);
});
