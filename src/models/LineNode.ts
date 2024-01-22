export default class LineNode {
    singleCharactersEntered: number;
    numberOfCharactersPasted: number;
    thinkingTime: number;
    editingTime: number;
    content: string;
    next: LineNode | null;
  
    constructor(data: {
      singleCharactersEntered: number;
      numberOfCharactersPasted: number;
      thinkingTime: number;
      editingTime: number;
      content: string;
    }) {
      this.singleCharactersEntered = data.singleCharactersEntered;
      this.numberOfCharactersPasted = data.numberOfCharactersPasted;
      this.thinkingTime = data.thinkingTime;
      this.editingTime = data.editingTime;
      this.content = data.content;
      this.next = null;
    }
  }