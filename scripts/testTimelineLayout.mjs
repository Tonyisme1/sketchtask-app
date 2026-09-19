import assert from 'node:assert/strict';
import test from 'node:test';

const normalizeTaskTimeType = (task) => {
  if (task.timeType === 'scheduled' || task.timeType === 'event') return 'scheduled';
  if (task.timeType === 'deadline') return 'deadline';
  if (task.startTime) return 'scheduled';
  if (task.deadlineDate || task.deadlineTime) return 'deadline';
  return 'none';
};

const getDueDateParts = (value) => {
  if (!value || typeof value !== 'string') return {};
  const [date, time] = value.trim().split(/\s+/, 2);
  return { date, time };
};

const getTaskEffectiveDate = (task) => {
  const { date } = getDueDateParts(task.dueDate);
  const type = normalizeTaskTimeType(task);
  if (type === 'scheduled') return date || task.startDate;
  if (type === 'deadline') return task.deadlineDate || task.startDate || date;
  return task.startDate || date;
};

const getTaskEffectiveTime = (task) => {
  const { time } = getDueDateParts(task.dueDate);
  const type = normalizeTaskTimeType(task);
  if (type === 'scheduled') return task.startTime || time;
  if (type === 'deadline') return task.deadlineTime || time;
  return time;
};

const getTaskTimelineRangeForDate = (task, dateStr) => {
  const effectiveDate = getTaskEffectiveDate(task);
  const effectiveTime = getTaskEffectiveTime(task);
  if (!effectiveDate || !effectiveTime || effectiveDate !== dateStr) return undefined;

  const [startHour, startMinute] = effectiveTime.split(':').map(Number);
  const start = startHour * 60 + startMinute;
  if (normalizeTaskTimeType(task) !== 'scheduled' || !task.endTime) {
    return { start, end: Math.min(24 * 60, start + 60) };
  }

  const [endHour, endMinute] = task.endTime.split(':').map(Number);
  const end = endHour * 60 + endMinute;
  return { start, end: end > start ? end : 24 * 60 };
};

const assignClusterLanes = (segments) => {
  const laneEnds = [];
  const sorted = [...segments].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    if (a.collisionEnd !== b.collisionEnd) return b.collisionEnd - a.collisionEnd;
    return a.task.id.localeCompare(b.task.id);
  });

  sorted.forEach((segment) => {
    let lane = laneEnds.findIndex((end) => end <= segment.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(segment.collisionEnd);
    } else {
      laneEnds[lane] = segment.collisionEnd;
    }
    segment.lane = lane;
  });

  sorted.forEach((segment) => {
    segment.laneCount = Math.max(1, laneEnds.length);
  });
  return sorted;
};

const buildTimelineGridLayout = (tasks, dateStr, baseRowHeight = 64, minLaneHeight = 26) => {
  const minVisualMinutes = (minLaneHeight / baseRowHeight) * 60;
  const scheduled = [];
  const deadlines = [];

  tasks.forEach((task) => {
    const effectiveTime = getTaskEffectiveTime(task);
    if (!effectiveTime || !/^\d{2}:\d{2}$/.test(effectiveTime)) return;
    const [hour, minute] = effectiveTime.split(':').map(Number);
    const start = hour * 60 + minute;
    const type = normalizeTaskTimeType(task);

    if (type === 'scheduled') {
      const range = getTaskTimelineRangeForDate(task, dateStr);
      if (!range) return;
      const end = Math.min(24 * 60, Math.max(range.end, range.start + 5));
      const visualDuration = Math.max(end - range.start, minVisualMinutes);
      scheduled.push({
        task,
        start: range.start,
        end,
        collisionEnd: Math.min(24 * 60, range.start + visualDuration),
        effectiveTime,
      });
      return;
    }

    if (type === 'deadline' && getTaskEffectiveDate(task) === dateStr) {
      const end = Math.min(24 * 60, start + Math.round(minVisualMinutes));
      deadlines.push({ task, start, end, collisionEnd: end, effectiveTime });
    }
  });

  const place = (segments) => assignClusterLanes(segments).map((segment) => {
    const laneWidth = 100 / segment.laneCount;
    const gutter = segment.laneCount > 1 ? Math.min(1.2, laneWidth / 5) : 0;
    return {
      ...segment,
      left: segment.lane * laneWidth + gutter / 2,
      width: Math.max(0, laneWidth - gutter),
      top: (segment.start / 60) * baseRowHeight,
      height: Math.max(minLaneHeight, ((segment.end - segment.start) / 60) * baseRowHeight - 2),
    };
  });

  return { scheduledBlocks: place(scheduled), deadlineMarkers: place(deadlines) };
};

const snapMinutesTo15 = (minutes) => {
  const clamped = Math.max(0, Math.min(24 * 60 - 15, minutes));
  return Math.round(clamped / 15) * 15;
};

const formatTimeFromMinutes = (minutes) => {
  const clamped = Math.max(0, Math.min(24 * 60, minutes));
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
};

const calculateDurationMinutes = (startTime, endTime) => {
  if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) return 60;
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const start = startHour * 60 + startMinute;
  if (endTime && /^\d{2}:\d{2}$/.test(endTime)) {
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const end = endHour * 60 + endMinute;
    if (end > start) return end - start;
  }
  return 60;
};

test('1. Scheduled không có endTime -> tạo block 60 phút', () => {
  const layout = buildTimelineGridLayout([{
    id: 'task-1', title: 'Họp nhóm', timeType: 'scheduled', dueDate: '2026-09-18', startTime: '09:00',
  }], '2026-09-18');
  assert.equal(layout.scheduledBlocks.length, 1);
  assert.equal(layout.scheduledBlocks[0].height, 62);
  assert.equal(layout.scheduledBlocks[0].laneCount, 1);
  assert.equal(layout.scheduledBlocks[0].width, 100);
});

