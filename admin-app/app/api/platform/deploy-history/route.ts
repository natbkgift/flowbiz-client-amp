import { NextResponse } from 'next/server';

import {
  getDeployHistoryDir,
  parseHistoryLimit,
  readDeployHistory,
} from '@/app/api/platform/_lib/deploy-telemetry';

export async function GET(request: Request) {
  const limit = parseHistoryLimit(new URL(request.url).searchParams.get('limit'));
  const history = await readDeployHistory(limit);

  return NextResponse.json(
    {
      ok: true,
      limit,
      count: history.length,
      history_dir: getDeployHistoryDir(),
      items: history,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
