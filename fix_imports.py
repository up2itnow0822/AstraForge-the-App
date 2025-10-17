import os
import re
import glob

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    changed = False
    new_lines = []
    for line in lines:
        # Match import {..} from './rel'
        match = re.match(r'^(import\s+(?:type\s+)?\{[\s\w,]*\}\s+from\s+["'](\.\.?/[\w/.-]+?)(?<!\.(js|ts|json|css))["'];?)$', line)
        if match:
            new_lines.append(re.sub(r'(["'](\.\.?/[\w/.-]+?)(?<!\.(js|ts|json|css))["'])', r'\1\2.js\3', line))
            changed = True
            continue
        # Match import * as or default from './rel'
        match2 = re.match(r'^(import\s+(?:\*\s+as\s+\w+\s+|)(?:\w+\s+from\s+|default\s+as\s+\w+\s+from\s+) ["'](\.\.?/[\w/.-]+?)(?<!\.(js|ts|json|css))["'];?)$', line)
        if match2:
            new_lines.append(re.sub(r'(["'](\.\.?/[\w/.-]+?)(?<!\.(js|ts|json|css))["'])', r'\1\2.js\3', line))
            changed = True
            continue
        # Match export {..} from './rel'
        match3 = re.match(r'^(export\s+\{[\s\w,]*\}\s+from\s+["'](\.\.?/[\w/.-]+?)(?<!\.(js|ts|json|css))["'];?)$', line)
        if match3:
            new_lines.append(re.sub(r'(["'](\.\.?/[\w/.-]+?)(?<!\.(js|ts|json|css))["'])', r'\1\2.js\3', line))
            changed = True
            continue
        new_lines.append(line)
    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f'Fixed: {filepath}')

for filepath in glob.glob('src/**/*.ts', recursive=True):
    fix_file(filepath)
print('Bulk fix complete')
