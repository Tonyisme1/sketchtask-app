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
  start: number;
  end: number;
  collisionEnd: number;
  showLabel: boolean;
  lane?: number;
  laneCount?: number;
}

const HOUR_COUNT = 24;

// === PHẦN 1: Chuẩn hóa các khoảng task trong trục thời gian ===
const buildRawSegments = (
  tasks: TaskDto[],
  getRange: (task: TaskDto) => TimelineRange | undefined,
  baseRowHeight: number,
  minLaneHeight: number,
) => {
  const minVisualMinutes = ((minLaneHeight + 4) / baseRowHeight) * 60;

  return tasks.flatMap((task) => {
    const range = getRange(task);
    if (!range) return [];

    const start = Math.max(0, Math.min(range.start, 24 * 60 - 15));
    const end = Math.min(24 * 60, Math.max(range.end, start + 15));
    return [{
      task,
      start,
      end,
      collisionEnd: Math.min(24 * 60, Math.max(end, start + minVisualMinutes)),
      showLabel: true,
    }];
  });
};

// === PHẦN 2: Xếp các task giao nhau thành lane ngang ===
const assignClusterLanes = (segments: RawTimelineSegment[]) => {
  const laneEnds: number[] = [];
  const sortedSegments = [...segments];

  sortedSegments.forEach((segment) => {
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= segment.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(segment.collisionEnd);
    } else {
      laneEnds[lane] = segment.collisionEnd;
    }
    segment.lane = lane;
  });

  const laneCount = Math.max(1, laneEnds.length);
  sortedSegments.forEach((segment) => {
    segment.laneCount = laneCount;
  });

  return sortedSegments;
};

const assignLanes = (segments: RawTimelineSegment[]) => {
  const sortedSegments = [...segments].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return a.end - b.end;
  });
  const positionedSegments: RawTimelineSegment[] = [];
  let cluster: RawTimelineSegment[] = [];
  let clusterEnd = -1;

  const flushCluster = () => {
    if (cluster.length === 0) return;
    positionedSegments.push(...assignClusterLanes(cluster));
    cluster = [];
    clusterEnd = -1;
  };

  sortedSegments.forEach((segment) => {
    if (cluster.length > 0 && segment.start >= clusterEnd) {
      flushCluster();
    }
    cluster.push(segment);
    clusterEnd = Math.max(clusterEnd, segment.collisionEnd);
  });
  flushCluster();

  return positionedSegments;
};

// === PHẦN 3: Tính vị trí chuẩn TimeGrid, không chồng thẻ ===
export const buildTimelineGridLayout = (
  tasks: TaskDto[],
  getRange: (task: TaskDto) => TimelineRange | undefined,
  baseRowHeight: number,
  minLaneHeight: number,
): TimelineGridLayout => {
  const rawSegments = buildRawSegments(tasks, getRange, baseRowHeight, minLaneHeight);
  const positionedSegments = assignLanes(rawSegments);
  const hours = Array.from({ length: HOUR_COUNT }, (_, hour) => ({
    hour,
    top: hour * baseRowHeight,
    height: baseRowHeight,
  }));

  const segments = positionedSegments.map((segment) => {
    const lane = segment.lane || 0;
    const laneCount = segment.laneCount || 1;
    return {
      task: segment.task,
      top: (segment.start / 60) * baseRowHeight + 2,
      left: (lane / laneCount) * 100,
      width: (1 / laneCount) * 100,
      height: Math.max(
        minLaneHeight,
        ((segment.end - segment.start) / 60) * baseRowHeight - 4,
      ),
      showLabel: segment.showLabel,
    };
  });

  return { hours, segments, totalHeight: HOUR_COUNT * baseRowHeight };
};
