'use client';

import { useMemo } from 'react';
import {
  SandpackProvider,
  SandpackPreview as SandpackPreviewPane,
  SandpackCodeEditor,
  SandpackLayout,
} from '@codesandbox/sandpack-react';

interface SandpackPreviewProps {
  code: string;
  showEditor?: boolean;
}

// Map of common import patterns to npm packages with versions
const PACKAGE_MAP: Record<string, string> = {
  // Animation
  'framer-motion': 'framer-motion@^11.0.0',
  'motion': 'framer-motion@^11.0.0',
  '@react-spring': 'react-spring@^9.7.0',
  'react-spring': 'react-spring@^9.7.0',
  'gsap': 'gsap@^3.12.0',

  // UI Libraries
  '@radix-ui': '@radix-ui/themes@^3.0.0',
  'radix-ui': '@radix-ui/themes@^3.0.0',
  '@headlessui': '@headlessui/react@^2.0.0',
  '@chakra-ui': '@chakra-ui/react@^2.8.0',
  '@mui': '@mui/material@^5.15.0',
  '@emotion': '@emotion/react@^11.11.0',

  // Icons
  'lucide-react': 'lucide-react@^0.400.0',
  'react-icons': 'react-icons@^5.0.0',
  '@heroicons': '@heroicons/react@^2.1.0',
  'phosphor-react': '@phosphor-icons/react@^2.1.0',

  // Charts
  'recharts': 'recharts@^2.12.0',
  '@visx': '@visx/group@^3.3.0',
  'victory': 'victory@^37.0.0',

  // Forms
  'react-hook-form': 'react-hook-form@^7.51.0',
  'formik': 'formik@^2.4.0',
  '@hookform': '@hookform/resolvers@^3.3.0',
  'zod': 'zod@^3.22.0',
  'yup': 'yup@^1.4.0',

  // Date/Time
  'date-fns': 'date-fns@^3.6.0',
  'dayjs': 'dayjs@^1.11.0',
  '@tanstack/react-table': '@tanstack/react-table@^8.16.0',

  // Utils
  'clsx': 'clsx@^2.1.0',
  'class-variance-authority': 'class-variance-authority@^0.7.0',
  'tailwind-merge': 'tailwind-merge@^2.3.0',

  // Misc UI
  'react-hot-toast': 'react-hot-toast@^2.4.0',
  'sonner': 'sonner@^1.4.0',
  'react-toastify': 'react-toastify@^10.0.0',
};

// Extract imports and detect required packages
function detectDependencies(code: string): Record<string, string> {
  const deps: Record<string, string> = {};

  // Always include React and React DOM
  deps['react'] = '^18.2.0';
  deps['react-dom'] = '^18.2.0';

  // Parse import statements
  const importRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(code)) !== null) {
    const importPath = match[1];

    // Skip relative imports
    if (importPath.startsWith('.') || importPath.startsWith('/')) {
      continue;
    }

    // Get the package name (handle scoped packages)
    let packageName = importPath;
    if (importPath.startsWith('@')) {
      // Scoped package: @scope/package or @scope/package/subpath
      const parts = importPath.split('/');
      packageName = parts.slice(0, 2).join('/');
    } else {
      // Regular package: package or package/subpath
      packageName = importPath.split('/')[0];
    }

    // Check if we have a mapping for this package
    for (const [pattern, version] of Object.entries(PACKAGE_MAP)) {
      if (packageName.includes(pattern) || importPath.includes(pattern)) {
        const pkgName = version.split('@')[0];
        const pkgVersion = version.includes('@') ? version.split('@').slice(1).join('@') : 'latest';
        deps[pkgName] = pkgVersion;
        break;
      }
    }

    // If no mapping, try to add the package directly
    if (!deps[packageName] && !packageName.startsWith('@/') && !packageName.startsWith('next')) {
      // Add with latest version for unknown packages
      deps[packageName] = 'latest';
    }
  }

  return deps;
}

