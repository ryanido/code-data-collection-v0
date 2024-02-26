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
      events?: EditEvent[];
    }) {
      this.singleCharactersEntered = data.singleCharactersEntered;
      this.numberOfCharactersPasted = data.numberOfCharactersPasted;
      this.content = data.content;
      this.next = null;
      this.events = data.events ? data.events : [];
    }

    copy(): LineNode {
      return new LineNode({
        singleCharactersEntered: this.singleCharactersEntered,
        numberOfCharactersPasted: this.numberOfCharactersPasted,
        content: this.content,
        events: this.events,
      });
    }
  }