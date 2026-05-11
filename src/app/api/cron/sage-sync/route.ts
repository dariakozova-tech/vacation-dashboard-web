import { NextResponse } from 'next/server';
import { importSageRecords } from '@/lib/sage-hr/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await importSageRecords({ daysBack: 90 });

    console.log(`Cron sage-sync: ${result.added} added, ${result.updated} updated`);

    return NextResponse.json({
      success: true,
      added: result.added,
      updated: result.updated,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron sage-sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
