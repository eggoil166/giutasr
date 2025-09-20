import { TSMap } from "typescript-map";

// Types for the chart file structure
export namespace ChartFile {
  export type NoteType = "strum" | "hopo" | "tap";
  export type Timing = BPMChange | TimeSignature;

  export interface BPMChange {
    ms: number;
    raw: string;
    point: number;
    bpm: number; // in BPM
  }

  export interface TimeSignature {
    ms: number;
    raw: string;
    point: number;
    top: number;
    bottom: number;
  }

  export interface Event {
    point: number;
    raw: string;
    ms: number;
    type: string;
    value: string;
  }

  export interface Note {
    ms: number;
    raw: string;
    notes: boolean[]; // length 6 (lanes 0..4 + lane 5=open)
    duration: number[]; // sustain length per lane in ms
    point: number; // tick position
    type: NoteType;
    powered: boolean;
  }

  export interface Notes {
    expert?: Note[];
    hard?: Note[];
    normal?: Note[];
    easy?: Note[];
  }

  export interface Chart {
    timing: Timing[];
    events: Event[];
    notes: Notes;
  }
}

type ChartINI = { [section: string]: { [key: string]: string[] } };

export const getMeasureLengthMS = (bpmMS: number) => (60000 / bpmMS) * 4 * 1000;
export const numMeasures = (num: number, res: number) => num / (res * 4);

const getPosMS = (pos: number, timing: TP[], resolution: number) => {
  let tp: TP = { point: 0, ms: 0, measureLength: 0 };
  for (const point of timing) {
    if (point.point < pos) {
      tp = point;
    } else {
      break;
    }
  }
  const numberOfMeasures = numMeasures(pos - tp.point, resolution);
  const distance = tp.measureLength * numberOfMeasures;
  const position = distance + tp.ms;
  return position;
};

const getSustainLength = (
  pos: number,
  duration: number,
  timing: TP[],
  resolution: number
) => {
  let tp: TP = { point: 0, ms: 0, measureLength: 0 };
  for (const point of timing) {
    if (point.point <= pos) {
      tp = point;
    } else {
      break;
    }
  }
  const numberOfMeasures = numMeasures(duration, resolution);
  const distance = tp.measureLength * numberOfMeasures;
  return distance;
};

type TP = {
  point: number;
  ms: number;
  measureLength: number;
};

export const getTiming = (
  data: string[][],
  resolution: number
): [ChartFile.Timing[], TP[]] => {
  const out: ChartFile.Timing[] = [];
  const TPArray: TP[] = [];

  let lastTimingPoint = {
    tp: 0,
    pos: 0,
    measureLength: 0
  };

  for (const timingPoint in data) {
    const events = data[timingPoint];
    for (const event of events) {
      /*
       * BPM Changes
       */
      if (event.match(/B \d+/)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, bpm] = event.split(" ");
        const measureLength = getMeasureLengthMS(parseInt(bpm));
        const numberOfMeasures = numMeasures(
          parseInt(timingPoint) - lastTimingPoint.tp,
          resolution
        );
        const distance = lastTimingPoint.measureLength * numberOfMeasures;
        const position = distance + lastTimingPoint.pos;

        const point: ChartFile.BPMChange = {
          ms: position,
          raw: event,
          point: parseInt(timingPoint),

          bpm: parseInt(bpm) / 1000
        };

        lastTimingPoint = {
          tp: parseInt(timingPoint),
          pos: position,
          measureLength
        };

        out.push(point);
        TPArray.push({
          point: point.point,
          ms: point.ms,
          measureLength
        });
      }
      /*
       * Time Signature Changes
       */
      if (event.match(/TS \d+ *\d*/m)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, top, bottom] = event.split(" ");

        const topNum = parseInt(top);
        const bottomNum = isNaN(parseInt(bottom)) ? 2 : parseInt(bottom);

        const numberOfMeasures = numMeasures(
          parseInt(timingPoint) - lastTimingPoint.tp,
          resolution
        );
        const distance = lastTimingPoint.measureLength * numberOfMeasures;
        const position = distance + lastTimingPoint.pos;

        const point: ChartFile.TimeSignature = {
          ms: position,
          raw: event,
          point: parseInt(timingPoint),

          top: topNum,
          bottom: Math.pow(2, bottomNum)
        };

        out.push(point);
      }
    }
  }
  return [out, TPArray];
};

const getEvents = (
  data: string[][],
  timing: TP[],
  resolution: number
): ChartFile.Event[] => {
  const out: ChartFile.Event[] = [];

  for (const timingPoint in data) {
    const events = data[timingPoint];
    for (const event of events) {
      const eventRegex = event.match(/E "(\S* *)+"/);
      if (eventRegex) {
        const eventText = event.substring(3, event.length - 1);
        const eventType = eventText.split(" ")[0];
        const eventValue = eventText.replace(eventType, "").trim();

        const position = getPosMS(parseInt(timingPoint), timing, resolution);

        const point: ChartFile.Event = {
          point: parseInt(timingPoint),
          raw: event,
          ms: position,

          type: eventType,
          value: eventValue
        };
        out.push(point);
      }
    }
  }

  return out;
};

