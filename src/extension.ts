// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {Global} from "./global";
import CompletionItemProvider from "./features/completionItemProvider";
import DefinitionProvider from "./features/definitionProvider";
import DocumentSymbolProvider from "./features/documentSymbolProvider";
import ReferenceProvider from "./features/referenceProvider";
import { showHideStatus, BSL_MODE } from "./features/bslStatus";
import BslLintProvider from "./features/bsllintProvider";

let diagnosticCollection: vscode.DiagnosticCollection;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
    console.log("Congratulations, your extension 'language-1c-bsl' is now active!");

    const global = new Global("global");
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(["bsl", "bsl"], new CompletionItemProvider(global), ".", "="));
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(["bsl", "bsl"], new DefinitionProvider(global)));
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(["bsl", "bsl"], new DocumentSymbolProvider(global)));
    context.subscriptions.push(vscode.languages.registerReferenceProvider(["bsl", "bsl"], new ReferenceProvider(global)));
    let linter = new BslLintProvider();
    linter.activate(context.subscriptions);

    context.subscriptions.push(vscode.commands.registerCommand("bsl.update", () => {
        let filename = vscode.window.activeTextEditor.document.fileName;
        global.updateCache(filename);
    }));

    diagnosticCollection = vscode.languages.createDiagnosticCollection("bsl");
    context.subscriptions.push(diagnosticCollection);
    vscode.window.onDidChangeActiveTextEditor(showHideStatus, null, context.subscriptions);

    vscode.languages.setLanguageConfiguration("bsl", {
        indentationRules: {
            decreaseIndentPattern: /^\s*(конецесли|конеццикла|конецпроцедуры|конецфункции|иначе|иначеесли|конецпопытки|исключение|endif|enddo|endprocedure|endfunction|else|elseif|endtry|except).*$/i,
            increaseIndentPattern: /^\s*(пока|процедура|функция|если|иначе|иначеесли|попытка|исключение|для|while|procedure|function|if|else|elseif|try|for)[^;]*$/i
        },
        comments: {
            lineComment: "//"
        },
        onEnterRules: [
            {
                beforeText: /^\s*\|([^\"]|"[^\"]*")*$/,
                action: { indentAction: vscode.IndentAction.None, appendText: "|" }
            },
            {
                beforeText: /^([^\|\"]|"[^\"]*")*\"[^\"]*$/,
                action: { indentAction: vscode.IndentAction.None, appendText: "|" }
            }
        ]
    });

    vscode.languages.setLanguageConfiguration("sdbl", {

        comments: {
            lineComment: "//"
        }
    });

    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(function (textEditor: vscode.TextEditor) {
        applyConfigToTextEditor(textEditor);
    }));
}

function applyConfigToTextEditor(textEditor: vscode.TextEditor): any {

    if (!textEditor) {
        return ;
    };
    let  newOptions: vscode.TextEditorOptions = {
        "insertSpaces" : false,
        "tabSize" : 4
    };

    let defaultOptions: vscode.TextEditorOptions = {
        "insertSpaces" : Boolean(vscode.workspace.getConfiguration("editor").get("insertSpaces")),
        "tabSize" : Number(vscode.workspace.getConfiguration("editor").get("tabSize"))
    };

    if (vscode.languages.match(BSL_MODE, textEditor.document)) {
        if (textEditor.options.insertSpaces === defaultOptions.insertSpaces
            && (textEditor.options.tabSize === defaultOptions.tabSize || defaultOptions.tabSize > 0)) {
                textEditor.options = newOptions;
        } else if (textEditor.options.insertSpaces === newOptions.insertSpaces && textEditor.options.tabSize === newOptions.tabSize) {
            textEditor.options = defaultOptions;
        }
    }
}