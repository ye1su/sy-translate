import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { detectLanguage } from '../services/languageDetector';
import { translateChunks } from '../services/translator';
import { chunkDocument } from '../services/chunker';

/**
 * Get translated file path in .sy directory
 * e.g., src/extension.ts -> .sy/src.extension.md
 */
function getTranslatedPath(originalPath: string): string {
  const dir = path.dirname(originalPath);
  const filename = path.basename(originalPath);
  const ext = path.extname(filename);
  const nameWithoutExt = filename.slice(0, -ext.length);

  // Build relative path from workspace root
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceFolder) {
    throw new Error('No workspace folder found');
  }

  const relativePath = path.relative(workspaceFolder, originalPath);
  const translatedFilename = relativePath.replace(/[\\/]/g, '.').replace(ext, '.md');
  const syDir = path.join(workspaceFolder, '.sy');

  return path.join(syDir, translatedFilename);
}

/**
 * Check if translated file already exists
 */
function translatedExists(originalPath: string): boolean {
  try {
    const translatedPath = getTranslatedPath(originalPath);
    return fs.existsSync(translatedPath);
  } catch {
    return false;
  }
}

/**
 * Main translate command implementation
 */
export async function translateDocument(): Promise<void> {
  // Get the active editor
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('No active editor found.');
    return;
  }

  // Check file type
  const filePath = editor.document.uri.fsPath;
  const fileType = filePath.endsWith('.md') ? '.md' : filePath.endsWith('.txt') ? '.txt' : null;

  if (!fileType) {
    vscode.window.showInformationMessage('Only .md and .txt files are supported.');
    return;
  }

  const content = editor.document.getText();

  // Get API configuration
  const config = vscode.workspace.getConfiguration('vscode-doc-translator');
  const apiKey = config.get<string>('apiKey', '');
  const apiEndpoint = config.get<string>('apiEndpoint', 'https://api.minimaxi.com/v1');
  const model = config.get<string>('model', 'minimax/text-01');

  if (!apiKey) {
    vscode.window.showInformationMessage('Please configure your API key in VSCode settings (vscode-doc-translator.apiKey).');
    return;
  }

  // Step 1: Language Detection
  const language = detectLanguage(content);

  if (language === 'zh') {
    vscode.window.showInformationMessage('Document is already in Chinese. No translation needed.');
    return;
  }

  if (language === 'unknown') {
    vscode.window.showInformationMessage('Could not detect document language.');
    return;
  }

  // Step 2: Check if translated file exists
  const translatedPath = getTranslatedPath(filePath);
  const existingTranslation = fs.existsSync(translatedPath);

  if (existingTranslation) {
    const choice = await vscode.window.showInformationMessage(
      'Translation already exists. Open it?',
      'Open Translation',
      'Re-translate'
    );

    if (choice === 'Open Translation') {
      const doc = await vscode.workspace.openTextDocument(translatedPath);
      await vscode.window.showTextDocument(doc);
      return;
    }
    // If 'Re-translate', continue to translate
  }

  // Step 3: Chunk document
  const chunks = chunkDocument(content);

  // Step 4: Translate with progress
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Translating document',
      cancellable: false
    },
    async (progress) => {
      try {
        const translated = await translateChunks(
          chunks,
          apiKey,
          apiEndpoint,
          model,
          (current, total) => {
            progress.report({
              message: `Translating chunk ${current + 1} of ${total}...`,
              increment: (1 / total) * 100
            });
          }
        );

        // Step 5: Save to .sy directory
        const syDir = path.dirname(translatedPath);
        if (!fs.existsSync(syDir)) {
          fs.mkdirSync(syDir, { recursive: true });
        }
        fs.writeFileSync(translatedPath, translated, 'utf-8');

        // Step 6: Open translated file
        const doc = await vscode.workspace.openTextDocument(translatedPath);
        await vscode.window.showTextDocument(doc);

        vscode.window.showInformationMessage(`Translation saved to: ${path.basename(translatedPath)}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Translation failed: ${message}`);
      }
    }
  );
}
