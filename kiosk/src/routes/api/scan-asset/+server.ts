import { json } from '@sveltejs/kit';
import { findAssetByTag, checkoutAsset, checkinAsset } from '$lib/api/snipeit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { assetTag, userId } = body as { assetTag: string; userId: number };

  if (!assetTag || !userId) {
    return json({ error: 'Missing assetTag or userId' }, { status: 400 });
  }

  try {
    const asset = await findAssetByTag(assetTag.trim());

    if (!asset) {
      return json({ action: 'not_found', assetTag }, { status: 200 });
    }

    // Deployable statuses in Snipe-IT use status_meta = 'deployable'
    const meta = asset.status_label?.status_meta;

    // If assigned to someone else, block
    if (asset.assigned_to && asset.assigned_to.type === 'user' && asset.assigned_to.id !== userId) {
      return json({
        action: 'other_user',
        assetId: asset.id,
        assetTag: asset.asset_tag,
        name: asset.name,
        category: asset.category?.name ?? 'Item',
        assignedTo: asset.assigned_to.name,
      });
    }

    // If assigned to this user → check in
    if (asset.assigned_to && asset.assigned_to.type === 'user' && asset.assigned_to.id === userId) {
      await checkinAsset(asset.id);
      return json({
        action: 'checked_in',
        assetId: asset.id,
        assetTag: asset.asset_tag,
        name: asset.name,
        category: asset.category?.name ?? 'Item',
      });
    }

    // Not assigned — check it's deployable
    if (meta !== 'deployable') {
      return json({
        action: 'unavailable',
        assetId: asset.id,
        assetTag: asset.asset_tag,
        name: asset.name,
        category: asset.category?.name ?? 'Item',
      });
    }

    // Check out to this user
    await checkoutAsset(asset.id, userId);
    return json({
      action: 'checked_out',
      assetId: asset.id,
      assetTag: asset.asset_tag,
      name: asset.name,
      category: asset.category?.name ?? 'Item',
    });

  } catch (e) {
    console.error(e);
    return json({ error: 'Could not reach asset system' }, { status: 502 });
  }
};
