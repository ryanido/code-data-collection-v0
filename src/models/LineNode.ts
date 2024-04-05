import { EditEvent } from "./EditEvent";

export default class LineNode {
    singleCharactersEntered: number;
    numberOfAssistedCharacters: number;
    content: string;
    next: LineNode | null;
    events: EditEvent[];
  
    constructor(data: {
      singleCharactersEntered: number;
      numberOfAssistedCharacters: number;
      content: string;
      events?: EditEvent[];
    }) {
      this.singleCharactersEntered = data.singleCharactersEntered;
      this.numberOfAssistedCharacters = data.numberOfAssistedCharacters;
      this.content = data.content;
      this.next = null;
      this.events = data.events ? data.events : [];
    }

    copy(): LineNode {
      return new LineNode({
        singleCharactersEntered: this.singleCharactersEntered,
        numberOfAssistedCharacters: this.numberOfAssistedCharacters,
        content: this.content,
        events: this.events,
      });
    }
  }