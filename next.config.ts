import type { NextConfig } from 'next';

// Sur GitHub Pages, le site est servi sous /nom-du-repo — on le détecte automatiquement.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]; // ex: "bood-looking"
const basePath = repo ? `/${repo}` : '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath,
  images: {
    unoptimized: true, // obligatoire pour l'export statique
  },
};

export default nextConfig;
