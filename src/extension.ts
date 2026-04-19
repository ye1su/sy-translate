import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  // Register translate command
  const translateCommand = vscode.commands.registerCommand(
    'vscode-doc-translator.translate',
    async () => {
      const { translateDocument } = await import('./commands/translate');
      await translateDocument();
    }
  );

  // Create status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    'vscode-doc-translator.config',
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBarItem.text = '$(translate) Translate';
  statusBarItem.tooltip = 'Click to translate or configure';
  statusBarItem.command = 'vscode-doc-translator.showMenu';

  // Get translated file path
  function getTranslatedPath(filePath: string): string {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
      throw new Error('No workspace folder found');
    }
    const relativePath = path.relative(workspaceFolder, filePath);
    const ext = path.extname(filePath);
    const translatedFilename = relativePath.replace(/[\\/]/g, '.').replace(ext, '.md');
    return path.join(workspaceFolder, '.sy', translatedFilename);
  }

  // Check if translation exists
  function translationExists(filePath: string): boolean {
    try {
      const translatedPath = getTranslatedPath(filePath);
      return fs.existsSync(translatedPath);
    } catch {
      return false;
    }
  }

  // Jump to translated file
  async function jumpToTranslation() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No active editor found.');
      return;
    }

    const filePath = editor.document.uri.fsPath;
    const translatedPath = getTranslatedPath(filePath);

    if (!fs.existsSync(translatedPath)) {
      vscode.window.showInformationMessage('Translation not found. Please translate first.');
      return;
    }

    const doc = await vscode.workspace.openTextDocument(translatedPath);
    await vscode.window.showTextDocument(doc);
  }

  // Show menu command
  const showMenuCommand = vscode.commands.registerCommand(
    'vscode-doc-translator.showMenu',
    async () => {
      const config = vscode.workspace.getConfiguration('vscode-doc-translator');
      const apiKey = config.get<string>('apiKey', '');
      const apiEndpoint = config.get<string>('apiEndpoint', 'https://api.minimaxi.com/v1');
      const model = config.get<string>('model', 'MiniMax-M2.01');

      const editor = vscode.window.activeTextEditor;
      const currentFilePath = editor?.document.uri.fsPath || '';
      const hasTranslation = currentFilePath ? translationExists(currentFilePath) : false;

      const items: vscode.QuickPickItem[] = [
        { label: '$(translate) Translate Document', description: 'Translate current .md or .txt file' },
      ];

      // Add jump option if translation exists
      if (hasTranslation) {
        const translatedPath = getTranslatedPath(currentFilePath);
        const translatedName = path.basename(translatedPath);
        items.push({ label: '$(go-to-file) Jump to Translation', description: `Open: ${translatedName}` });
      }

      items.push(
        { label: '', kind: vscode.QuickPickItemKind.Separator },
        { label: '$(key) API Key', description: apiKey ? '********' + apiKey.slice(-4) : 'Not set' },
        { label: '$(globe) API Endpoint', description: apiEndpoint },
        { label: '$(device-desktop) Model', description: model }
      );

      const selection = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select action'
      });

      if (!selection) { return; }

      if (selection.label.startsWith('$(translate)')) {
        const { translateDocument } = await import('./commands/translate');
        await translateDocument();
      } else if (selection.label.startsWith('$(go-to-file)')) {
        await jumpToTranslation();
      } else if (selection.label.startsWith('$(key)')) {
        const input = await vscode.window.showInputBox({
          prompt: 'Enter API Key',
          password: true,
          value: apiKey
        });
        if (input !== undefined) {
          await config.update('apiKey', input, vscode.ConfigurationTarget.Global);
          updateStatusBar();
          vscode.window.showInformationMessage('API Key updated');
        }
      } else if (selection.label.startsWith('$(globe)')) {
        const input = await vscode.window.showInputBox({
          prompt: 'Enter API Endpoint',
          value: apiEndpoint
        });
        if (input !== undefined) {
          await config.update('apiEndpoint', input, vscode.ConfigurationTarget.Global);
          updateStatusBar();
          vscode.window.showInformationMessage('API Endpoint updated');
        }
      } else if (selection.label.startsWith('$(device-desktop)')) {
        const input = await vscode.window.showInputBox({
          prompt: 'Enter Model name',
          value: model
        });
        if (input !== undefined) {
          await config.update('model', input, vscode.ConfigurationTarget.Global);
          updateStatusBar();
          vscode.window.showInformationMessage('Model updated');
        }
      }
    }
  );

  // Update status bar display
  function updateStatusBar() {
    const config = vscode.workspace.getConfiguration('vscode-doc-translator');
    const apiKey = config.get<string>('apiKey', '');
    if (apiKey) {
      statusBarItem.text = '$(translate) Translate';
      statusBarItem.tooltip = 'Click to translate or configure';
    } else {
      statusBarItem.text = '$(translate) $(warning)';
      statusBarItem.tooltip = 'API not configured - Click to set up';
    }
  }

  updateStatusBar();
  statusBarItem.show();

  context.subscriptions.push(translateCommand);
  context.subscriptions.push(showMenuCommand);
  context.subscriptions.push(statusBarItem);
}

export function deactivate() {}
