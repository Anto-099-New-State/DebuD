import { Octokit } from 'octokit';

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  url: string;
  default_branch: string;
  language: string | null;
  stars: number;
  updated_at: string | null;
}

export async function getGitHubRepos(accessToken: string): Promise<Repository[]> {
  const octokit = new Octokit({ auth: accessToken });

  try {
    const repos = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 50,
      sort: 'updated',
      direction: 'desc',
    });

    return repos.data.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      default_branch: repo.default_branch,
      language: repo.language,
      stars: repo.stargazers_count,
      updated_at: repo.updated_at,
    }));
  } catch (error) {
    console.error('Failed to fetch repos:', error);
    return [];
  }
}

export async function getRepoFileContent(
  accessToken: string,
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  const octokit = new Octokit({ auth: accessToken });

  try {
    const file = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    });

    if (Array.isArray(file.data)) {
      return null;
    }

    if ('content' in file.data) {
      return Buffer.from(file.data.content, 'base64').toString('utf-8');
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch file:', error);
    return null;
  }
}

export async function getRepoTree(
  accessToken: string,
  owner: string,
  repo: string
): Promise<string[]> {
  const octokit = new Octokit({ auth: accessToken });

  try {
    const tree = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: 'HEAD',
      recursive: 'true',
    });

    // Filter for frontend component files only
    const frontendFiles = tree.data.tree
      .filter(item => {
        const path = item.path || '';

        // Only .tsx and .jsx files (React components)
        if (!path.endsWith('.tsx') && !path.endsWith('.jsx')) {
          return false;
        }

        // Exclude backend/config files
        const excludePatterns = [
          'node_modules',
          '.next',
          '/api/',           // API routes
          '/lib/',           // Library code
          '/utils/',         // Utility functions
          '/types/',         // Type definitions
          '/hooks/',         // Custom hooks (usually logic, not UI)
          'route.ts',        // Next.js API routes
          'layout.tsx',      // Layouts (usually minimal styling)
          'loading.tsx',     // Loading states
          'error.tsx',       // Error boundaries
          'not-found.tsx',   // 404 pages
          '.config.',        // Config files
          '.d.ts',           // Type declaration files
        ];

        for (const pattern of excludePatterns) {
          if (path.includes(pattern)) {
            return false;
          }
        }

        return true;
      })
      .map(item => item.path!);

    // Prioritize component files
    const prioritized = frontendFiles.sort((a, b) => {
      // Prioritize files in components/ folder
      const aIsComponent = a.includes('/components/') || a.includes('Components');
      const bIsComponent = b.includes('/components/') || b.includes('Components');
      if (aIsComponent && !bIsComponent) return -1;
      if (!aIsComponent && bIsComponent) return 1;

      // Then page files
      const aIsPage = a.includes('page.tsx') || a.includes('Page');
      const bIsPage = b.includes('page.tsx') || b.includes('Page');
      if (aIsPage && !bIsPage) return -1;
      if (!aIsPage && bIsPage) return 1;

      return 0;
    });

    return prioritized.slice(0, 20);
  } catch (error) {
    console.error('Failed to fetch tree:', error);
    return [];
  }
}
