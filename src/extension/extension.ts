// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import LineList from "../models/LineList";
import { EditEvent, EditEventType } from "../models/EditEvent";
import { vsCodeEventToEditEvent } from "../models/EventFactory";
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
const PASTED_THRESHOLD = 50;
const THINKING_TIME_THRESHHOLD = 50;
const COEFFICIENT_OF_VARIATION_THRESHOLD = 1;
let lineList = new LineList();

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "code-data-collection-v0" is now active!');
  let disposable = vscode.commands.registerCommand(
    "code-data-collection-v0.helloWorld",
    () => {
      vscode.window.showInformationMessage("Checking code");
    }
  );

  let disposable2 = vscode.commands.registerCommand(
    "code-data-collection-v0.generateReport",
    () => {
      vscode.window.showInformationMessage("Generated report");
      deactivate();
    }
  );

  // clear the file
  let editor = vscode.window.activeTextEditor;
  let initialiseEvent = new EditEvent(
    0,
    EditEventType.initialise,
    new Date(),
    editor?.document.getText() || "",
    false
  );
  lineList.consumeEditEvent(initialiseEvent);
  // console.log(lineList.toString());

  // Add something in the status bar
  let pastePercentageStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );

// Every time the user types something, the status bar will be updated
  pastePercentageStatusBarItem.show();
  pastePercentageStatusBarItem.text = "Pastes" + 0 + "%";

  let timeDistributionStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  timeDistributionStatusBarItem.show();
  timeDistributionStatusBarItem.text = "Edit time: N/A Idle time: N/A ";

  let coefficientOfVariationStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  coefficientOfVariationStatusBarItem.show();
  coefficientOfVariationStatusBarItem.text = "Coefficient of variation: N/A";


  vscode.workspace.onDidChangeTextDocument(
    (e: vscode.TextDocumentChangeEvent) => {
      // console.log(
      //   "CHANGE:",
      //   e,
      //   e.contentChanges[0].range.start.line,
      //   e.contentChanges[0].range.end.line
      // );
      editor = vscode.window.activeTextEditor;
      if (editor) {
        let events: EditEvent[] = vsCodeEventToEditEvent(e, editor);
        events.forEach((event) => {
          // console.log(event);
          lineList.consumeEditEvent(event);
        });
        // console.log(lineList.toString());
        updateStatusBarItems(pastePercentageStatusBarItem, timeDistributionStatusBarItem, coefficientOfVariationStatusBarItem, lineList);
      }
    }
  );

  vscode.window.onDidChangeTextEditorSelection(
    (e: vscode.TextEditorSelectionChangeEvent) => {
      // console.log("SELECT:",e);
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(disposable2);
}

function updateStatusBarItems(pastePercentageStatusBarItem: vscode.StatusBarItem, timeDistributionStatusBarItem: vscode.StatusBarItem, coefficientOfVariationStatusBarItem: vscode.StatusBarItem, lineList: LineList) {

  let pastePercentage = lineList.getPastePercentage();
  pastePercentageStatusBarItem.text = "Pastes : " + pastePercentage.toFixed() + "%";
  if (pastePercentage > PASTED_THRESHOLD) {
    pastePercentageStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
  } else {
    pastePercentageStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.defaultBackground');
  }

  let timeDistribution = lineList.getTimeDistribution();
  timeDistributionStatusBarItem.text = "Edit time: " + timeDistribution.editingTime.toFixed() + "% Thinking time: " + timeDistribution.thinkingTime.toFixed() + "%";
  if (timeDistribution.thinkingTime < THINKING_TIME_THRESHHOLD) {
    timeDistributionStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
  }
  else {
    timeDistributionStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.defaultBackground');
  }
  
  let coefficientOfVariation = lineList.getCoefficientOfVariation();
  coefficientOfVariationStatusBarItem.text = "Coefficient of variation: " + coefficientOfVariation.toFixed(3);
  if (coefficientOfVariation > COEFFICIENT_OF_VARIATION_THRESHOLD) {
    coefficientOfVariationStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
  }
  else {
    coefficientOfVariationStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.defaultBackground');
  }
}

function generateReport() {
  // write the lineList to a file(JSON)
  let json = lineList.toJSON();
  let uri = vscode.Uri.parse("untitled:" + "code-data-collection.json");
  vscode.workspace.openTextDocument(uri).then((doc) => {
    let edit = new vscode.WorkspaceEdit();
    edit.insert(uri, new vscode.Position(0, 0), json);
    return vscode.workspace.applyEdit(edit).then((success) => {
      if (success) {
        vscode.window.showTextDocument(doc);
      } else {
        vscode.window.showInformationMessage("Error!");
      }
    });
  });
}

// This method is called when your extension is deactivated
export function deactivate() {
  generateReport();
  console.log("Deactivated");
}
