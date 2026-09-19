import { TaskDto } from "../../../types";
import {
  getTaskEffectiveTime,
  normalizeTaskTimeType,
  getTaskTimelineRangeForDate,
} from "../../../utils/taskSemantics";

export interface TimelineRange {
  start: number;
  end: number;
}

export interface PositionedScheduledBlock {
  task: TaskDto;
  top: number;
  left: number;
  width: number;
  height: number;
  showLabel: boolean;
  lane: number;
  laneCount: number;
  durationMinutes: number;
  zIndex?: number;
}

export interface PositionedDeadlineMarker {
  task: TaskDto;
  top: number;
  left: number;
  width: number;
  lane: number;
  laneCount: number;
  time: string;
  formattedTime: string;
  overflowCount?: number;
  hiddenTasks?: TaskDto[];
  zIndex: number;
}

export interface TimelineHourRow {
  hour: number;
  top: number;
  height: number;
}

export interface TimelineGridLayout {
  hours: TimelineHourRow[];
  scheduledBlocks: PositionedScheduledBlock[];
  deadlineMarkers: PositionedDeadlineMarker[];
  totalHeight: number;
}

const HOUR_COUNT = 24;
const MAX_DEADLINE_LANES = 2; // Tối đa 2 cột ngang cho deadline để đảm bảo chữ luôn đọc được

export const snapMinutesTo15 = (minutes: number): number => {
  const clamped = Math.max(0, Math.min(24 * 60 - 15, minutes));
  return Math.min(24 * 60 - 15, Math.round(clamped / 15) * 15);
};

export const formatTimeFromMinutes = (minutes: number): string => {
  const clamped = Math.max(0, Math.min(24 * 60, minutes));
  const hours = Math.floor(clamped / 60);
  const remainder = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

export const calculateDurationMinutes = (startTime?: string, endTime?: string): number => {
  if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) return 60;
  const [sh, sm] = startTime.split(":").map(Number);
  const startM = sh * 60 + sm;

  if (endTime && /^\d{2}:\d{2}$/.test(endTime)) {
    const [eh, em] = endTime.split(":").map(Number);
    const endM = eh * 60 + em;
    if (endM > startM) {
      return endM - startM;
    }
  }
  return 60;
};

export const addMinutesToTime = (timeStr: string, deltaMinutes: number): string => {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return "00:00";
  const [h, m] = timeStr.split(":").map(Number);
  const total = Math.max(0, Math.min(24 * 60, h * 60 + m + deltaMinutes));
  return formatTimeFromMinutes(total);
};

const formatTime = (minutes: number): string => {
  return formatTimeFromMinutes(minutes);
};

// === PHẦN 1: Lane packing cho các khối lịch hẹn ===
// Deadline có rail riêng nên không được tham gia tính va chạm với event/task có giờ.
interface RawTimelineSegment {
  task: TaskDto;
  start: number;
  end: number;
  collisionEnd: number;
  effectiveTime: string;
  lane?: number;
  laneCount?: number;
  clusterId?: number;
}

const assignClusterLanes = (segments: RawTimelineSegment[]): RawTimelineSegment[] => {
  const laneEnds: number[] = [];
  const sortedSegments = [...segments].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    if (a.collisionEnd !== b.collisionEnd) return b.collisionEnd - a.collisionEnd;
    return a.task.id.localeCompare(b.task.id);
  });

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

