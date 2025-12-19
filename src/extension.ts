import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as path from 'path';

import * as fs from 'fs';

let panel:vscode.WebviewPanel | undefined;
let method: any;




class JavaCodeLensProvider implements vscode.CodeLensProvider {
    private javaProjectClasspath: string | undefined;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;

        // Register a workspace listener to update classpath when the workspace changes
        vscode.workspace.onDidChangeWorkspaceFolders(() => this.updateJavaClasspath());
        this.updateJavaClasspath();
    }

    private updateJavaClasspath() {
        this.javaProjectClasspath = getJavaClasspath(this.context);
    }

    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        const currentFilePath = document.uri.fsPath;
        const jarPath = path.join(this.context.extensionPath, 'cat.jar');
        const javaOptions = ['-jar', jarPath, '-allMethods', currentFilePath];
        if (this.javaProjectClasspath) {
            javaOptions.push('-classpath', this.javaProjectClasspath);
        }

        try {
            // Executing cat.jar to retrieve all the methods in the current open file.
            const output = child_process.execSync(
                `java  ${javaOptions.join(' ')}`,
                { encoding: 'utf-8' }
            );

            // The output is a JSON array directly (not wrapped in {methods: ...})
            const methodDeclarations = JSON.parse(output);

            const codeLenses: vscode.CodeLens[] = methodDeclarations.flatMap((methodd: any) => {
                const startLine = Number(methodd.lineStart) - 1;
                const range = new vscode.Range(
                    new vscode.Position(startLine, 0),
                    new vscode.Position(startLine, Number.MAX_VALUE)
                );

                const viewCallgraphLens = new vscode.CodeLens(
                    range,
                    {
                        title: '$(type-hierarchy) Callgraph',
                        command: 'cat.viewCallGraph',
                        arguments: [methodd, jarPath, this.javaProjectClasspath, currentFilePath],
                    }
                );

                return [viewCallgraphLens];
            });

            return codeLenses;
        } catch (error) {
            console.error('Error executing CAT:', error);
            return [];
        }
    }

    resolveCodeLens?(codeLens: vscode.CodeLens, token: vscode.CancellationToken): vscode.CodeLens | Thenable<vscode.CodeLens> {
        return codeLens;
    }
}

// Utility function to get Java classpath
function getJavaClasspath(context: vscode.ExtensionContext): string | undefined {
    let javaLanguageClient: any;

    // Check if Red Hat Java extension is installed
    const redHatJavaExtension = vscode.extensions.getExtension('java');
    if (redHatJavaExtension) {
        javaLanguageClient = redHatJavaExtension.exports;
    }

    // If Red Hat Java extension is not found, check for Microsoft Java Extension Pack
    if (!javaLanguageClient) {
        const msJavaExtensionPack = vscode.extensions.getExtension('vscode-java-pack');
        if (msJavaExtensionPack) {
            javaLanguageClient = msJavaExtensionPack.exports;
        }
    }

    // If a Java language client is found, return the classpath
    if (javaLanguageClient) {
        return javaLanguageClient.getActiveJavaProjects().flatMap((project: { classpaths: any; }) =>
            project.classpaths
        ).join(path.delimiter);
    } else {
        return undefined;
    }
}


vscode.commands.registerCommand('cat.viewCallGraph', viewCallGraphHandler);

function viewCallGraphHandler(methodd: any, jarPath: string, javaProjectClasspath: string | undefined, currentFilePath: string) {
    method = methodd;
    const javaOptions = ['-jar', jarPath, currentFilePath, '-entryPoint', method.packageName, method.name];

    if (javaProjectClasspath) {
        javaOptions.push('-classpath', javaProjectClasspath);
    }

    try {
        const output = child_process.execSync(
            `java  ${javaOptions.join(' ')}`,
            { encoding: 'utf-8' }
        );

        panel = vscode.window.createWebviewPanel(
            'viewCallGraph',
            'Callgraph for ' + method.name,
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        // Get the directory of the current script file
        const scriptDirectory = path.dirname(__filename);

        // Construct the path to the HTML file
        const htmlFilePath = path.join(scriptDirectory, '../', 'index.html');

        const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
        panel.webview.html = htmlContent;

        panel.webview.postMessage({ command: 'showCallgraph', data: output });
    } catch (error) {
        vscode.window.showErrorMessage('Error generating callgraph: ' + error);
    }
}

export function activate(context: vscode.ExtensionContext) {
    const javaCodeLensProvider = vscode.languages.registerCodeLensProvider(
        { language: 'java' },
        new JavaCodeLensProvider(context)
    );
    context.subscriptions.push(javaCodeLensProvider);
    // Listen for changes in the active text document
    vscode.workspace.onDidSaveTextDocument((document) => {
        if (vscode.window.activeTextEditor && document === vscode.window.activeTextEditor.document) {
            // Run your analysis and update the call graph view
            updateCallGraph(context);
        }
    });


}

function updateCallGraph(context: vscode.ExtensionContext) {
    // Get the current file path
    const currentFilePath = vscode.window.activeTextEditor?.document.uri.fsPath;
    if (!currentFilePath || !method) {
        return;
    }

    // Use the child_process module to run the cat.jar and capture its output
    const jarPath = path.join(context.extensionPath, 'cat.jar');

    const javaOptions = ['-jar', jarPath, currentFilePath, '-entryPoint', method.packageName, method.name];

    const javaProjectClasspath = getJavaClasspath(context);
    if (javaProjectClasspath) {
        javaOptions.push('-classpath', javaProjectClasspath);
    }

    try {
        // Execute the cat.jar with the specified options and the classpath
        const output = child_process.execSync(
            `java  ${javaOptions.join(' ')}`,
            { encoding: 'utf-8' }
        );

        if (panel && panel.webview) {
            panel.webview.postMessage({ command: 'updateCallgraph', data: output });
        }
    } catch (error) {
        console.error('Error updating callgraph:', error);
    }
}

exports.activate = activate;


function getWebviewContent(extensionPath:string) : string {
    try {
    const indexPath = path.join(extensionPath, 'index.html');
    let content = fs.readFileSync(indexPath, 'utf-8');
    return content;
    } catch (error) {
    console.error(`Error reading files: ${error}`);
    return `<html><body>Error reading files</body></html>`;
    }
}