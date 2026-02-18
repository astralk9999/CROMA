const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\k\\Desktop\\all\\clase\\Tienda Online\\src\\lib\\i18n.ts', 'utf8');

function findDuplicates(blockName) {
    const startIdx = content.indexOf(`${blockName}: {`);
    let braceCount = 1;
    let endIdx = startIdx + `${blockName}: {`.length;
    while (braceCount > 0 && endIdx < content.length) {
        if (content[endIdx] === '{') braceCount++;
        if (content[endIdx] === '}') braceCount--;
        endIdx++;
    }
    const block = content.substring(startIdx, endIdx);
    const lines = block.split('\n');
    const keys = {};
    lines.forEach((line, idx) => {
        const match = line.match(/'([^']+)':/);
        if (match) {
            const key = match[1];
            if (keys[key]) {
                console.log(`Duplicate key in ${blockName}: ${key} at block line ${idx + 1}`);
            }
            keys[key] = true;
        }
    });
}

findDuplicates('es');
findDuplicates('en');
