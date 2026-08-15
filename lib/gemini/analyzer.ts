import { getGeminiModel } from './client';

export interface TailwindSuggestion {
  old: string;
  new: string;
  reason: string;
}

export interface ComponentAnalysis {
  name: string;
  path: string;
  issues: string[];
  suggestions: string[];
  tailwindSuggestions: TailwindSuggestion[];
  originalCode: string;
  suggestedCode: string;
}

const styleGuidance = {
  modern:
    'Clean, minimalist aesthetic with good contrast. Use subtle shadows (shadow-sm, shadow-md), proper spacing (space-4, space-6), rounded corners (rounded-lg), and a professional color palette.',
  minimal:
    'Maximum simplicity. Remove unnecessary elements. Focus on white space, clean typography, minimal borders, and restrained use of color.',
  premium:
    'Elegant and sophisticated. Subtle shadows (shadow-lg), refined typography (tracking-tight, font-medium), premium feel with gradients and glass effects where appropriate.',
};

// Apply tailwind suggestions to generate the suggested code
function applySuggestions(
  originalCode: string,
  suggestions: TailwindSuggestion[]
): string {
  let modifiedCode = originalCode;

  for (const suggestion of suggestions) {
    // Extract just the className value from old/new
    const oldClass = suggestion.old;
    const newClass = suggestion.new;

    // Try to replace the old className with new
    if (modifiedCode.includes(oldClass)) {
      modifiedCode = modifiedCode.replace(oldClass, newClass);
    }
  }

  return modifiedCode;
}

export async function analyzeComponentWithGemini(
  componentCode: string,
  componentName: string,
  filePath: string,
  designStyle: 'modern' | 'minimal' | 'premium'
): Promise<ComponentAnalysis> {
  const model = getGeminiModel();

  // Simplified prompt - don't ask for suggestedCode (we'll generate it ourselves)
  const prompt = `Analyze this React component and suggest Tailwind CSS improvements for a "${designStyle}" design style.

Component: ${componentName}
File: ${filePath}

\`\`\`jsx
${componentCode}
\`\`\`

Design Style Guidelines: ${styleGuidance[designStyle]}

Provide response ONLY as valid JSON (no markdown, no code fences):
{
  "issues": ["description of design issue 1", "description of design issue 2"],
  "suggestions": ["general suggestion 1"],
  "tailwindSuggestions": [
    {
      "old": "className=\\"exact-old-classes\\"",
      "new": "className=\\"improved-new-classes\\"",
      "reason": "Why this change improves the design"
    }
  ]
}

Focus on:
- Spacing consistency (use Tailwind's 4px scale: p-1, p-2, p-4, p-6, p-8)
- Typography scale and hierarchy
- Color harmony and contrast
- Border radius consistency (rounded-sm, rounded-md, rounded-lg)
- Shadow usage (shadow-sm, shadow-md, shadow-lg)
- Responsive design patterns

CRITICAL RULES:
1. The "old" field MUST be an EXACT match of text from the component code
2. Include the full className="..." attribute in old/new fields
3. Make ONLY style changes, never change logic or functionality
4. If no improvements needed, return empty arrays
5. Keep it to max 5-8 most impactful suggestions
6. Return ONLY valid JSON, no extra text`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Clean up response - remove any markdown code fences
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.slice(7);
    }
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.slice(3);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.slice(0, -3);
    }
    cleanText = cleanText.trim();

    const json = JSON.parse(cleanText);

    const tailwindSuggestions = json.tailwindSuggestions || [];

    // Generate suggestedCode by applying the suggestions
    const suggestedCode = applySuggestions(componentCode, tailwindSuggestions);

    return {
      name: componentName,
      path: filePath,
      issues: json.issues || [],
      suggestions: json.suggestions || [],
      tailwindSuggestions,
      originalCode: componentCode,
      suggestedCode,
    };
  } catch (error) {
    console.error('Gemini analysis failed:', error);
    return {
      name: componentName,
      path: filePath,
      issues: [],
      suggestions: [],
      tailwindSuggestions: [],
      originalCode: componentCode,
      suggestedCode: componentCode,
    };
  }
}
