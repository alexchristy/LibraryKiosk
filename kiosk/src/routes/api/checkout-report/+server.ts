import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllCheckedOutAssets, getAllUsers } from '$lib/api/snipeit';

export const GET: RequestHandler = async () => {
  const [assets, users] = await Promise.all([getAllCheckedOutAssets(), getAllUsers()]);

  const usernameById = new Map(users.map(u => [u.id, u.username]));

  // Group by category → student
  const categoryMap = new Map<string, Map<number, {
    name: string;
    username: string;
    items: { model: string; assetTag: string }[];
  }>>();

  for (const asset of assets) {
    const category = asset.category?.name ?? 'Uncategorized';
    const userId   = asset.assigned_to!.id;
    const userName = asset.assigned_to!.name;
    const username = usernameById.get(userId) ?? '';
    const model    = asset.model?.name || asset.name || asset.asset_tag;

    if (!categoryMap.has(category)) categoryMap.set(category, new Map());
    const studentMap = categoryMap.get(category)!;

    if (!studentMap.has(userId)) studentMap.set(userId, { name: userName, username, items: [] });
    studentMap.get(userId)!.items.push({ model, assetTag: asset.asset_tag });
  }

  const categories = Array.from(categoryMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, studentMap]) => ({
      name,
      students: Array.from(studentMap.values())
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));

  return json({ categories });
};
