// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import LineList from "../models/LineList";
import { EditEvent, EditEventType } from "../models/EditEvent";
import { vsCodeEventToEditEvent } from "../models/EventFactory";
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
const PASTED_THRESHOLD = 50;

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "code-data-collection-v0.helloWorld",
    () => {
      vscode.window.showInformationMessage("Checking code");
    }
  );

  // clear the file
  let editor = vscode.window.activeTextEditor;
  let lineList = new LineList();
  let initialiseEvent = new EditEvent(
    0,
    EditEventType.initialise,
    new Date(),
    editor?.document.getText() || "",
    false
  );
  lineList.consumeEditEvent(initialiseEvent);
  console.log(lineList.toString());

  // Add something in the status bar
  let pastePercentageStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );

// Every time the user types something, the status bar will be updated
  pastePercentageStatusBarItem.show();
  pastePercentageStatusBarItem.text = "Pastes" + 0 + "%";
  pastePercentageStatusBarItem.backgroundColor = '#00FF00';

  let timeDistributionStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  timeDistributionStatusBarItem.show();
  timeDistributionStatusBarItem.text = "Edit time: N/A Idle time: N/A ";
  timeDistributionStatusBarItem.backgroundColor = '#00FF00';


  vscode.workspace.onDidChangeTextDocument(
    (e: vscode.TextDocumentChangeEvent) => {
      console.log(
        "CHANGE:",
        e,
        e.contentChanges[0].range.start.line,
        e.contentChanges[0].range.end.line
      );
      editor = vscode.window.activeTextEditor;
      if (editor) {
        let events: EditEvent[] = vsCodeEventToEditEvent(e, editor);
        events.forEach((event) => {
          console.log(event);
          lineList.consumeEditEvent(event);
        });
        console.log(lineList.toString());
        pastePercentageStatusBarItem.text = "Pastes : " + lineList.getPastePercentage().toFixed() + "%";
        let timeDistribution = lineList.getTimeDistribution();
        timeDistributionStatusBarItem.text = "Edit time: " + timeDistribution.editingTime.toFixed() + "% Thinking time: " + timeDistribution.thinkingTime.toFixed() + "%";
        if (lineList.getPastePercentage() > PASTED_THRESHOLD) {
          pastePercentageStatusBarItem.backgroundColor = "red";
        } else {
          pastePercentageStatusBarItem.backgroundColor  = "green";
        }
      }
    }
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
