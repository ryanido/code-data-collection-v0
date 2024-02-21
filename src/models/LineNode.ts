import { EditEvent } from "./EditEvent";

export default class LineNode {
    singleCharactersEntered: number;
    numberOfCharactersPasted: number;
    content: string;
    next: LineNode | null;
    events: EditEvent[];
  
    constructor(data: {
      singleCharactersEntered: number;
      numberOfCharactersPasted: number;
      content: string;
      event?: EditEvent;
    }) {
      this.singleCharactersEntered = data.singleCharactersEntered;
      this.numberOfCharactersPasted = data.numberOfCharactersPasted;
      this.content = data.content;
      this.next = null;
      this.events = data.event ? [data.event] : [];
    }
  }