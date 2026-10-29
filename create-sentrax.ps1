# ==============================================================================
# SENTRAX NATIVE POWERSHELL PROJECT GENERATOR & ZIP BUNDLER
# ==============================================================================

Write-Host "Creating Sentrax project files..." -ForegroundColor Cyan

$CurrentDir = Get-Location

# 1. Define folder paths
$Folders = @(
    "supabase",
    "src",
    "src\lib",
    "src\context",
    "src\hooks",
    "src\components\ui",
    "src\components\layout",
    "src\components\heatmap",
    "src\components\crime",
    "src\components\map",
    "src\components\admin",
    "src\pages"
)

foreach ($folder in $Folders) {
    $fullPath = Join-Path $CurrentDir $folder
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
    }
}

# 2. Package.json
@'
{
  "name": "sentrax",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.48.1",
    "clsx": "^2.1.1",
    "framer-motion": "^12.4.7",
    "leaflet": "^1.9.4",
    "leaflet.heat": "^0.2.0",
    "lucide-react": "^0.475.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-leaflet": "^4.2.1",
    "react-router-dom": "^6.29.0",
    "recharts": "^2.15.1",
    "tailwind-merge": "^3.0.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.2",
    "tailwindcss": "^3.4.17",
    "vite": "^6.1.0"
  }
}
'@ | Set-Content -Path "package.json" -Encoding UTF8

# 3. Vite Config
@'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
});
'@ | Set-Content -Path "vite.config.js" -Encoding UTF8

# 4. Tailwind Config
@'
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0A0B10',
          surface: '#12141C',
          surfaceHover: '#181B26',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        primary: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
        },
        danger: {
          DEFAULT: '#EF4444',
          hover: '#DC2626',
        },
        warning: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
        },
        success: {
          DEFAULT: '#10B981',
          hover: '#059669',
        },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
'@ | Set-Content -Path "tailwind.config.js" -Encoding UTF8

# 5. Postcss Config
@'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
'@ | Set-Content -Path "postcss.config.js" -Encoding UTF8

# 6. Index.html
@'
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sentrax | Crime Heatmap & Emergency Response</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  </head>
  <body class="bg-gray-50 text-gray-900 dark:bg-dark-bg dark:text-gray-100 font-body antialiased transition-colors duration-200">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
'@ | Set-Content -Path "index.html" -Encoding UTF8

# 7. Environment & Gitignore
@'
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
'@ | Set-Content -Path ".env.example" -Encoding UTF8

@'
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
'@ | Set-Content -Path ".env" -Encoding UTF8

@'
node_modules
dist
dist-ssr
*.local
.env
.env.local
.DS_Store
'@ | Set-Content -Path ".gitignore" -Encoding UTF8

# 8. Vercel Configuration
@'
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
'@ | Set-Content -Path "vercel.json" -Encoding UTF8

# 9. Stylesheet
@'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body { overflow-x: hidden; }
  h1, h2, h3, h4, h5, h6 { font-family: theme('fontFamily.heading'); }
}

.glass-panel {
  background: rgba(18, 20, 28, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
'@ | Set-Content -Path "src\index.css" -Encoding UTF8

# 10. React Main Entry
@'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
'@ | Set-Content -Path "src\main.jsx" -Encoding UTF8

Write-Host "All project files created successfully!" -ForegroundColor Green
Write-Host "Creating Sentrax.zip..." -ForegroundColor Cyan

# 11. Bundle to Sentrax.zip in the parent Downloads folder
$DestinationZip = Join-Path (Split-Path $CurrentDir -Parent) "Sentrax.zip"
Compress-Archive -Path "$CurrentDir\*" -DestinationPath $DestinationZip -Force

Write-Host "SUCCESS! Zip file created at: $DestinationZip" -ForegroundColor Green