import LineNode from "./LineNode";
import { EditEvent, EditEventType } from "./EditEvent";
const lev = require("js-levenshtein");
const EDITING_TIME_THRESHOLD = 15 * 1000;
const THINKING_TIME_THRESHHOLD = 600 * 1000;
const CACHE_CHARACTER_THRESHHOLD = 15;
const TIME_BUCKET_SIZE = 5;

export default class LineList {
  private head: LineNode | null;
  private tail: LineNode | null;
  private events: EditEvent[] = [];
  private characterChanges: { [key: string ]: number } = {};
  // cache for lines that have been added already
  private cachedLines :Map<string,LineNode>;

  constructor() {
    this.head = new LineNode({
      singleCharactersEntered: 0,
      numberOfAssistedCharacters: 0,
      content: "",
     });
    this.tail = this.head;
    this.events = [];
    this.cachedLines = new Map<string,LineNode>();
  }

  //Function that consumes an EditEvent and updates the list
  consumeEditEvent(event: EditEvent) {
    // console.log("NEW EVENT TO LIST:", event);
    let node: LineNode | undefined;
    // console.log("EVENT TYPE:", event.type);
    this.events.push(event);
    switch (event.type) {
      case EditEventType.add:
        // console.log("ADD EVENT");
        // check if the line is cached
        if(this.cachedLines.has(event.content)) {
          // console.log("cached line found");
          node = this.cachedLines.get(event.content)?.copy() as LineNode;
        }        
        else {
          node = new LineNode({
            singleCharactersEntered: event.assisted ? 0 : event.content.length,
            numberOfAssistedCharacters: event.assisted ? event.content.length : 0,
            content: event.content,
            events: [event],
          });
        }
        this.insert(node, event.line);
        break;
      case EditEventType.delete:
        const lineNode = this.get(event.line);
        if (lineNode) {
          this.characterChanges[event.timestamp.toString()] += lineNode.content.length;
        }
        this.delete(event.line);
        break;
      case EditEventType.modify:
        if (this.get(event.line) !== null) {
          node = this.get(event.line)!;
          if(node.content === "" && this.cachedLines.has(event.content))
          {
            node = this.cachedLines.get(event.content)?.copy() as LineNode;
            this.delete(event.line);
            this.insert(node, event.line);
          } else{
            let charactersAltered =
            lev(node.content, event.content) -
            Math.max(0, node.content.length - event.content.length);
          this.characterChanges[event.timestamp.toString()] += charactersAltered;
          if (event.assisted) {
            node.numberOfAssistedCharacters += charactersAltered;
          } else {
            node.singleCharactersEntered += charactersAltered;
          }
          if(event.content.length === 0) {
            node.singleCharactersEntered = 0;
            node.numberOfAssistedCharacters = 0;
          }
          node.content = event.content;
          node.events.push(event);
          }
        } else {
          throw new Error("Line not found");
        }
        break;
      case EditEventType.initialise:
        let lines = event.content.split(/\r\n|\r|\n/);
        for (let index = 0; index < lines.length; index++) {
          let line = lines[index].replace(/\s/g, '');
          node = new LineNode({
            singleCharactersEntered: line.length,
            numberOfAssistedCharacters: 0,
            content: line,
            events: [event],
          });
          if (node.content.length > CACHE_CHARACTER_THRESHHOLD) {
            this.cachedLines.set(node.content, node.copy());
          }
          this.insert(node, index);
        }
        break;
      default:
        throw new Error("Invalid event type");
    }
    if(node !== undefined) {
      if (node.content.length > CACHE_CHARACTER_THRESHHOLD) {
        this.cachedLines.set(node.content, node.copy());
      }
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
    // console.log("ADD NODE TO LIST", node, "AT POSITION", position);
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
        current.numberOfAssistedCharacters +
        ":" +
        current.singleCharactersEntered +
        "\n";
      current = current.next;
    }
    return str;
  }

  // Function to get the percentage of assisted characters in the user's activity
  // Note: Only checks lines that are still present in the file
  getAssistedTextPercentage() {
    let assisted = 0;
    let single = 0;
    let current = this.head;
    while (current !== null) {
      assisted += current.numberOfAssistedCharacters;
      single += current.singleCharactersEntered;
      current = current.next;
    }
    const percentage = (assisted / (assisted + single)) * 100 || 0;
    return percentage;
  }

  // Function to get the time distribution of the user's activity
  // Criteria: If the time between two events is greater than EDITING_TIME_THRESHOLD(milliseconds), it is considered thinking time
  // If the time between two events is greater than THINKING_TIME_THRESHHOLD(milliseconds), it is considered idle time
  // The rest of the time is considered editing time
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
    let totalTime = 0;
  
