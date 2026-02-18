const fs = require('fs');
const content = fs.readFileSync('src/lib/i18n.ts', 'utf8');

function check(lang) {
    const startMarker = `${lang}: {`;
    const start = content.indexOf(startMarker);
    if (start === -1) return;

    let depth = 0;
    let end = start + startMarker.length - 1;
    for (let i = start + startMarker.length - 1; i < content.length; i++) {
        if (content[i] === '{') depth++;
        if (content[i] === '}') {
            depth--;
            if (depth === 0) {
                end = i;
                break;
            }
        }
    }

    const block = content.substring(start, end + 1);
    const lines = block.split('\n');
    const seen = new Map();

    lines.forEach((line, i) => {
        const match = line.match(/^\s*'([^']+)':/);
        if (match) {
            const key = match[1];
            if (seen.has(key)) {
                console.log(`DUPLICATE in ${lang}: "${key}" at line ${i + 1} (previous at line ${seen.get(key)})`);
            }
            seen.set(key, i + 1);
        }
    });
}

check('es');
check('en');