const getNotes = (
  data: string[][],
  timing: TP[],
  resolution: number
): ChartFile.Note[] => {
  const out: ChartFile.Note[] = [];
  let starPower = {
    startPosition: 0,
    endPosition: 0
  };
  let previousNote: ChartFile.Note = {
    ms: 0,
    raw: "",
    notes: [],
    duration: [],
    point: 0,
    type: "strum",
    powered: false
  };

  for (const timingPoint in data) {
    const notes = data[timingPoint];
    const position = getPosMS(parseInt(timingPoint), timing, resolution);
    let forced = false;

    const point: ChartFile.Note = {
      point: parseInt(timingPoint),
      raw: notes.join("\n"),
      ms: position,

      powered: false,
      notes: [false, false, false, false, false, false],
      type: "strum",
      duration: [0, 0, 0, 0, 0, 0]
    };
    for (const note of notes) {
      if (note.match(/N \d+ \d+/)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, type, duration] = note.split(" ");

        const durationNum = parseInt(duration);

        if (parseInt(type) < 5) {
          point.notes[parseInt(type)] = true;
          if (durationNum > 0) {
            point.duration[parseInt(type)] = getSustainLength(
              point.point,
              durationNum,
              timing,
              resolution
            );
          }
          continue;
        }

        if (parseInt(type) == 7) {
          point.notes[5] = true;
          if (durationNum > 0) {
            point.duration[5] = getSustainLength(
              point.point,
              durationNum,
              timing,
              resolution
            );
          }
          continue;
        }

        if (type == "6") {
          point.type = "tap";
          continue;
        }

        if (type == "5") forced = true;
      }

      /*
       * Star Power
       */
      if (note.match(/S \d+ \d+/)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, __, duration] = note.split(" ");

        starPower = {
          startPosition: point.point,
          endPosition: point.point + parseInt(duration)
        };
      }
    }

    // Hopo or Strum
    point.type = getNoteType(point, previousNote, forced, resolution);
    // Is Powered?
    point.powered =
      point.point >= starPower.startPosition &&
      point.point < starPower.endPosition;
    previousNote = point;
    out.push(point);
  }

  return out;
};

const convertToBitset = (list: boolean[]) => {
  const map = list.map((x) => (x ? 1 : 0));
  let out = 0;
  for (let i = 0; i < map.length; i++) {
    out += Math.pow(map[i] * 2, i);
  }
  return out;
};

const noteCount = (list: boolean[]) => list.filter((x) => x).length;

const getNoteType = (
  note: ChartFile.Note,
  previousNote: ChartFile.Note,
  forced: boolean,
  resolution: number
): ChartFile.NoteType => {
  if (note.type == "tap") return "tap";

  let naturallyStrum = true;
  const cutoffDistance = resolution / 3 + 1;

  if (
    noteCount(note.notes) == 1 &&
    note.point - previousNote.point <= cutoffDistance &&
    convertToBitset(note.notes) != convertToBitset(previousNote.notes)
  )
    naturallyStrum = false;

  let strum = naturallyStrum;
  if (forced) strum = !strum;

  if (strum) return "strum";
  return "hopo";
};

const parseINI = (string: string): ChartINI => {
  const lines = string.replaceAll("\r", "").split("\n");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const object: any = {};
  let header = "";
  for (let line of lines) {
    line = line.trim();
    // Match Section Headers
    if (line[0] == "[" && line[line.length - 1] == "]") {
      header = line.substring(1, line.length - 1);

      if (!object[header]) object[header] = {};
      continue;
    }

    const [key, value] = line.split(" = ");

    if (key == undefined || value == undefined) continue;

    if (object[header][key]) {
      object[header][key].push(value);
    } else {
      object[header][key] = [value];
    }
  }

  return object;
};

export const parse = (string: string): ChartFile.Chart => {
  const resolution = 192;
  const chartData = parseINI(string);
  const [timing, TPArray] = getTiming(chartData.SyncTrack, resolution);

  const events = getEvents(chartData.Events, TPArray, resolution);
  const notes: ChartFile.Notes = {};
  if (chartData.ExpertSingle) {
    notes.expert = getNotes(chartData.ExpertSingle, TPArray, resolution);
  }
  if (chartData.HardSingle) {
    notes.hard = getNotes(chartData.HardSingle, TPArray, resolution);
  }
  if (chartData.NormalSingle) {
    notes.normal = getNotes(chartData.NormalSingle, TPArray, resolution);
  }
  if (chartData.EasySingle) {
    notes.easy = getNotes(chartData.EasySingle, TPArray, resolution);
  }

  return { timing, events, notes };
};

export const parseMetadata = (string: string): { [key: string]: string } => {
  const parsed = parseINI(string);
  const chart = new TSMap<string, string>();

  for (const prop in parsed.Song) {
    const value = parsed.Song[prop][0];
    chart.set(prop, value);
  }

  return chart.toJSON();
};

// Convert parsed chart into game notes for the 4-lane system
export interface GameNote {
  id: string;
  lane: 0 | 1 | 2 | 3;
  type: 'note';
  time: number;
  y: number;
  hit: boolean;
}

export const convertChartToGameNotes = (
  chart: ChartFile.Chart,
  difficulty: keyof ChartFile.Notes = 'expert'
): GameNote[] => {
  const chartNotes = chart.notes[difficulty] || [];
  const gameNotes: GameNote[] = [];

  chartNotes.forEach((note, index) => {
    // Convert 5-lane guitar chart to 4-lane game
    const activeLanes = [0, 1, 2, 3, 4].filter(i => note.notes[i]);
    
    activeLanes.forEach(lane => {
      // Map 5 guitar lanes to 4 game lanes
      const gameLane = Math.min(lane, 3) as 0 | 1 | 2 | 3;
      
      gameNotes.push({
        id: `note-${index}-${note.point}-${lane}`,
        lane: gameLane,
        type: 'note',
        time: note.ms,
        y: -25, // Will be updated by game engine
        hit: false
      });
    });
  });

  // Sort by time
  gameNotes.sort((a, b) => a.time - b.time);
  return gameNotes;
};