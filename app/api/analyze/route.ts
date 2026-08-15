import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getRepoFileContent } from '@/lib/github/client';
import { analyzeComponentWithGemini, ComponentAnalysis } from '@/lib/gemini/analyzer';

// Helper to delay between API calls (rate limiting)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { owner, repo, files, designStyle } = body;

    if (!owner || !repo || !files || !Array.isArray(files)) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const validStyle = ['modern', 'minimal', 'premium'].includes(designStyle)
      ? designStyle
      : 'modern';

    const results: ComponentAnalysis[] = [];

    // Analyze only 4 files to stay within free tier rate limit (5/min)
    const filesToAnalyze = files.slice(0, 4);

    for (let i = 0; i < filesToAnalyze.length; i++) {
      const filePath = filesToAnalyze[i];

      try {
        // Get file content from GitHub
        const content = await getRepoFileContent(
          session.accessToken,
          owner,
          repo,
          filePath
        );

        if (!content) {
          continue;
        }

        // Extract component name from file path
        const componentName = filePath
          .split('/')
          .pop()
          ?.replace(/\.(tsx|ts|jsx|js)$/, '') || 'Component';

        // Skip files without JSX (not real React components)
        if (!content.includes('return') || (!content.includes('<') && !content.includes('className'))) {
          continue;
        }

        // Skip very small files (likely just exports)
        if (content.length < 200) {
          continue;
        }

        console.log(`Analyzing: ${filePath}`);

        // Analyze with Gemini
        const analysis = await analyzeComponentWithGemini(
          content,
          componentName,
          filePath,
          validStyle
        );

        // Only include if there are actual suggestions
        if (
          analysis.issues.length > 0 ||
          analysis.tailwindSuggestions.length > 0
        ) {
          results.push(analysis);
        }

        // Rate limit: wait 15 seconds between requests to stay under 5/min
        if (i < filesToAnalyze.length - 1) {
          console.log('Waiting 15s for rate limit...');
          await delay(15000);
        }
      } catch (err) {
        console.error(`Error analyzing ${filePath}:`, err);
        // Continue to next file on error
      }
    }

    return Response.json({ results });
  } catch (error) {
    console.error('Analysis error:', error);
    return Response.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
