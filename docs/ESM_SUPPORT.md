# ESM Support in SpaceJS

## Overview

SpaceJS provides comprehensive support for ECMAScript Modules (ESM) alongside CommonJS and TypeScript modules. The `Code` class automatically detects and loads modules in the appropriate format.

## Module Type Detection

### Automatic Detection

The `Code` class automatically detects the module type based on:

1. **File Extension**
   - `.mjs` → ESM
   - `.cjs` → CommonJS
   - `.ts` → TypeScript (with ESM syntax detection)
   - `.js` → Auto-detected based on syntax

2. **Syntax Analysis**
   For `.js` and `.ts` files, the system analyzes the source code to detect ESM syntax:
   - `import` statements
   - `export` statements
   - `export default`
   - Dynamic `import()`

### Manual Type Specification

You can manually specify the module type when creating a `Code` instance:

```typescript
const code = new Code(source, 'module.js', 'ESM');
// or
const code = new Code(source, 'module.js', CodeType.ESM);
```

## Supported Module Formats

### 1. CommonJS

```javascript
// module.cjs or module.js (without ESM syntax)
const value = 42;

function greet(name) {
  return `Hello, ${name}!`;
}

module.exports = { value, greet };
```

### 2. ECMAScript Modules (ESM)

```javascript
// module.mjs or module.js (with ESM syntax)
export const value = 42;

export function greet(name) {
  return `Hello, ${name}!`;
}

export default { value, greet };
```

### 3. TypeScript (CommonJS style)

```typescript
// module.ts (without ESM syntax)
const value: number = 42;

function greet(name: string): string {
  return `Hello, ${name}!`;
}

exports.value = value;
exports.greet = greet;
```

### 4. TypeScript (ESM style)

```typescript
// module.ts (with ESM syntax)
export const value: number = 42;

export function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

## Loading Modules

### Basic Usage

```typescript
import { Code } from '@space-js/platform';

// Load an ESM module
const esmCode = new Code(
  `
    export const value = 42;
    export function greet(name) {
      return \`Hello, \${name}!\`;
    }
  `,
  'module.mjs'
);

await esmCode.load();
console.log(esmCode.exports.value); // 42
console.log(esmCode.exports.greet('World')); // Hello, World!
```

### With Custom Context

```typescript
const context = {
  customValue: 100,
  console
};

const code = new Code(
  `
    export function getValue() {
      return customValue;
    }
  `,
  'module.mjs',
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  context
);

await code.load();
console.log(code.exports.getValue()); // 100
```

### With Custom Module Resolution

```typescript
const customRequire = (modulePath) => {
  // Custom module resolution logic
  return import(modulePath);
};

const customImport = async (specifier) => {
  // Custom import logic
  return import(specifier);
};

const code = new Code(
  `
    import fs from 'fs';
    export { fs };
  `,
  'module.mjs',
  undefined,
  customRequire,
  customImport
);

await code.load();
```

## Module Dependencies

### Importing External Modules

ESM modules can import external Node.js modules or local modules:

```typescript
const code = new Code(
  `
    import path from 'path';
    import fs from 'fs';
    
    export function resolvePath(p) {
      return path.resolve(p);
    }
  `,
  'module.mjs',
  undefined,
  (modulePath) => import(modulePath)
);

await code.load();
```

### Importing Local Modules

```typescript
const code = new Code(
  `
    import { helper } from './helper.js';
    
    export function process() {
      return helper();
    }
  `,
  'module.mjs',
  undefined,
  (modulePath) => {
    // Resolve and load local modules
    return import(modulePath);
  }
);

await code.load();
```

## TypeScript Support

### TypeScript ESM Modules

TypeScript files using ESM syntax are automatically detected and processed:

```typescript
const code = new Code(
  `
    export interface UserService {
      name: string;
      age: number;
    }
    
    export function createUser(name: string, age: number): UserService {
      return { name, age };
    }
  `,
  'module.ts'
);

