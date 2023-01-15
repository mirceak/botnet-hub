import fs from 'fs';
import path from 'path';

try {
  fs.unlinkSync(path.resolve(import.meta.url.replaceAll(/^file:\/\/\//g, ''), '../pre-commit'));
} catch (err) {
  process.exit(0)
}