const assignTimelineLanes = (segments: RawTimelineSegment[]): RawTimelineSegment[] => {
  const sortedSegments = [...segments].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    if (a.collisionEnd !== b.collisionEnd) return b.collisionEnd - a.collisionEnd;
    return a.task.id.localeCompare(b.task.id);
  });

  const positionedSegments: RawTimelineSegment[] = [];
  let cluster: RawTimelineSegment[] = [];
  let clusterEnd = -1;
  let clusterId = 0;

  const flushCluster = () => {
    if (cluster.length === 0) return;
    assignClusterLanes(cluster).forEach((segment) => {
      segment.clusterId = clusterId;
      positionedSegments.push(segment);
    });
    cluster = [];
    clusterEnd = -1;
    clusterId += 1;
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

// === PHẦN 2: Layout engine time-grid (lane song song, không che event) ===
export const buildTimelineGridLayout = (
  tasks: TaskDto[],
  dateStr: string,
  baseRowHeight: number = 64,
  minLaneHeight: number = 26,
): TimelineGridLayout => {
  const hours: TimelineHourRow[] = Array.from({ length: HOUR_COUNT }, (_, hour) => ({
    hour,
    top: hour * baseRowHeight,
    height: baseRowHeight,
  }));

  const minVisualMinutes = (minLaneHeight / baseRowHeight) * 60;

  // Chỉ lịch hẹn/event đi vào lưới lane. Deadline có rail riêng phía trên khối.
  const rawScheduledSegments: RawTimelineSegment[] = tasks.flatMap<RawTimelineSegment>((task) => {
    const normType = normalizeTaskTimeType(task);
    const effectiveTime = getTaskEffectiveTime(task);
    if (!effectiveTime || !/^\d{2}:\d{2}$/.test(effectiveTime)) return [];

    if (normType === "scheduled") {
      const range = getTaskTimelineRangeForDate(task, dateStr);
      if (!range) return [];
      const start = Math.max(0, Math.min(range.start, 24 * 60 - 5));
      const end = Math.min(24 * 60, Math.max(range.end, start + 5));
      const visualDuration = Math.max(end - start, minVisualMinutes);
      const collisionEnd = Math.min(24 * 60, start + visualDuration);

      return [{
        task,
        start,
        end,
        collisionEnd,
        effectiveTime,
      }];
    }
    return [];
  });

  const positionedScheduled = assignTimelineLanes(rawScheduledSegments);

  // Deadline chỉ tranh lane với deadline khác. Như vậy chúng không ép event/task
  // thành những ô hẹp hoặc tạo hiệu ứng cascade khó đọc.
  const rawDeadlineSegments: RawTimelineSegment[] = tasks.flatMap<RawTimelineSegment>((task) => {
    if (normalizeTaskTimeType(task) !== "deadline") return [];
    const effectiveTime = getTaskEffectiveTime(task);
    if (!effectiveTime || !/^\d{2}:\d{2}$/.test(effectiveTime)) return [];
    const [hours, minutes] = effectiveTime.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return [];
    const start = Math.max(0, Math.min(24 * 60 - 1, hours * 60 + minutes));
    const end = Math.min(24 * 60, start + Math.round(minVisualMinutes));
    return [{
      task,
      start,
      end,
      collisionEnd: end,
      effectiveTime,
    }];
  });
  const positionedDeadlines = assignTimelineLanes(rawDeadlineSegments);

  const scheduledBlocks: PositionedScheduledBlock[] = [];
  const deadlineMarkers: PositionedDeadlineMarker[] = [];

  positionedScheduled.forEach((segment) => {
    const lane = segment.lane || 0;
    const laneCount = segment.laneCount || 1;
    // Các task trùng khoảng giờ chia đều chiều ngang của cùng một ô thời gian.
    // Gutter nhỏ giữ ranh giới rõ mà không làm sai vị trí theo trục giờ.
    const laneWidth = 100 / laneCount;
    const gutter = laneCount > 1 ? Math.min(1.2, laneWidth / 5) : 0;
    const left = lane * laneWidth + gutter / 2;
    const width = Math.max(0, laneWidth - gutter);
    const durationMinutes = segment.end - segment.start;
    const rawHeight = (durationMinutes / 60) * baseRowHeight;
    // Keep event edges on the same pixel grid as the 15-minute hit areas.
    const height = Math.max(minLaneHeight, Math.round(rawHeight));

    scheduledBlocks.push({
      task: segment.task,
      top: Math.round((segment.start / 60) * baseRowHeight),
      left,
      width,
      height,
      showLabel: true,
      lane,
      laneCount,
      durationMinutes,
      zIndex: 10,
    });
  });

  const deadlineClusters = new Map<number, RawTimelineSegment[]>();
  positionedDeadlines.forEach((segment) => {
    const key = segment.clusterId ?? segment.start;
    const cluster = deadlineClusters.get(key) || [];
    cluster.push(segment);
    deadlineClusters.set(key, cluster);
  });

  deadlineClusters.forEach((cluster) => {
    const visibleSegments = cluster.slice(0, MAX_DEADLINE_LANES);
    const hiddenTasks = cluster.slice(MAX_DEADLINE_LANES).map((segment) => segment.task);
    const laneCount = Math.max(1, visibleSegments.length);

    visibleSegments.forEach((segment, visibleLane) => {
      const laneWidth = 100 / laneCount;
      const gutter = laneCount > 1 ? Math.min(1.2, laneWidth / 5) : 0;

      deadlineMarkers.push({
        task: segment.task,
        top: Math.round((segment.start / 60) * baseRowHeight),
        left: visibleLane * laneWidth + gutter / 2,
        width: Math.max(0, laneWidth - gutter),
        lane: visibleLane,
        laneCount,
        time: segment.effectiveTime,
        formattedTime: formatTime(segment.start),
        overflowCount: visibleLane === 0 ? hiddenTasks.length : undefined,
        hiddenTasks: visibleLane === 0 && hiddenTasks.length > 0 ? hiddenTasks : undefined,
        zIndex: 20 + visibleLane,
      });
    });
  });

  return {
    hours,
    scheduledBlocks,
    deadlineMarkers,
    totalHeight: HOUR_COUNT * baseRowHeight,
  };
};
