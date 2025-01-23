import { readWantedLockfile } from '@pnpm/lockfile.fs';
import { writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const allDeps = new Map();

const root = {};
async function parseLockfile(lockfileFolder) {
  // Use pnpm official method, may avoid some unknown problems
  const lockfileContent = await readWantedLockfile(lockfileFolder, {});
  if (!lockfileContent) {
    throw new Error('Not lockfile found');
  }
  // importers defines every workspace dependencies
  // packages defines all packages installed and their dependencies
  const { importers, packages } = lockfileContent;

  const versions = [];
  class Dep {
    constructor(name, version) {
      const key = `${name}@${version}`;
      if (allDeps.has(key)) {
        return allDeps.get(key);
      }
      versions.push(version);
      this.children = [];
      this.name = name;
      this.version = version;
      allDeps.set(key, this);
      this.parseChildren();
    }
    get id() {
      return `${this.name}@${this.version}`;
    }
    get versionType() {
      function isSemver(ver) {
        return ver.match(
          /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
        );
      }
      if (this.version.startsWith('link:')) {
        return 'link';
      }
      if (this.version.startsWith('git+')) {
        return 'git';
      }
      // https://semver.org/
      if (isSemver(this.version)) {
        return 'semver';
      }
      if (
        this.version.match(
          /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?\(.+\)$/
        )
      ) {
        return 'semver-with-parentheses';
      }
      if (this.version.match(/.+@.+/)) {
        const idx = this.version.slice([this.version.lastIndexOf('@')]);
        const name = this.version.slice(0, idx);
        const version = this.version.slice(idx);
        // not strict
        if (name.match(/^(@|\w).+$/) && isSemver(version)) {
          return 'package-alias';
        }
      }
      return 'unknown';
    }
    parseChildren() {
      // TODO: package alias. It can be supported
      if (['link', 'unknown', 'package-alias'].includes(this.versionType)) {
        console.warn(
          `version type not supported, name: ${this.name}, version: ${this.version}`
        );
        return;
      }
      const snapshot = packages[this.id];
      if (!snapshot) {
        console.warn(`${this.id} is not supported`);
        return;
      }
      const {
        dependencies = {},
        devDependencies = {},
        optionalDependencies = {},
      } = snapshot;
      const deps = {
        ...optionalDependencies,
        ...devDependencies,
        ...dependencies,
      };
      Object.entries(deps).forEach(([name, version]) => {
        this.children.push(new Dep(name, version));
      });
    }
    toJSON() {
      return {
        id: `${this.name}@${this.version}`,
        name: this.name,
        version: this.version,
        children: this.children?.map(item => item.id),
      };
    }
  }

  /**
   * @param {import('@pnpm/lockfile.fs').ProjectSnapshot} manifest
   */
  function parseImporter(manifest) {
    const result = [];
    const {
      dependencies = {},
      devDependencies = {},
      peerDependencies = {},
      optionalDependencies = {},
    } = manifest;

    const deps = {
      ...optionalDependencies,
      ...peerDependencies,
      ...devDependencies,
      ...dependencies,
    };
    Object.entries(deps).forEach(([name, version]) => {
      result.push(new Dep(name, version));
    });
    return result;
  }
  for (const [repo, projectSnapshot] of Object.entries(importers)) {
    root[repo] = parseImporter(projectSnapshot);
  }
}

const json = {
  workspace: [],
  dependencies: [],
};

function walk() {
  Object.entries(root).forEach(([repo, deps], index) => {
    json.workspace.push({
      id: repo,
      name: repo,
      children: deps.map(item => item.id),
    });
  });
  allDeps.forEach(dep => json.dependencies.push(dep.toJSON()));
}

export async function parse(folderPath) {
  await parseLockfile(folderPath);
  walk();
  await writeFile(
    path.join(fileURLToPath(import.meta.url), '..', 'page/_parsed.json'),
    JSON.stringify(json)
  );
}
