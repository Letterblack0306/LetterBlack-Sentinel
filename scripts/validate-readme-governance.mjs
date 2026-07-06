import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readmePath = path.join(root, 'README.md');
const pkgPath = path.join(root, 'package.json');
const failures = [];

function block(code, message) {
  failures.push(`${code}: ${message}`);
}

function text(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function withoutCodeBlocks(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, '');
}

if (!fs.existsSync(readmePath)) {
  block('BLOCK_REQUIRED_SECTION_MISSING', 'README.md is missing.');
} else {
  const readme = text(readmePath);
  const readable = withoutCodeBlocks(readme).toLowerCase();
  const pkg = JSON.parse(text(pkgPath));

  const required = [
    '# @letterblack/lbe-core',
    '<img src="assets/banner.png"',
    '## AI agents are getting stronger. Their execution layer is not.',
    '## How LBE fits into an agent workflow',
    '## Install first, then start simple',
    '### Quick start',
    '## Terminal-first workflow',
    '## Why LBE exists',
    '## Story flow',
    '## Common commands',
    '## Programmatic API',
    '## What ships in this package',
    '## Technical visuals',
    '## What LBE does not do',
    '## License'
  ];

  for (const item of required) {
    if (!readme.includes(item)) {
      block('BLOCK_REQUIRED_SECTION_MISSING', `Missing README section or fragment: ${item}`);
    }
  }

  const forbiddenIdentity = [
    'workflow platform',
    'workflow automation platform',
    'agent marketplace',
    'multi-agent controller',
    'orchestration engine',
    'deterministic workflow engine',
    'bot framework',
    'bot farm',
    'external planner',
    'fixed pipeline'
  ];

  for (const phrase of forbiddenIdentity) {
    if (readable.includes(phrase)) {
      block('BLOCK_README_IDENTITY_DRIFT', `Forbidden identity phrase found: ${phrase}`);
    }
  }

  for (const requiredImage of ['assets/banner.png', 'assets/runtime-boundary.svg']) {
    if (!readme.includes(requiredImage)) {
      block('BLOCK_IMAGE_NOT_RENDERED', `Required image is not rendered in README: ${requiredImage}`);
    }
  }

  const htmlImages = [...readme.matchAll(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);
  const mdImages = [...readme.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]);
  const localImages = [...new Set([...htmlImages, ...mdImages])].filter((ref) => !/^https?:\/\//i.test(ref));

  if (localImages.length === 0) {
    block('BLOCK_MISSING_README_IMAGES', 'README has no local rendered images.');
  }

  for (const image of localImages) {
    const cleanImage = image.split('#')[0].split('?')[0];
    if (!fs.existsSync(path.join(root, cleanImage))) {
      block('BLOCK_BROKEN_IMAGE_PATHS', `README image path does not exist: ${image}`);
    }
  }

  const links = [...readme.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map((match) => ({ label: match[1], href: match[2] }));
  for (const link of links) {
    const label = link.label.toLowerCase();
    const href = link.href.toLowerCase();
    const visualLabel = /(story|diagram|visual|image|screenshot|request flow)/.test(label);
    const docsOnly = href.startsWith('docs/') || href.includes('/docs/');
    if (visualLabel && docsOnly) {
      block('BLOCK_README_LINK_REDIRECT', `Visual label links to docs instead of rendering in README: ${link.label}`);
    }
  }

  if (!readme.includes(`npm install ${pkg.name}`)) {
    block('BLOCK_INVALID_INSTALL_COMMAND', `Install command must use package name: ${pkg.name}`);
  }

  if (!readme.includes(`import { execute } from '${pkg.name}';`)) {
    block('BLOCK_STALE_API_EXAMPLE', `API example must import from package name: ${pkg.name}`);
  }

  const nodeRequirement = String(pkg.engines?.node ?? '').replace('>=', '>= ');
  if (nodeRequirement && !readme.includes(`Requires Node.js ${nodeRequirement}.`)) {
    block('BLOCK_INVALID_INSTALL_COMMAND', `Node.js requirement must match package.json: ${pkg.engines.node}`);
  }

  const allowedCommands = new Set([
    'npx lbe',
    'npx lbe init',
    'npx lbe status',
    'npx lbe scope',
    'npx lbe intent',
    'npx lbe audit-workspace',
    'npx lbe proof',
    'npx lbe execute',
    'npx lbe observe',
    'npx lbe enforce'
  ]);

  const commands = [...readme.matchAll(/`(npx lbe(?:\s+[a-z-]+)?)`/g)].map((match) => match[1]);
  for (const command of commands) {
    if (!allowedCommands.has(command)) {
      block('BLOCK_INVALID_COMMAND_REFERENCE', `Unsupported README command: ${command}`);
    }
  }
}

if (failures.length > 0) {
  console.error('README governance validation failed.');
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

console.log('README governance validation passed.');
