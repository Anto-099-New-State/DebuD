import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getRepoFileContent, getRepoTree } from '@/lib/github/client';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const path = searchParams.get('path');

  if (!owner || !repo) {
    return Response.json({ error: 'Missing owner or repo' }, { status: 400 });
  }

  try {
    if (path) {
      const content = await getRepoFileContent(session.accessToken, owner, repo, path);
      return Response.json({ content });
    } else {
      const files = await getRepoTree(session.accessToken, owner, repo);
      return Response.json({ files });
    }
  } catch (error) {
    console.error('API error:', error);
    return Response.json(
      { error: 'Failed to fetch contents' },
      { status: 500 }
    );
  }
}
