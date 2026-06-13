with open('backend/app/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the unindented is_hindi line
target = 'is_hindi = any(char in msg_lower for char in "অআইঈউঊঋএঐওঔকখগঘচছজঝটठডढणतथদधनপফবভমयरलवशषসহকষত্রজ্ঞনমস্তে")'
replacement = '            is_hindi = any(char in msg_lower for char in "অআইঈউঊঋএঐওঔকখগঘচছজঝটठডढणतथদधनপফবভমयरलवशषসহকষত্রজ্ঞনমস্তে")'

if target in content:
    content = content.replace(target, replacement)
    print("Indentation fixed.")
else:
    # Try finding the line containing is_hindi and manually prefixing spaces
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if line.startswith('is_hindi = any(char in msg_lower'):
            lines[i] = '            ' + line
            print("Indentation fixed via split lines.")
            break
    content = '\n'.join(lines)

with open('backend/app/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Indentation patch applied!")
