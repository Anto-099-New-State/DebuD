import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGitHubRepos } from '@/lib/github/client';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const repos = await getGitHubRepos(session.accessToken);
    return Response.json(repos);
  } catch (error) {
    console.error('API error:', error);
    return Response.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}
