import * as fs from 'fs';
import * as path from 'path';
import { emit } from 'process';

import * as vscode from 'vscode';

import { Config } from './config';
import { ensureDirectoryExists, escapeShell } from './util';
import { makeWatcher, WatchEvent } from './watcher';

const DEFAULT_TEMP_DIR = 'temp';

let _watcher: fs.FSWatcher | undefined;
let _onDidOpenTerminalHook: vscode.Disposable | undefined;

export async function turnOnIfEnabled(context: vscode.ExtensionContext) {
    if (Config.isEnabled) {
        turnOn(context);
    }
}

export async function toggle(context: vscode.ExtensionContext) {
    const newState = !Config.isEnabled;
    newState ? turnOn(context) : turnOff();
    vscode.workspace.getConfiguration('vscode-copy-from-terminal').update('enabled', newState, true);
    vscode.window.showInformationMessage(`The extension is now ${newState ? 'enabled' : 'disabled'}.`);
}

export function turnOn(context: vscode.ExtensionContext) {
    const tmpdir = Config.tempDirectory || path.join(context.extensionUri.fsPath, DEFAULT_TEMP_DIR);
    const alias = Config.alias;
    ensureDirectoryExists(tmpdir);

    turnOff(); // Clean start
    watch(context, tmpdir);
    _onDidOpenTerminalHook = vscode.window.onDidOpenTerminal(x => execPayload(x, tmpdir, alias));
    context.subscriptions.push(_onDidOpenTerminalHook);
    vscode.window.terminals.forEach(x => execPayload(x, tmpdir, alias));
}

export function turnOff() {
    disposeWatcher();
    disposeOnDidOpenTerminalHook();
}

async function execPayload(terminal: vscode.Terminal, tmpdir: string, alias: string) {
    const payload = makePayload(tmpdir, alias);
    terminal.sendText(payload, true);
}

export function makePayload(tmpdir: string, alias: string) {
    return `export COPY_TO_VSCODE_TEMP_DIR="${escapeShell(tmpdir)}/" && ${escapeShell(alias)}() { dt="$(date --iso-8601=seconds)" && tempfname="$dt-$RANDOM.tmp" && tempfpath="$COPY_TO_VSCODE_TEMP_DIR/$tempfname" && cat > "$tempfpath" }`;
}

function watch(context: vscode.ExtensionContext, tmpdir: string) {
    disposeWatcher();

    let { watcher, emitter } = makeWatcher(tmpdir);
    context.subscriptions.push(emitter);

    emitter.event(async (event: WatchEvent) => {
        const filepath = path.join(event.dir, event.filename);
        const doc = await vscode.workspace.openTextDocument(filepath);
        await vscode.window.showTextDocument(doc, { preview: false, preserveFocus: true });
    });
    _watcher = watcher;
}

function disposeWatcher() {
    _watcher?.close();
    _watcher = undefined;
}

function disposeOnDidOpenTerminalHook() {
    _onDidOpenTerminalHook?.dispose();
    _onDidOpenTerminalHook = undefined;
}