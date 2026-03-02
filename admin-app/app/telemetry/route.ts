import { NextRequest, NextResponse } from 'next/server';

function methodNotAllowed() {
  return NextResponse.json({ detail: 'Method not allowed' }, { status: 405 });
}

export async function POST(req: NextRequest) {
  try {
    await req.json();
  } catch {
    // best-effort sink; ignore malformed payloads
  }

  return NextResponse.json(
    { ok: true, endpoint: '/telemetry' },
    { status: 202 },
  );
}

export async function GET() {
  return methodNotAllowed();
}

export async function PUT() {
  return methodNotAllowed();
}

export async function PATCH() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}
