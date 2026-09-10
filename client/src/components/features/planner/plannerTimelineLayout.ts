import { TaskDto } from "../../../types";

export interface TimelineRange {
  start: number;
  end: number;
}

export interface PositionedTimelineSegment {
  task: TaskDto;
  top: number;
  left: number;
  width: number;
  height: number;
  showLabel: boolean;
}

export interface TimelineHourRow {
  hour: number;
  top: number;
  height: number;
}

export interface TimelineGridLayout {
  hours: TimelineHourRow[];
  segments: PositionedTimelineSegment[];
  totalHeight: number;
}

interface RawTimelineSegment {
  task: TaskDto;
  hour: number;
  startMinute: number;
  endMinute: number;
  showLabel: boolean;
  lane?: number;
}

const HOUR_COUNT = 24;

// === PHẦN 1: Chia task thành từng đoạn trong mỗi giờ ===
const splitIntoHourSegments = (
  tasks: TaskDto[],
  getRange: (task: TaskDto) => TimelineRange | undefined,
) => {
  const segmentsByHour = new Map<number, RawTimelineSegment[]>();

  tasks.forEach((task) => {
    const range = getRange(task);
    if (!range) return;

    let cursor = Math.max(0, range.start);
    const end = Math.min(24 * 60, range.end);

    while (cursor < end) {
      const hour = Math.floor(cursor / 60);
      const hourStart = hour * 60;
      const segmentEnd = Math.min(end, hourStart + 60);
      const segments = segmentsByHour.get(hour) || [];

      segments.push({
        task,
        hour,
        startMinute: cursor - hourStart,
        endMinute: segmentEnd - hourStart,
        showLabel: cursor === range.start,
      });
      segmentsByHour.set(hour, segments);
      cursor = segmentEnd;
    }
  });

  return segmentsByHour;
};

// === PHẦN 2: Xếp các khoảng giao nhau thành lane dọc ===
const assignLanes = (segments: RawTimelineSegment[]) => {
  const laneEnds: number[] = [];
  const sortedSegments = [...segments].sort((a, b) => {
    if (a.startMinute !== b.startMinute) return a.startMinute - b.startMinute;
    return a.endMinute - b.endMinute;
  });

  sortedSegments.forEach((segment) => {
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= segment.startMinute);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(segment.endMinute);
    } else {
      laneEnds[lane] = segment.endMinute;
    }
    segment.lane = lane;
  });

  return { segments: sortedSegments, laneCount: Math.max(1, laneEnds.length) };
};

// === PHẦN 3: Tính chiều cao hàng theo số task đang giao nhau ===
export const buildTimelineGridLayout = (
  tasks: TaskDto[],
  getRange: (task: TaskDto) => TimelineRange | undefined,
  baseRowHeight: number,
  minLaneHeight: number,
): TimelineGridLayout => {
  const segmentsByHour = splitIntoHourSegments(tasks, getRange);
  const hours: TimelineHourRow[] = [];
  const segments: PositionedTimelineSegment[] = [];
  let top = 0;

  for (let hour = 0; hour < HOUR_COUNT; hour += 1) {
    const { segments: hourSegments, laneCount } = assignLanes(segmentsByHour.get(hour) || []);
    const laneHeight = Math.max(minLaneHeight, laneCount === 1 ? baseRowHeight : minLaneHeight);
    const height = laneCount * laneHeight;

    hours.push({ hour, top, height });

    hourSegments.forEach((segment) => {
      const lane = segment.lane || 0;
      segments.push({
        task: segment.task,
        top: top + lane * laneHeight + 2,
        left: (segment.startMinute / 60) * 100,
        width: ((segment.endMinute - segment.startMinute) / 60) * 100,
        height: Math.max(28, laneHeight - 4),
        showLabel: segment.showLabel,
      });
    });

    top += height;
  }

  return { hours, segments, totalHeight: top };
};
