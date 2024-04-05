export enum EditEventType {
  add = "add",
  delete = "delete",
  modify = "modify",
  initialise = "initialise",
}

export class EditEvent {
  line: number;
  type: EditEventType;
  timestamp: Date;
  content: string;
  assisted: boolean;

  constructor(line: number, type: EditEventType, timestamp: Date, content: string, assisted: boolean) {
    this.line = line;
    this.type = type;
    this.timestamp = timestamp;
    this.content = content;
    this.assisted = assisted;
  }
}
