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
        const javaOptions = ['-jar', jarPath, '-allMethods', currentFilePath, '-vscode'];
        if (this.javaProjectClasspath) {
            javaOptions.push('-classpath', this.javaProjectClasspath);
        }

        // Executing cat.jar to retrieve all the methods in the current open file.
        const output = child_process.execSync(
            `java  ${javaOptions.join(' ')}`,
            { encoding: 'utf-8' }
        );

        const methodDeclarations = JSON.parse(output);

        const codeLenses: vscode.CodeLens[] = methodDeclarations.methods.flatMap((methodd: any) => {
            const startLine = Number(methodd.lineStart) - 1;
            const range = new vscode.Range(
                new vscode.Position(startLine, 0),
                new vscode.Position(startLine, Number.MAX_VALUE)
            );

            const viewCallgraphLens = new vscode.CodeLens(
                range,
                {
                    title: 'Forward Callgraph',
                    command: 'cat.viewCallGraph',
                    arguments: [methodd, jarPath, this.javaProjectClasspath, currentFilePath, false],
                }
            );

            const viewReverseCallgraphLens = new vscode.CodeLens(
                range,
                {
                    title: 'Backwards Callgraph',
                    command: 'cat.viewCallGraph',
                    arguments: [methodd, jarPath, this.javaProjectClasspath, currentFilePath, true],
                }
            );

            return [viewCallgraphLens, viewReverseCallgraphLens];
        });

        return codeLenses;
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

function viewCallGraphHandler(methodd: any, jarPath: string, javaProjectClasspath: string | undefined, currentFilePath: string, isReverse: boolean) {
    method= methodd;
    const javaOptions = ['-jar', jarPath,  currentFilePath, '-entryPoint', method.packageName, method.name, '-vscode'];
    if(isReverse) {
      javaOptions.push('-backward');
    }

    if (javaProjectClasspath) {
        javaOptions.push('-classpath', javaProjectClasspath);
    }

    const output = child_process.execSync(
        `java  ${javaOptions.join(' ')}`,
        { encoding: 'utf-8' }
    );

        panel = vscode.window.createWebviewPanel(
            'viewCallGraph',
            'Callgraph for ' + method.name,
            vscode.ViewColumn.Beside,
            {
                enableScripts: true, // Enable scripts in the webview
                retainContextWhenHidden: true, // Retain the webview content when it's hidden
            }
        );
    // }

    //` Get the directory of the current script file
    const scriptDirectory = path.dirname(__filename);

    // Construct the path to your HTML file (adjust the folder and file names accordingly)
    const htmlFilePath = path.join(scriptDirectory, '../', 'index.html');

    const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
    panel.webview.html = htmlContent;

    panel.webview.postMessage({ command: 'showCallgraph', data: output });
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
    if (!currentFilePath) {
        return;
    }

    // Use the child_process module to run the cat.jar and capture its output
    const jarPath = path.join(context.extensionPath, 'cat.jar');

    const javaOptions = ['-jar', jarPath, currentFilePath, '-entryPoint', method.packageName, method.name, '-vscode'];


    const javaProjectClasspath =  getJavaClasspath(context);
    console.log(javaProjectClasspath);
    if (javaProjectClasspath) {
        javaOptions.push('-classpath', javaProjectClasspath);
    }

    console.log("Running: " + javaOptions.join(' ') + " in " + process.cwd());

    // Execute the cat.jar with the specified options and the classpath
    const output = child_process.execSync(
        `java  ${javaOptions.join(' ')}`,
        { encoding: 'utf-8' }
    );

    console.log(output);

    if (panel && panel.webview) {
        console.log(!panel.dispose)
        panel.webview.postMessage({ command: 'updateCallgraph', data: output });
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