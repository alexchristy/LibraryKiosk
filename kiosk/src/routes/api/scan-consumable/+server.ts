import { json } from '@sveltejs/kit';
import { getConsumableById, checkoutConsumable } from '$lib/api/snipeit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { consumableId, userId } = body as { consumableId: number; userId: number };

  if (!consumableId || !userId) {
    return json({ error: 'Missing consumableId or userId' }, { status: 400 });
  }

  try {
    const consumable = await getConsumableById(consumableId);

    if (!consumable) {
      return json({
        action: 'not_found',
        assetTag: `CONSUME-${consumableId}`,
      });
    }

    // Check stock
    if (consumable.remaining <= 0) {
      return json({
        action: 'unavailable',
        assetId: consumable.id,
        assetTag: `CONSUME-${consumableId}`,
        name: consumable.name,
        category: consumable.category?.name ?? 'Consumable',
      });
    }

    // Check out 1 unit to the user
    await checkoutConsumable(consumable.id, userId, 1);

    return json({
      action: 'consumed',
      assetId: consumable.id,
      assetTag: `CONSUME-${consumableId}`,
      name: consumable.name,
      category: consumable.category?.name ?? 'Consumable',
      remaining: consumable.remaining - 1,
    });

  } catch (e) {
    console.error(e);
    return json({ error: 'Could not reach asset system' }, { status: 502 });
  }
};
