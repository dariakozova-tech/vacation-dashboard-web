import { db } from '@/lib/db';
import { employees } from '@/lib/db/schema';

export async function GET() {
  try {
    await db.select().from(employees).limit(1);
    return Response.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    return Response.json(
      { status: 'error', message: String(err) },
      { status: 500 },
    );
  }
}
