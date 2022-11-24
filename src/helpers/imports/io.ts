import * as fs from 'fs';
import path from 'path';

export const getFileContentsSync = (filePath: string): string => {
  return fs.readFileSync(path.resolve(filePath), {
    encoding: 'utf8',
    flag: 'r',
  });
};
