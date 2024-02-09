import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as path from 'path';
import WebSocket from 'ws';
import * as fs from 'fs';
import * as http from 'http';
import ws from 'ws';

let panel:vscode.WebviewPanel | undefined;
let method: any;
const server = http.createServer();
const wss = new ws.Server({ server });

wss.on('connection', (ws) => {
    console.log('WebSocket connected');

    // Handle messages from the webview
    ws.on('message', (message) => {
        console.log(`Received message from webview: ${message}`);
    });
});

server.listen(3000); 


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
        // Get the classpath for the active Java project
        const javaLanguageClient = vscode.extensions.getExtension('redhat.java')?.exports;
        if (javaLanguageClient) {
            this.javaProjectClasspath = javaLanguageClient.getActiveJavaProjects().flatMap((project: { classpaths: any; }) =>
                project.classpaths
            ).join(path.delimiter);
        } else {
            this.javaProjectClasspath = undefined;
        }
    }

    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        const currentFilePath = document.uri.fsPath;
        const jarPath = path.join(this.context.extensionPath, 'cat.jar');
        const javaOptions = ['-jar', jarPath,  '-allMethods', currentFilePath, '-vscode'];
        if(this.javaProjectClasspath) {
            javaOptions.push('-classpath', this.javaProjectClasspath);
        }
        // Executing cat.jar to retrive all the methods in the current open file.
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

    // Executing cat.jar to retrive the callgraph information
    const output = child_process.execSync(
        `java  ${javaOptions.join(' ')}`,
        { encoding: 'utf-8' }
    );

    // if (panel && panel.webview && panel.dispose) {
    //     console.log("Panel is not disposed %b", !panel.dispose() )
    //     panel.webview.postMessage({ command: 'updateCallgraph', data: output });
    // } else {
        // console.log("Panel is disposed");
        // Otherwise, create and show a new webview
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

    // Read the HTML file content
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');

    // Set the HTML content in the webview
    panel.webview.html = htmlContent;

    panel.webview.postMessage({ command: 'showCallgraph', data: output });
    }

export function activate(context: vscode.ExtensionContext) {
    const javaCodeLensProvider = vscode.languages.registerCodeLensProvider(
        { language: 'java' },
        new JavaCodeLensProvider(context)
    );
    context.subscriptions.push(javaCodeLensProvider);
    const websocketUrl = 'http://localhost:3000';
    // Listen for changes in the active text document
    vscode.workspace.onDidSaveTextDocument((document) => {
        if (vscode.window.activeTextEditor && document === vscode.window.activeTextEditor.document) {
            // Run your analysis and update the call graph view
            updateCallGraph(context, websocketUrl);
        }
    });


}

function updateCallGraph(context: vscode.ExtensionContext, websocketUrl: string) {
    // Get the current file path
    const currentFilePath = vscode.window.activeTextEditor?.document.uri.fsPath;
    if (!currentFilePath) {
        return;
    }

    // Use the child_process module to run the cat.jar and capture its output
    const jarPath = path.join(context.extensionPath, 'cat.jar');

    const javaOptions = ['-jar', jarPath, currentFilePath, '-entryPoint', method.packageName, method.name, '-vscode'];

    const javaLanguageClient = vscode.extensions.getExtension('redhat.java')?.exports;
    const javaProjectClasspath = javaLanguageClient?.getActiveJavaProjects().flatMap((project: { classpaths: any; }) =>
        project.classpaths
    ).join(path.delimiter);

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


function getWebviewContent(extensionPath:string, websocketUrl:string) : string {
  try {
    // Read the content of index.html file
    const indexPath = path.join(extensionPath, 'index.html');
    let content = fs.readFileSync(indexPath, 'utf-8');
    // content = content.replace('{{websocketUrl}}', websocketUrl);

    return content;
  } catch (error) {
    console.error(`Error reading files: ${error}`);
    return `<html><body>Error reading files</body></html>`;
  }
  
}