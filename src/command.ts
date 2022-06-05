import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import * as vscode from 'vscode';

import { Config } from './config';
import { ensureDirectoryExists, escapeShell } from './util';
import { makeWatcher, WatchEvent } from './watcher';

const DEFAULT_TEMP_DIR = 'temp';

/**
* This avoids opening the file in more than one VS Code window (if there are multiple open VS Code windows).
*/
let _instanceId: string | undefined;

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
    _instanceId = _instanceId || crypto.randomUUID().substring(0, 4);
    const instanceId = _instanceId;
    watch(context, instanceId, tmpdir);
    _onDidOpenTerminalHook = vscode.window.onDidOpenTerminal(x => execPayload(x, instanceId, tmpdir, alias));
    context.subscriptions.push(_onDidOpenTerminalHook);
    vscode.window.terminals.forEach(x => execPayload(x, instanceId, tmpdir, alias));
}

export function turnOff() {
    _instanceId = undefined;
    disposeWatcher();
    disposeOnDidOpenTerminalHook();
}

async function execPayload(terminal: vscode.Terminal, instanceId: string, tmpdir: string, alias: string) {
    const payload = makePayload(instanceId, tmpdir, alias);
    terminal.sendText(payload, true);
}

export function makePayload(instanceId: string, tmpdir: string, alias: string) {
    return `export COPY_TO_VSCODE_TEMP_DIR="${escapeShell(tmpdir)}/" && export EXTENSION_INSTANCE_ID="${escapeShell(instanceId)}" && ${escapeShell(alias)}() { dt="$(date --iso-8601=seconds)" && tempfname="$dt-$RANDOM-$EXTENSION_INSTANCE_ID.tmp" && tempfpath="$COPY_TO_VSCODE_TEMP_DIR/$tempfname" && cat > "$tempfpath" }`;
}

function watch(context: vscode.ExtensionContext, instance: string, tmpdir: string) {
    disposeWatcher();

    let { watcher, emitter } = makeWatcher(tmpdir);
    context.subscriptions.push(emitter);

    emitter.event(async (event: WatchEvent) => {
        if (instance !== getExtensionInstanceFromFilename(event.filename)) {
            /**
             * This avoids opening the file in more than one VS Code window (if
             * there are multiple open VS Code windows).
             */
            return;
        }
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

function getExtensionInstanceFromFilename(filename: string) {
    const parts = filename.split('-'); // (e.g. '2020-07-01T12:00:00.000Z-12345-aaaa.tmp')
    const lastPart = parts[parts.length - 1]; // (e.g., 'aaaa.tmp')
    return lastPart.split('.')[0]; // (e.g., 'aaaa')
}
