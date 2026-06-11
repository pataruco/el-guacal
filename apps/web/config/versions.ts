import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, '..');
const SERVER_ROOT = path.resolve(__dirname, '..', '..', 'server');

interface PackageJson {
  version?: string;
}

export function readWebVersion(): string {
  const pkgPath = path.join(WEB_ROOT, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as PackageJson;
  if (!pkg.version) {
    throw new Error(`Expected a "version" field in ${pkgPath}`);
  }
  return pkg.version;
}

export function readApiVersion(): string {
  const cargoPath = path.join(SERVER_ROOT, 'Cargo.toml');
  const cargo = readFileSync(cargoPath, 'utf8');
  const match = cargo.match(/^version\s*=\s*"([^"]+)"/m);
  if (!match) {
    throw new Error(
      `Expected a top-level 'version = "..."' line in ${cargoPath}`,
    );
  }
  return match[1];
}
