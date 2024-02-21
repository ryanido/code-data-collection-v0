import LineNode from "./LineNode";
import { EditEvent, EditEventType } from "./EditEvent";
const lev = require("js-levenshtein");
const AUTO_COMPLETE_CHARACTER_THRESHHOLD = 15;

export default class LineList {
  private head: LineNode | null;
  private tail: LineNode | null;
  private events: EditEvent[] = [];

  constructor() {
    this.head = new LineNode({
      singleCharactersEntered: 0,
      numberOfCharactersPasted: 0,
      content: "",
     });
    this.tail = this.head;
    this.events = [];
  }

  //Function that consumes an EditEvent and updates the list
  consumeEditEvent(event: EditEvent) {
    console.log("NEW EVENT TO LIST:", event);
    let node: LineNode;
    console.log("EVENT TYPE:", event.type);
    this.events.push(event);
    switch (event.type) {
      case EditEventType.add:
        console.log("ADD EVENT");
        node = new LineNode({
          singleCharactersEntered: event.pasted ? 0 : event.content.length,
          numberOfCharactersPasted: event.pasted ? event.content.length : 0,
          content: event.content,
          event: event,
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
            node.numberOfCharactersPasted += charactersAltered;
          } else {
            node.singleCharactersEntered += charactersAltered;
          }
          if(event.content.length === 0) {
            node.singleCharactersEntered = 0;
            node.numberOfCharactersPasted = 0;
          }
          node.content = event.content;
          node.events.push(event);
        } else {
          throw new Error("Line not found");
        }
        break;
      case EditEventType.initialise:
        let lines = event.content.split(/\r\n|\r|\n/);
        for (let index = 0; index < lines.length; index++) {
          let line = lines[index].replace(/\s/g, '');
          if(index === 0) {
            this.head = new LineNode({
              singleCharactersEntered: line.length,
              numberOfCharactersPasted: 0,
              content: line,
              event: event,
            });
            this.tail = this.head;
            continue;
          }
          node = new LineNode({
            singleCharactersEntered: line.length,
            numberOfCharactersPasted: 0,
            content: line,
            event: event,
          });
          this.insert(node, index);
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

  getPastePercentage() {
    let pasted = 0;
    let single = 0;
    let current = this.head;
    while (current !== null) {
      pasted += current.numberOfCharactersPasted;
      single += current.singleCharactersEntered;
      current = current.next;
    }
    const percentage = (pasted / (pasted + single)) * 100 || 0;
    return percentage;
  }

  getTimeDistribution() {
    if (this.events.length < 2) {
      return {
        thinkingTime: 0,
        editingTime: 0,
      }; // Insufficient data to calculate
    }
  
    let thinkingTime = 0;
    let idleTime = 0;
    let lastEventTime = this.events[0].timestamp;
  
    for (let i = 1; i < this.events.length; i++) {
      const currentTime = this.events[i].timestamp;
      const timeDiff :number = currentTime.getTime() - lastEventTime.getTime(); 
      if (timeDiff > 90 * 1000) { 
        thinkingTime += 90;
        idleTime += timeDiff - 90;
      }
      else if (timeDiff > 15 * 1000) { 
        thinkingTime += timeDiff;
      }
  
      lastEventTime = currentTime; // Update last event time
    }
  
    const totalTime = this.events[this.events.length - 1].timestamp.getTime() - this.events[0].timestamp.getTime();
    const editingTime = totalTime - thinkingTime - idleTime;
    const timeDistribution = {
      thinkingTime: (thinkingTime / totalTime - idleTime) * 100,
      editingTime: (editingTime / totalTime - idleTime) * 100,
    };
    return timeDistribution;  // Return the percentage of thinking time
  }



}