await code.load();
const user = code.exports.createUser('John', 30);
```

### Type Stripping

TypeScript types are automatically stripped using Node.js built-in `Module.stripTypeScriptTypes()` function before execution. This ensures compatibility without requiring the TypeScript compiler.

## Error Handling

```typescript
try {
  const code = new Code(invalidSource, 'module.mjs');
  await code.load();
} catch (error) {
  if (error instanceof CodeError) {
    console.error('Module loading failed:', error.message);
  }
}
```

## Best Practices

1. **Use `.mjs` for ESM files** - Explicitly naming ESM files with `.mjs` ensures correct detection
2. **Use `.cjs` for CommonJS files** - Explicitly naming CommonJS files with `.cjs` avoids ambiguity
3. **Consistent import style** - Use either ESM or CommonJS consistently within a module
4. **Provide custom require/import** - When loading modules with dependencies, provide custom resolution functions
5. **Handle async operations** - Always use `await` when calling `load()` for ESM modules

## Limitations

1. **No circular dependencies** - Circular dependencies between modules are not supported
2. **Sync vs Async** - ESM modules are always loaded asynchronously, CommonJS can be sync
3. **Context isolation** - Modules run in isolated VM contexts with limited access to global scope
4. **No package.json type field** - The system doesn't read `package.json` `"type"` field for module type detection

## Examples

### Complete Example: Loading Multiple Module Types

```typescript
import { Code, CodeType } from '@space-js/platform';

// CommonJS
const cjsCode = new Code(
  'module.exports = { type: "CommonJS" };',
  'module.cjs'
);
await cjsCode.load();
console.log(cjsCode.exports.type); // CommonJS

// ESM
const esmCode = new Code(
  'export const type = "ESM";',
  'module.mjs'
);
await esmCode.load();
console.log(esmCode.exports.type); // ESM

// TypeScript ESM
const tsEsmCode = new Code(
  'export const type: string = "TypeScript ESM";',
  'module.ts'
);
await tsEsmCode.load();
console.log(tsEsmCode.exports.type); // TypeScript ESM
```

## Migration Guide

### From CommonJS to ESM

**Before (CommonJS):**
```javascript
const helper = require('./helper');

function process(data) {
  return helper.transform(data);
}

module.exports = { process };
```

**After (ESM):**
```javascript
import { transform } from './helper.js';

export function process(data) {
  return transform(data);
}
```

### From TypeScript CommonJS to TypeScript ESM

**Before:**
```typescript
import { Helper } from './helper';

class Processor {
  process(data: string): string {
    return Helper.transform(data);
  }
}

export = Processor;
```

**After:**
```typescript
import { Helper } from './helper.js';

export class Processor {
  process(data: string): string {
    return Helper.transform(data);
  }
}
```

## Advanced Features

### Dynamic Import in ESM

```typescript
const code = new Code(
  `
    export async function loadModule(name) {
      const module = await import(name);
      return module;
    }
  `,
  'dynamic.mjs',
  undefined,
  undefined,
  (specifier) => import(specifier)
);

await code.load();
const result = await code.exports.loadModule('fs');
```

### Import Meta URL

```typescript
const code = new Code(
  `
    export const moduleUrl = import.meta.url;
  `,
  'meta.mjs'
);

await code.load();
console.log(code.exports.moduleUrl); // file:///path/to/meta.mjs
```

## Troubleshooting

### Module Not Found

If you encounter "Module not found" errors:
- Ensure the module path is correct
- Provide a custom `requireFrom` or `importFrom` function
- Check that external modules are installed

### Syntax Errors

If ESM syntax is not recognized:
- Ensure the file extension is correct (`.mjs` for ESM)
- Check that ESM syntax patterns are not in comments
- Verify the source code is valid JavaScript/TypeScript

### Type Detection Issues

If module type is incorrectly detected:
- Manually specify the type: `new Code(source, name, 'ESM')`
- Use explicit file extensions (`.mjs`, `.cjs`)
- Check for hidden comments that might interfere with detection
