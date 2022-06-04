import * as vscode from 'vscode';
import { toggle, turnOnIfEnabled, turnOff } from './command';

export function activate(context: vscode.ExtensionContext) {
    turnOnIfEnabled(context);

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-copy-from-terminal.toggle', () => toggle(context)),
    );
}

export function deactivate() {
    turnOff();
}
