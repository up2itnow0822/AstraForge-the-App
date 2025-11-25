import os
import glob

def fix_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()
    new_lines = []
    changed = False
    for line in lines:
        if 'from "' in line or 'from \'' in line:
            # Simple append .js to relative paths without extension
            line = line.replace('from "../', 'from "../').replace('from "./', 'from "./')
            if ("from '" in line or 'from "' in line) and (not '.js' in line.split('from')[1] and not '.ts' in line.split('from')[1] and line.strip().startswith('import') or line.strip().startswith('export')):
                # Append .js if relative and no ext
                if '/"' in line and not '."' in line:
                    line = line.replace('/"', '/.js"')
                elif '/\'' in line and not '.\' ' in line:
                    line = line.replace("/'", '/.js\'')
                changed = True
        new_lines.append(line)
    if changed:
        with open(filepath, 'w') as f:
            f.writelines(new_lines)
        print(f'Fixed: {filepath}')

for filepath in glob.glob('src/**/*.ts', recursive=True):
    fix_file(filepath)
print('Bulk complete')