    for (let i = 1; i < this.events.length; i++) {
      const currentTime = this.events[i].timestamp;
      const timeDiff :number = currentTime.getTime() - lastEventTime.getTime(); 
      if (timeDiff > THINKING_TIME_THRESHHOLD) { 
        thinkingTime += THINKING_TIME_THRESHHOLD;
        idleTime += timeDiff - THINKING_TIME_THRESHHOLD;
      }
      else if (timeDiff > EDITING_TIME_THRESHOLD) { 
        thinkingTime += timeDiff;
      }
  
      lastEventTime = currentTime; // Update last event time
      totalTime += timeDiff;
    }
  
    const editingTime = totalTime - thinkingTime - idleTime;
    const timeDistribution = {
      thinkingTime: (thinkingTime / (totalTime - idleTime)) * 100,
      editingTime: (editingTime / (totalTime - idleTime)) * 100,
    };
    return timeDistribution;  // Return the percentage of thinking time
  }
  
  // Function to get the coefficient of variation of the time between events
  // Formula: sqrt(variance) / mean
  getCoefficientOfVariation() {
    if(this.events.length < 2) {
      return 0;
    }
    let timeDifferences = [];
    let lastEventTime = this.events[0].timestamp;
    for (let i = 1; i < this.events.length; i++) {
      const currentTime = this.events[i].timestamp;
      timeDifferences.push(currentTime.getTime() - lastEventTime.getTime());
      lastEventTime = currentTime;
    }
    let mean = timeDifferences.reduce((a, b) => a + b) / timeDifferences.length;
    let standardDeviation = Math.sqrt( timeDifferences.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (timeDifferences.length-1) );
    return Math.sqrt(standardDeviation) / mean;
  }

// Function to get the number of events per time bucket
  getEventsPerBucket() {
    const firstEventTime = this.events[0].timestamp;
    const lastEventTime = this.events[this.events.length - 1].timestamp;
    const timeDiff = (lastEventTime.getTime() - firstEventTime.getTime()) / 1000;
    const numBuckets = Math.floor(timeDiff / TIME_BUCKET_SIZE) + 1;
    const eventsPerBucket = new Array(numBuckets).fill(0);
    for (const event of this.events) {
      const bucketIndex = Math.floor((event.timestamp.getTime() - firstEventTime.getTime()) / TIME_BUCKET_SIZE / 1000);
      eventsPerBucket[bucketIndex] += 1;
    }
    return eventsPerBucket.filter((value) => value > 0);
  }

  getCharacterChangesPerBucket() {
    const firstEventTime = this.events[0].timestamp;
    const lastEventTime = this.events[this.events.length - 1].timestamp;
    const timeDiff = (lastEventTime.getTime() - firstEventTime.getTime()) / 1000;
    const numBuckets = Math.floor(timeDiff / TIME_BUCKET_SIZE) + 1;
    const characterChangesPerBucket = new Array(numBuckets).fill(0);
    for (const event of this.events) {
      const bucketIndex = Math.floor((event.timestamp.getTime() - firstEventTime.getTime()) / TIME_BUCKET_SIZE / 1000);
      characterChangesPerBucket[bucketIndex] += this.characterChanges[event.timestamp.toString()];
    }
    const mean = characterChangesPerBucket.reduce((a, b) => a + b) / characterChangesPerBucket.length;
    return mean;
  }


  getFanoFactor() {
    const data = this.getEventsPerBucket();

    // console.log("DATA:", data);
    if (data.length === 0) {
      return null;
    }

    const mean = data.reduce((a, b) => a + b) / data.length;
    const variance = data.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (data.length - 1);

    // console.log("MEAN:", mean);
    // console.log("VARIANCE:", variance);

    // Avoid division by zero
    if (mean === 0) {
      return null;
    }

    const fanoFactor = variance / mean;
    // console.log("FANO FACTOR:", fanoFactor);
    return fanoFactor;
  }
  // Function that writes the LineList Object to a json file
  toJSON() {
    let content = "";
    for (let current = this.head; current !== null; current = current.next) {
      content += current.content + "\n";
    }
    let object = {
      content: content,
      events: this.events,
      pastePercentage: this.getAssistedTextPercentage(),
      timeDistribution: this.getTimeDistribution(),
      fanoFactor: this.getFanoFactor(),
    };
    let json = JSON.stringify(object, null, 2);
    return json;
  }

}
