// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import LineList from "../models/LineList";
import { EditEvent } from "../models/EditEvent";
import { vsCodeEventToEditEvent } from "../models/EventFactory";
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "code-data-collection-v0.helloWorld",
    () => {
      vscode.window.showInformationMessage("Checking code");
    }
  );

  // clear the file
  let editor = vscode.window.activeTextEditor;
  if (editor) {
    editor.edit((editBuilder) => {
      editBuilder.delete(
        new vscode.Range(
          new vscode.Position(0, 0),
          new vscode.Position(100000, 100000)
        )
      );
    });
  }

  let lineList = new LineList();

  vscode.workspace.onDidChangeTextDocument(
    (e: vscode.TextDocumentChangeEvent) => {
      console.log("CHANGE:", e, e.contentChanges[0].range.start.line, e.contentChanges[0].range.end.line);
      editor = vscode.window.activeTextEditor;
      if (editor) {
        let events: EditEvent[] = vsCodeEventToEditEvent(e, editor);
        events.forEach((event) => {
          console.log(event);
          lineList.consumeEditEvent(event);
        });
        console.log(lineList.toString());
      }}
  );

  vscode.window.onDidChangeTextEditorSelection(
    (e: vscode.TextEditorSelectionChangeEvent) => {
      // console.log("SELECT:",e);
    }
  );


  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
