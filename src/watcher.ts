import * as fs from 'fs';
import * as path from 'path';

import * as vscode from 'vscode';

import { Config } from './config';

export type WatchEvent = { dir: string, filename: string };

export function makeWatcher(tmpdir: string): { watcher: fs.FSWatcher, emitter: vscode.EventEmitter<WatchEvent> } {
    let ls: string[] | undefined;
    const emitter = new vscode.EventEmitter<WatchEvent>();

    const watcher = fs.watch(tmpdir, async (eventType, filename) => {
        if (eventType !== 'rename') {
            return;
        }

        if (ls && ls.includes(filename)) {
            return;
        }
        ls = (await fs.promises.readdir(tmpdir, { withFileTypes: true })).filter(x => x.isFile()).map(x => x.name);
        const e: WatchEvent = { dir: tmpdir, filename: filename };
        emitter.fire(e);
    });

    return { watcher, emitter };
}
