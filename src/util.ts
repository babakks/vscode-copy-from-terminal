import * as fs from 'fs';

export function ensureDirectoryExists(path: string) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
}

export function escapeShell(cmd: string) {
    return cmd.replace(/(["'$`\\])/g, '\\$1');
}
