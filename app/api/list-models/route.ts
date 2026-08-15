import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return Response.json({ error: 'GOOGLE_API_KEY not set' }, { status: 500 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // List available models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    const data = await response.json();

    // Filter to show only models that support generateContent
    const contentModels = data.models?.filter((m: any) =>
      m.supportedGenerationMethods?.includes('generateContent')
    ).map((m: any) => ({
      name: m.name,
      displayName: m.displayName,
      methods: m.supportedGenerationMethods
    }));

    return Response.json({
      models: contentModels || [],
      raw: data
    });
  } catch (error) {
    console.error('Error listing models:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
