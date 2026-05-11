import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';

const BRIDGE_DIR = '/tmp/boodlooking';
const POLL_INTERVAL_MS = 600;
const TIMEOUT_MS = 28000;

export async function POST(req: NextRequest) {
  try {
    const params = await req.json();
    const requestId = randomUUID();

    mkdirSync(BRIDGE_DIR, { recursive: true });

    const requestFile = path.join(BRIDGE_DIR, `request-${requestId}.json`);
    const resultFile = path.join(BRIDGE_DIR, `result-${requestId}.json`);

    writeFileSync(
      requestFile,
      JSON.stringify({ id: requestId, params, timestamp: Date.now() }),
      'utf-8'
    );

    // Long-poll for result
    const deadline = Date.now() + TIMEOUT_MS;
    while (Date.now() < deadline) {
      await sleep(POLL_INTERVAL_MS);
      if (existsSync(resultFile)) {
        const raw = readFileSync(resultFile, 'utf-8');
        try { unlinkSync(requestFile); } catch {}
        try { unlinkSync(resultFile); } catch {}
        return NextResponse.json(JSON.parse(raw));
      }
    }

    // Timeout — clean up and signal fallback
    try { unlinkSync(requestFile); } catch {}
    return NextResponse.json(
      { error: 'timeout', requestId },
      { status: 408 }
    );
  } catch (err) {
    console.error('[/api/search]', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
