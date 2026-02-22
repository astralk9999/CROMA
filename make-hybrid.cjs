const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
    if (!fs.existsSync(dir)) return filelist;
    fs.readdirSync(dir).forEach(file => {
        const dirFile = path.join(dir, file);
        if (fs.statSync(dirFile).isDirectory()) {
            filelist = walkSync(dirFile, filelist);
        } else {
            filelist.push(dirFile);
        }
    });
    return filelist;
};

const dynamicFiles = [
    ...walkSync('src/pages/api'),
    ...walkSync('src/pages/admin'),
    ...walkSync('src/pages/my-account'),
    'src/pages/cart.astro',
    'src/pages/checkout.astro',
    'src/pages/login.astro',
    'src/pages/register.astro',
    'src/pages/returns.astro'
];

dynamicFiles.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('export const prerender = false')) return;

    if (file.endsWith('.astro')) {
        // Insert after the first ---
        content = content.replace(/^---\s*\n/, '---\nexport const prerender = false;\n');
    } else if (file.endsWith('.ts') || file.endsWith('.js')) {
        content = 'export const prerender = false;\n' + content;
    }
    fs.writeFileSync(file, content);
});

console.log('Successfully injected prerender=false for dynamic routes.');
