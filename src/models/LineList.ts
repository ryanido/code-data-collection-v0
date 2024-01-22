import LineNode from "./LineNode";
import { EditEvent, EditEventType } from "./EditEvent";
const lev = require("js-levenshtein");
const AUTO_COMPLETE_CHARACTER_THRESHHOLD = 15;

export default class LineList {
  private head: LineNode | null;
  private tail: LineNode | null;
  private completes: number[] = [];

  constructor() {
    this.head = new LineNode({
      singleCharactersEntered: 0,
      numberOfCharactersPasted: 0,
      thinkingTime: 0,
      editingTime: 0,
      content: "",
    });
    this.tail = this.head;
  }

  //Function that consumes an EditEvent and updates the list
  consumeEditEvent(event: EditEvent) {
    console.log("NEW EVENT TO LIST:", event);
    let node: LineNode;
    console.log("EVENT TYPE:", event.type);
    switch (event.type) {
      case EditEventType.add:
        console.log("ADD EVENT");
        if (event.pasted) {
          this.completes.push(event.content.length);
        }
        node = new LineNode({
          singleCharactersEntered: event.pasted ? 0 : event.content.length,
          numberOfCharactersPasted: event.pasted ? event.content.length : 0,
          thinkingTime: 0,
          editingTime: 0,
          content: event.content,
        });
        this.insert(node, event.line);
        break;
      case EditEventType.delete:
        this.delete(event.line);
        break;
      case EditEventType.modify:
        if (this.get(event.line) !== null) {
          node = this.get(event.line)!;
          let charactersAltered =
            lev(node.content, event.content) -
            Math.max(0, node.content.length - event.content.length);
          if (event.pasted) {
            this.completes.push(charactersAltered);
            node.numberOfCharactersPasted += charactersAltered;
          } else {
            node.singleCharactersEntered += charactersAltered;
          }
          node.content = event.content;
        } else {
          throw new Error("Line not found");
        }
        break;
      default:
        throw new Error("Invalid event type");
    }
  }

  get(position: number) {
    let current = this.head;
    let index = 0;
    while (current !== null && index < position) {
      current = current.next;
      index++;
    }
    return current;
  }

  insert(node: LineNode, position: number) {
    console.log("ADD NODE TO LIST", node, "AT POSITION", position);
    if (position === 0) {
      node.next = this.head;
      this.head = node;
      if (this.tail === null) {
        this.tail = node;
      }
      return;
    }
    const prev = this.get(position - 1);
    if (prev === null) {
      return;
    }
    node.next = prev.next;
    prev.next = node;
    if (this.tail === prev) {
      this.tail = node;
    }
  }

  delete(position: number) {
    if (position === 0) {
      this.head = this.head?.next || null;
      if (this.head === null) {
        this.tail = null;
      }
      return;
    }
    const prev = this.get(position - 1);
    if (prev === null || prev.next === null) {
      return;
    }
    prev.next = prev.next.next;
    if (prev.next === null) {
      this.tail = prev;
    }
  }

  toString() {
    let current = this.head;
    let str = "";
    let index = 0;
    while (current !== null) {
      str +=
        index++ +
        " | " +
        current.content +
        " | " +
        current.numberOfCharactersPasted +
        ":" +
        current.singleCharactersEntered +
        "\n";
      current = current.next;
    }
    return str;
  }
}
