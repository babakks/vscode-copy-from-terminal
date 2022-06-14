import * as vscode from 'vscode';

export class Config {
    static get isEnabled(): boolean {
        return vscode.workspace.getConfiguration('vscode-copy-from-terminal').get('enabled', true);
    }

    static get tempDirectory(): string {
        return vscode.workspace.getConfiguration('vscode-copy-from-terminal').get<string>('tempDirectory', '');
    }

    static get cpAlias(): string {
        return vscode.workspace.getConfiguration('vscode-copy-from-terminal').get<string>('alias', '');
    }

    static get teeAlias(): string {
        return vscode.workspace.getConfiguration('vscode-copy-from-terminal').get<string>('aliasForTee', '');
    }
}