// Clean up the component code for Sandpack
function prepareCode(code: string): string {
  let cleanCode = code;

  // Remove 'use client' directive
  cleanCode = cleanCode.replace(/['"]use client['"];?\s*/g, '');

  // Replace @/ imports with relative imports (won't work but prevents errors)
  cleanCode = cleanCode.replace(/@\/components\//g, './');
  cleanCode = cleanCode.replace(/@\/lib\//g, './');
  cleanCode = cleanCode.replace(/@\/hooks\//g, './');
  cleanCode = cleanCode.replace(/@\//g, './');

  // Remove next/image - replace with img
  cleanCode = cleanCode.replace(/import\s+Image\s+from\s+['"]next\/image['"];?\s*/g, '');
  cleanCode = cleanCode.replace(/<Image/g, '<img');
  cleanCode = cleanCode.replace(/<\/Image>/g, '</img>');

  // Remove next/link - replace with a
  cleanCode = cleanCode.replace(/import\s+Link\s+from\s+['"]next\/link['"];?\s*/g, '');
  cleanCode = cleanCode.replace(/<Link/g, '<a');
  cleanCode = cleanCode.replace(/<\/Link>/g, '</a>');

  // Remove next/navigation imports
  cleanCode = cleanCode.replace(/import\s*{[^}]*}\s*from\s*['"]next\/navigation['"];?\s*/g, '');

  return cleanCode;
}

// Extract the component name for the render
function getComponentName(code: string): string {
  // Try to find export default function Name
  const exportDefaultMatch = code.match(/export\s+default\s+function\s+(\w+)/);
  if (exportDefaultMatch) return exportDefaultMatch[1];

  // Try to find function Name that's exported
  const functionMatch = code.match(/(?:export\s+)?function\s+(\w+)/);
  if (functionMatch) return functionMatch[1];

  // Try to find const Name = (that's exported
  const constMatch = code.match(/(?:export\s+)?const\s+(\w+)\s*=/);
  if (constMatch) return constMatch[1];

  return 'Component';
}

export function SandpackPreview({ code, showEditor = false }: SandpackPreviewProps) {
  const { dependencies, preparedCode, componentName } = useMemo(() => {
    const deps = detectDependencies(code);
    const prepared = prepareCode(code);
    const name = getComponentName(code);
    return { dependencies: deps, preparedCode: prepared, componentName: name };
  }, [code]);

  // Create the main App file that renders the component
  const appCode = `
import React from 'react';
import { ${componentName} } from './Component';

export default function App() {
  return (
    <div className="p-4">
      <${componentName} />
    </div>
  );
}
`;

  // Add default export if not present
  let componentCode = preparedCode;
  if (!componentCode.includes('export default') && !componentCode.includes(`export { ${componentName} }`)) {
    componentCode += `\nexport { ${componentName} };`;
  }

  return (
    <SandpackProvider
      template="react"
      theme="dark"
      files={{
        '/App.js': appCode,
        '/Component.js': componentCode,
        '/styles.css': `
@import url('https://cdn.jsdelivr.net/npm/tailwindcss@3.4.0/dist/tailwind.min.css');

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, sans-serif;
}
        `,
      }}
      customSetup={{
        dependencies,
      }}
      options={{
        externalResources: [
          'https://cdn.jsdelivr.net/npm/tailwindcss@3.4.0/dist/tailwind.min.css',
        ],
      }}
    >
      <SandpackLayout>
        {showEditor && (
          <SandpackCodeEditor
            style={{ height: '100%', minHeight: '400px' }}
            showLineNumbers
            showTabs
          />
        )}
        <SandpackPreviewPane
          style={{ height: '100%', minHeight: '400px' }}
          showOpenInCodeSandbox={false}
          showRefreshButton
        />
      </SandpackLayout>
    </SandpackProvider>
  );
}
