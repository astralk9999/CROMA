const fs = require('fs');
const content = fs.readFileSync('src/lib/i18n.ts', 'utf8');

const esStart = content.indexOf('es: {');
const esEnd = content.indexOf('en: {') - 1;
const enStart = content.indexOf('en: {');
const enEnd = content.lastIndexOf('}') - 1;

function find(block, label) {
    const keys = block.match(/'[^']+':/g) || [];
    const counts = {};
    keys.forEach(k => {
        counts[k] = (counts[k] || 0) + 1;
        if (counts[k] > 1) console.log(`DUPE in ${label}: ${k}`);
    });
}

find(content.substring(esStart, esEnd), 'ES');
find(content.substring(enStart, enEnd), 'EN');
