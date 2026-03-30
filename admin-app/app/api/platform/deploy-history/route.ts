import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  void request;
  return NextResponse.json(
    { detail: 'Not Found' },
    {
      status: 404,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
