import { json } from '@sveltejs/kit';
import { findUserByAdmissionNumber } from '$lib/api/snipeit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const admission = url.searchParams.get('admission')?.trim();
  if (!admission || !/^\d+$/.test(admission)) {
    return json({ error: 'Invalid admission number' }, { status: 400 });
  }

  try {
    const user = await findUserByAdmissionNumber(admission);
    if (!user) return json({ error: 'Student not found' }, { status: 404 });
    return json({ id: user.id, name: user.name, admissionNumber: user.employee_num });
  } catch (e) {
    console.error(e);
    return json({ error: 'Could not reach asset system' }, { status: 502 });
  }
};
