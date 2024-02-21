import { EditEvent, EditEventType } from "./EditEvent";
import * as vscode from "vscode";

export function vsCodeEventToEditEvent(event: vscode.TextDocumentChangeEvent, editor: vscode.TextEditor) {
    let events: EditEvent[] = [];
    for (let index = 0; index < event.contentChanges.length; index++) {
      let startLine: number = event.contentChanges[index].range.start.line;
      let endLine: number = event.contentChanges[index].range.end.line;
      let lines: string[] = event.contentChanges[index].text.split(/\r\n|\r|\n/);
      var content;
      // If the start and end line are the same, then the user modified a single line or pasted multiple lines
      if(startLine === endLine) {
        console.log(lines);
        for(let i = 0; i < lines.length; i++) {
          let line = startLine + i;
          content = editor.document.lineAt(line).text.replace(/\s/g, '');
          if(line === startLine){
            console.log("MODIFY EVENT AT LINE: ", line, " WITH CONTENT: ", content, " AND PASTED: ", lines[i].length > 1 ? "TRUE" : "FALSE");
            events.push(
              new EditEvent(
                line,
                EditEventType.modify,
                new Date(),
                content,
                lines[i].length > 1
              )
            );
          } else {
            console.log("ADD EVENT AT LINE: ", line, " WITH CONTENT: ", lines[i], " AND PASTED: ", lines[i].length > 1 ? "TRUE" : "FALSE");
            events.push(
              new EditEvent(
                line,
                EditEventType.add,
                new Date(),
                content,
                lines[i].length > 1
              )
            );
          }
        }
      } else {
        // If the start and end line are different, then the user deleted lines or replaced multiple lines
        console.log(lines);
        for(let i = endLine - startLine; i >= 0; i--) {
          const line = i + startLine;
          if(i === 0) {
            content = editor.document.lineAt(line).text.replace(/\s/g, '');
            console.log("MODIFY EVENT AT LINE: ", line, " WITH CONTENT: ", content, " AND PASTED: ", lines[i].length > 1);
            events.push(
              new EditEvent(
                line,
                EditEventType.modify,
                new Date(),
                content,
                lines[i].length > 1
              )
            );
          } else {
            console.log("DELETE EVENT AT LINE: ", line, " AND PASTED: ", false);
            events.push(
              new EditEvent(
                line,
                EditEventType.delete,
                new Date(),
                "",
                false
              )
            );
          }
        }
        for(let i = 1; i < lines.length; i++) {
          let line = startLine + i;
          content = lines[i].replace(/\s/g, '');
          console.log("ADD EVENT AT LINE: ", line, " WITH CONTENT: ", content, " AND PASTED: ", "TRUE");
              events.push(
                new EditEvent(
                  line,
                  EditEventType.add,
                  new Date(),
                  content,
                  true
                )
              );
        }
      };
    }
    return events;
  }
