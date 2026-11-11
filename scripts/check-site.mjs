import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const fail = message => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};
const pass = message => console.log(`PASS: ${message}`);
const html = readFileSync('index.html', 'utf8');
const css = readFileSync('pauze-2.css', 'utf8');
const js = readFileSync('pauze-2.js', 'utf8');

for (const asset of ['/pauze-2.css?v=2', '/pauze-2.js?v=2', '/favicon.svg']) {
  const path = asset.split('?')[0].replace(/^\//, '');
  if (existsSync(resolve(path))) pass(`Referenced asset exists: ${path}`);
  else fail(`Missing referenced asset: ${path}`);
}

const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
for (const match of html.matchAll(/href="#([^"]+)"/g)) {
  if (ids.has(match[1])) pass(`Anchor resolves: #${match[1]}`);
  else fail(`Broken in-page anchor: #${match[1]}`);
}

const filters = [...html.matchAll(/data-filter="([^"]+)"/g)].map(match => match[1]).filter(value => value !== 'all');
const categories = [...html.matchAll(/data-category="([^"]+)"/g)].map(match => match[1]);
const projectCount = (html.match(/<article class="project\b/g) || []).length;
if (projectCount === 5) pass('Five project cards are present');
else fail(`Expected 5 project cards, found ${projectCount}`);

for (const category of filters) {
  const count = categories.filter(value => value === category).length;
  if (count > 0) pass(`Filter "${category}" maps to ${count} project(s)`);
  else fail(`Filter "${category}" has no matching project`);
}
for (const category of categories) {
  if (filters.includes(category)) pass(`Project category "${category}" has a filter`);
  else fail(`Project category "${category}" has no filter`);
}

for (const required of ['data-filter', 'data-copy-email', 'data-ist', 'data-year']) {
  if (html.includes(required) && js.includes(required)) pass(`Interaction wired: ${required}`);
  else fail(`Missing HTML/JS wiring for ${required}`);
}
if (html.includes('rel="noreferrer"')) pass('External links use noreferrer');
else fail('No noreferrer attributes found');

const sitemap = readFileSync('sitemap.xml', 'utf8');
if (sitemap.includes('<loc>https://pauze.is-a.dev/</loc>') && !sitemap.includes('/projects/')) pass('Sitemap matches the single-page site');
else fail('Sitemap contains stale or missing routes');

const robots = readFileSync('robots.txt', 'utf8');
if (robots.includes('Sitemap: https://pauze.is-a.dev/sitemap.xml')) pass('robots.txt points to the sitemap');
else fail('robots.txt sitemap reference is missing');

if (css.includes('prefers-reduced-motion') && js.includes('prefers-reduced-motion')) pass('Reduced-motion support is present');
else fail('Reduced-motion support is missing');

if (process.exitCode) process.exit(process.exitCode);
