// Server-side only — never imported from client components directly.
// All calls go through +server.ts route handlers.

const BASE = process.env.SNIPEIT_BASE_URL ?? 'http://snipeit:80';
const TOKEN = process.env.SNIPEIT_API_TOKEN ?? '';

function headers() {
  return {
    'Authorization': `Bearer ${TOKEN}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
}

async function get(path: string) {
  const res = await fetch(`${BASE}/api/v1${path}`, { headers: headers() });
  if (!res.ok) throw new Error(`Snipe-IT GET ${path} → ${res.status}`);
  return res.json();
}

async function post(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Snipe-IT POST ${path} → ${res.status}`);
  return res.json();
}

export interface SnipeUser {
  id: number;
  name: string;
  username: string;
  employee_num: string;
}

export interface SnipeAsset {
  id: number;
  name: string;
  asset_tag: string;
  serial: string | null;
  model: { id: number; name: string } | null;
  status_label: { id: number; name: string; status_type: string; status_meta: string };
  assigned_to: { id: number; name: string; type: string } | null;
  category: { id: number; name: string } | null;
}

export async function findUserByAdmissionNumber(admissionNumber: string): Promise<SnipeUser | null> {
  const data = await get(`/users?search=${encodeURIComponent(admissionNumber)}&limit=50`);
  const users: SnipeUser[] = data.rows ?? [];
  // Exact match on username (admission numbers are stored as Snipe-IT usernames)
  const match = users.find(u => u.username === admissionNumber);
  return match ?? null;
}

export async function findAssetByTag(tag: string): Promise<SnipeAsset | null> {
  const data = await get(`/hardware?asset_tag=${encodeURIComponent(tag)}&limit=1`);
  const rows: SnipeAsset[] = data.rows ?? [];
  return rows[0] ?? null;
}

export async function checkoutAsset(assetId: number, userId: number): Promise<{ status: string; messages?: string }> {
  return post(`/hardware/${assetId}/checkout`, {
    checkout_to_type: 'user',
    assigned_user: userId,
    checkout_at: new Date().toISOString().split('T')[0],
  });
}

export async function checkinAsset(assetId: number): Promise<{ status: string; messages?: string }> {
  return post(`/hardware/${assetId}/checkin`, {
    checkin_at: new Date().toISOString().split('T')[0],
  });
}

export async function getUserAssets(userId: number): Promise<SnipeAsset[]> {
  const data = await get(`/hardware?assigned_to=${userId}&limit=500`);
  return data.rows ?? [];
}

export async function getAllCheckedOutAssets(): Promise<SnipeAsset[]> {
  const data = await get('/hardware?limit=1000');
  const all: SnipeAsset[] = data.rows ?? [];
  return all.filter(a => a.assigned_to?.type === 'user');
}

export async function getAllUsers(): Promise<SnipeUser[]> {
  const data = await get('/users?limit=1000');
  return data.rows ?? [];
}

export interface SnipeConsumable {
  id: number;
  name: string;
  qty: number;
  remaining: number;
  category: { id: number; name: string } | null;
  model_number: string | null;
  item_no: string | null;
}

export async function getConsumableById(id: number): Promise<SnipeConsumable | null> {
  try {
    const data = await get(`/consumables/${id}`);
    if (!data || data.status === 'error') return null;
    return data as SnipeConsumable;
  } catch {
    return null;
  }
}

export async function checkoutConsumable(
  consumableId: number,
  userId: number,
  qty: number = 1,
): Promise<{ status: string; messages?: string }> {
  return post(`/consumables/${consumableId}/checkout`, {
    assigned_to: userId,
    checkout_qty: qty,
  });
}