test('2. Event không có endTime -> vào lịch hẹn nhưng vẫn giữ loại event', () => {
  const event = { id: 'event-1', title: 'Ăn trưa', timeType: 'event', dueDate: '2026-09-18', startTime: '12:00' };
  const layout = buildTimelineGridLayout([event], '2026-09-18');
  assert.equal(layout.scheduledBlocks.length, 1);
  assert.equal(layout.scheduledBlocks[0].task.timeType, 'event');
  assert.equal(layout.scheduledBlocks[0].height, 62);
});

test('3. Deadline trùng giờ -> dùng các cột đều trong rail deadline riêng', () => {
  const tasks = [
    { id: 'deadline-a', title: 'Hạn A', timeType: 'deadline', dueDate: '2026-09-18', deadlineTime: '15:00' },
    { id: 'deadline-b', title: 'Hạn B', timeType: 'deadline', dueDate: '2026-09-18', deadlineTime: '15:00' },
  ];
  const markers = buildTimelineGridLayout(tasks, '2026-09-18').deadlineMarkers;
  assert.equal(markers.length, 2);
  assert.equal(markers[0].laneCount, 2);
  assert.equal(markers[1].laneCount, 2);
  assert.equal(markers[0].left, 0.6);
  assert.equal(markers[1].left, 50.6);
  assert.equal(markers[0].width, 48.8);
  assert.equal(markers[1].width, 48.8);
});

test('4. Task qua đêm -> giữ phần đầu trong ngày bắt đầu', () => {
  const task = { id: 'overnight', title: 'Ca đêm', timeType: 'scheduled', dueDate: '2026-09-18', startTime: '22:00', endTime: '02:00' };
  const block = buildTimelineGridLayout([task], '2026-09-18').scheduledBlocks[0];
  assert.equal(block.top, 22 * 64);
  assert.equal(block.height, 128 - 2);
});

test('5. Task chỉ có ngày -> không vào time-grid', () => {
  const layout = buildTimelineGridLayout([{ id: 'date-only', title: 'Sinh nhật', dueDate: '2026-09-18' }], '2026-09-18');
  assert.equal(layout.scheduledBlocks.length, 0);
  assert.equal(layout.deadlineMarkers.length, 0);
});

test('6. Task bắt đầu lúc 23:00 -> nằm trong biên 24 giờ', () => {
  const block = buildTimelineGridLayout([{
    id: 'late', title: 'Viết nhật ký', timeType: 'scheduled', dueDate: '2026-09-18', startTime: '23:00', endTime: '23:59',
  }], '2026-09-18').scheduledBlocks[0];
  assert.equal(block.top, 23 * 64);
  assert.ok(block.top + block.height <= 24 * 64);
});

test('7. Hai task chồng nhau -> vẫn chia lane đều khi cụm còn nhỏ', () => {
  const blocks = buildTimelineGridLayout([
    { id: 'short-1', title: 'Việc 1', timeType: 'scheduled', dueDate: '2026-09-18', startTime: '10:00', endTime: '10:10' },
    { id: 'short-2', title: 'Việc 2', timeType: 'scheduled', dueDate: '2026-09-18', startTime: '10:10', endTime: '10:20' },
  ], '2026-09-18').scheduledBlocks;
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].laneCount, 2);
  assert.equal(blocks[1].laneCount, 2);
  assert.equal(blocks[0].width, blocks[1].width);
  assert.ok(blocks[1].left > blocks[0].left);
});

test('8. Cụm nhiều task cùng giờ -> chia đều theo số lane', () => {
  const blocks = buildTimelineGridLayout(Array.from({ length: 14 }, (_, index) => ({
    id: `dense-${index}`,
    title: `Việc ${index + 1}`,
    timeType: 'scheduled',
    dueDate: '2026-09-18',
    startTime: '02:00',
    endTime: '03:00',
  })), '2026-09-18').scheduledBlocks;

  assert.equal(blocks.length, 14);
  assert.equal(blocks[0].laneCount, 14);
  assert.equal(blocks[0].width, blocks[13].width);
  assert.ok(blocks[1].left > blocks[0].left);
  assert.ok(blocks[13].left + blocks[13].width <= 100);
});

test('9. Scheduled và deadline cùng giờ không ép nhau vào cùng lane', () => {
  const layout = buildTimelineGridLayout([
    { id: 'scheduled', title: 'Lịch hẹn', timeType: 'scheduled', dueDate: '2026-09-15', startTime: '10:00', endTime: '11:00' },
    { id: 'deadline', title: 'Hạn', timeType: 'deadline', dueDate: '2026-09-15', deadlineTime: '10:00' },
  ], '2026-09-15');
  assert.equal(layout.scheduledBlocks[0].laneCount, 1);
  assert.equal(layout.deadlineMarkers[0].laneCount, 1);
  assert.equal(layout.scheduledBlocks[0].left, layout.deadlineMarkers[0].left);
});

test('10. Snap 15 phút', () => {
  assert.equal(snapMinutesTo15(0), 0);
  assert.equal(snapMinutesTo15(7), 0);
  assert.equal(snapMinutesTo15(8), 15);
  assert.equal(snapMinutesTo15(38), 45);
  assert.equal(snapMinutesTo15(55), 60);
});

test('11. Thời lượng và định dạng mốc giờ', () => {
  assert.equal(calculateDurationMinutes('09:00', '10:30'), 90);
  assert.equal(calculateDurationMinutes('09:00', undefined), 60);
  assert.equal(formatTimeFromMinutes(9 * 60 + 15), '09:15');
  assert.equal(formatTimeFromMinutes(24 * 60), '24:00');
});
