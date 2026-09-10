import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "../../../stores/appStore";
import { TaskPriority, TaskTimeType } from "../../../types";
import { getLocalTodayStr } from "../../../utils/date";
import { normalizeTaskTimeType } from "../../../utils/taskSemantics";
import { HandDrawnCheckbox } from "../../ui/core/HandDrawnCheckbox";
import { CustomSelect } from "../../ui/pickers/select/CustomSelect";
import { TimePickerPopover } from "../../ui/pickers/time/TimePickerPopover";
import { DatePickerPopover } from "../../ui/pickers/time/DatePickerPopover";
import {
  ArrowLeft,
  Trash2,
  Calendar,
  Hourglass,
  Tag as TagIcon,
  BookOpen,
  Check,
  Sparkles,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type TaskEditorSection = "status" | "scheduled" | "deadline" | "notes" | "metadata" | "subtasks";

interface CollapsibleTaskSectionProps {
  title: string;
  icon?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}

const CollapsibleTaskSection: React.FC<CollapsibleTaskSectionProps> = ({
  title,
  icon,
  open,
  onToggle,
  trailing,
  children,
}) => (
  <section className="border-b border-[#262626]/10 pb-2">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="w-full min-h-[38px] flex items-center justify-between gap-2 py-1 text-left cursor-pointer rounded-[4px] hover:bg-white/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1C1917]"
    >
      <span className="text-[10px] font-black uppercase tracking-wider text-[#78716C] font-mono flex items-center gap-1.5">
        {icon}
        <span>{title}</span>
      </span>
      <span className="flex items-center gap-2 shrink-0">
        {trailing}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </span>
    </button>
    {open && <div className="pt-2 space-y-2">{children}</div>}
  </section>
);

export interface TaskDetailPageProps {
  taskId: string | "new";
  initialDate?: string;
  notebookId?: string;
  parentTaskId?: string;
  onBack: () => void;
}

const getEditorTimeType = (task: Parameters<typeof normalizeTaskTimeType>[0]): TaskTimeType => {
  return normalizeTaskTimeType(task) === "scheduled" ? "scheduled" : "deadline";
};

export const TaskDetailPage: React.FC<TaskDetailPageProps> = ({
  taskId,
  initialDate,
  notebookId: defaultNotebookId,
  parentTaskId,
  onBack,
}) => {
  const {
    tasks,
    notebooks,
    tags,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
  } = useAppStore();

  const todayStr = getLocalTodayStr(new Date());

  // Tìm task hiện tại nếu là task có sẵn
  const existingTask = taskId !== "new" ? tasks.find((t) => t.id === taskId) : null;

  // State cục bộ (được khởi tạo từ task có sẵn hoặc tạo mới)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(existingTask ? existingTask.id : null);
  const [title, setTitle] = useState(existingTask ? existingTask.title : "");
  const [description, setDescription] = useState(existingTask?.description || "");
  const [completed, setCompleted] = useState(existingTask ? existingTask.completed : false);
  const [dueDate, setDueDate] = useState(existingTask?.dueDate || initialDate || todayStr);
  const [timeType, setTimeType] = useState<TaskTimeType>(
    existingTask ? getEditorTimeType(existingTask) : "deadline",
  );
  const [startTime, setStartTime] = useState(existingTask?.startTime || "");
  const [endTime, setEndTime] = useState(existingTask?.endTime || "");
  const [deadlineTime, setDeadlineTime] = useState(existingTask?.deadlineTime || "");
  const [priority, setPriority] = useState<TaskPriority>(existingTask?.priority || "medium");
  const [notebookId, setNotebookId] = useState<string>(existingTask?.notebookId || defaultNotebookId || "none");
  const [tag, setTag] = useState<string>(existingTask?.tag || "none");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved");
  const [openSections, setOpenSections] = useState<Record<TaskEditorSection, boolean>>({
    status: false,
    scheduled: false,
    deadline: false,
    notes: false,
    metadata: false,
    subtasks: false,
  });

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Đồng bộ state khi taskId thay đổi (người dùng bấm task khác trên danh sách)
  useEffect(() => {
    const task = taskId !== "new" ? tasks.find((t) => t.id === taskId) : null;
    setCurrentTaskId(task ? task.id : null);
    setTitle(task ? task.title : "");
    setDescription(task?.description || "");
    setCompleted(task ? task.completed : false);
    setDueDate(task?.dueDate || initialDate || todayStr);
    setTimeType(task ? getEditorTimeType(task) : "deadline");
    setStartTime(task?.startTime || "");
    setEndTime(task?.endTime || "");
    setDeadlineTime(task?.deadlineTime || "");
    setPriority(task?.priority || "medium");
    setNotebookId(task?.notebookId || defaultNotebookId || "none");
    setTag(task?.tag || "none");
    setSaveStatus("saved");
    setOpenSections({
      status: false,
      scheduled: false,
      deadline: false,
      notes: false,
      metadata: false,
      subtasks: false,
    });
  }, [taskId, initialDate, defaultNotebookId, todayStr]);

  // Autofocus vào tiêu đề khi tạo task mới
  useEffect(() => {
    if (taskId === "new") {
      titleInputRef.current?.focus();
    }
  }, [taskId]);

  // Lắng nghe phím ESC để quay lại
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onBack();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

  // Task detail giữ draft cục bộ; chỉ ghi vào store khi người dùng bấm Lưu.
  const markDraftChanged = () => setSaveStatus("unsaved");

  const toggleSection = (section: TaskEditorSection) => {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  };

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setSaveStatus("saving");
    const taskData = {
      title: trimmedTitle,
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      timeType,
      // Persist only the fields belonging to the selected time type.
      startTime: timeType === "scheduled" ? startTime || undefined : undefined,
      endTime: timeType === "scheduled" ? endTime || undefined : undefined,
      deadlineTime: timeType === "deadline" ? deadlineTime || undefined : undefined,
      priority,
      notebookId: notebookId !== "none" ? notebookId : undefined,
      tag: tag !== "none" ? tag : undefined,
      parentTaskId: parentTaskId || undefined,
    };

    if (!currentTaskId) {
      const created = addTask(taskData);
      setCurrentTaskId(created.id);
    } else {
      updateTask(currentTaskId, taskData);
    }

    setSaveStatus("saved");
  };

  // Danh sách việc con (Subtasks) của task này
  const childSubtasks = currentTaskId ? tasks.filter((t) => t.parentTaskId === currentTaskId) : [];

  const handleAddSubtask = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;

    let parentId = currentTaskId;
    if (!parentId) {
      const parentCreated = addTask({
        title: title.trim() || "Công việc mới",
        dueDate: dueDate || todayStr,
        timeType,
        priority,
        notebookId: notebookId !== "none" ? notebookId : undefined,
        tag: tag !== "none" ? tag : undefined,
      });
      parentId = parentCreated.id;
      setCurrentTaskId(parentId);
    }

    addTask({
      title: trimmed,
      parentTaskId: parentId,
      dueDate: dueDate || todayStr,
      priority: "medium",
      timeType: "deadline",
    });

    setNewSubtaskTitle("");
  };

  const handleDeleteSelf = () => {
    if (currentTaskId) {
      deleteTask(currentTaskId);
    }
    onBack();
  };

  const handleToggleComplete = () => {
    const nextCompleted = !completed;
    setCompleted(nextCompleted);
    if (currentTaskId) {
      toggleTask(currentTaskId);
    }
  };

  return (
    <div className="w-full h-full bg-[#FBF9F4] text-[#1C1917] select-none flex flex-col overflow-hidden">
      {/* 1. TOPBAR CỦA PANEL: Nút Quay Lại + Trạng Thái Lưu + Nút Xóa */}
      <div className="shrink-0 z-20 bg-[#FBF9F4] border-b border-[#262626]/20 px-4 py-2.5 flex items-center justify-between">
        {/* Nút Quay Lại */}
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-white hover:bg-[#FAF8F3] border border-[#262626] shadow-[1px_1px_0px_#262626] text-xs font-bold active:translate-y-[0.5px] cursor-pointer transition-all"
        >
          <ArrowLeft size={13} strokeWidth={2.4} />
          <span>Quay lại</span>
        </button>

        {/* Trạng thái đã lưu & Xóa */}
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono font-bold text-[#78716C] flex items-center gap-1">
            {saveStatus === "saving" ? (
              <span>Đang lưu...</span>
            ) : saveStatus === "unsaved" ? (
              <span className="text-amber-700">Chưa lưu</span>
            ) : (
              <span className="text-emerald-700 flex items-center gap-1 font-bold">
                <Check size={12} strokeWidth={3} />
                ĐÃ LƯU
              </span>
            )}
          </span>

          {saveStatus === "unsaved" && (
            <button
              type="button"
              onClick={handleSave}
              disabled={!title.trim()}
              className="px-2.5 py-1 rounded-[4px] bg-[#FEF08A] hover:bg-[#FDE047] border border-[#262626] shadow-[1px_1px_0px_#262626] text-[11px] font-bold disabled:opacity-50 disabled:cursor-not-allowed active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
            >
              Lưu
            </button>
          )}

          {currentTaskId && (
            <button
              type="button"
              onClick={handleDeleteSelf}
              className="p-1 rounded-[4px] bg-white hover:bg-rose-50 border border-[#262626] text-rose-700 hover:text-rose-900 shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] cursor-pointer transition-all"
              title="Xóa công việc này"
            >
              <Trash2 size={13} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>

      {/* 2. NỘI DUNG CHÍNH (FORM GỌN GÀNG, THOÁNG ĐÃNG) */}
      <div className="flex-1 w-full p-4 space-y-4 overflow-y-auto">
        {/* TIÊU ĐỀ CÔNG VIỆC */}
        <div className="space-y-1 pb-2 border-b border-[#262626]/15">
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => {
              const nextVal = e.target.value;
              setTitle(nextVal);
              markDraftChanged();
            }}
            placeholder="Tên công việc..."
            className="w-full bg-transparent text-base sm:text-lg font-black text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none tracking-tight leading-snug"
          />
        </div>

        {/* MỤC 1: TRẠNG THÁI (STATUS) - Chỉ hiện khi sửa task đã tồn tại */}
        {taskId !== "new" && (
          <CollapsibleTaskSection
            title="Trạng thái"
            icon={<CheckCircle2 size={12} />}
            open={openSections.status}
            onToggle={() => toggleSection("status")}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (completed) handleToggleComplete();
                }}
                className={`flex-1 py-1.5 px-3 rounded-[4px] border-[1.5px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !completed
                    ? "bg-[#1C1917] text-white border-[#1C1917] shadow-[1.5px_1.5px_0px_#262626]"
                    : "bg-white text-[#78716C] border-[#D4CEBF] hover:bg-[#FAF8F3]"
                }`}
              >
                <Circle size={13} strokeWidth={2.4} />
                <span>Cần làm</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!completed) handleToggleComplete();
                }}
                className={`flex-1 py-1.5 px-3 rounded-[4px] border-[1.5px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  completed
                    ? "bg-[#1C1917] text-white border-[#1C1917] shadow-[1.5px_1.5px_0px_#262626]"
                    : "bg-white text-[#78716C] border-[#D4CEBF] hover:bg-[#FAF8F3]"
                }`}
              >
                <CheckCircle2 size={13} strokeWidth={2.4} />
                <span>Đã xong</span>
              </button>
            </div>
          </CollapsibleTaskSection>
        )}

        {/* MỤC 2: LỊCH HẸN (SCHEDULED) */}
        <CollapsibleTaskSection
          title="Lịch hẹn"
          icon={<Calendar size={12} />}
          open={openSections.scheduled}
          onToggle={() => toggleSection("scheduled")}
          trailing={timeType === "scheduled" ? (
            <span className="text-[10px] font-mono font-bold text-[#1C1917] bg-[#E7E5E4] px-1.5 py-0.2 rounded border border-[#A8A29E]">
              Đang chọn
            </span>
          ) : undefined}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Ngày hẹn */}
            <DatePickerPopover
              value={dueDate}
              onChange={(val) => {
                setDueDate(val);
                markDraftChanged();
              }}
              placeholder="Chọn ngày hẹn"
              className="w-full"
            />

            {/* Khung giờ bắt đầu - kết thúc */}
            <div className="flex items-center gap-1.5">
              <TimePickerPopover
                value={startTime}
                onChange={(val) => {
                  setStartTime(val);
                  setTimeType("scheduled");
                  markDraftChanged();
                }}
                placeholder="Bắt đầu"
                className="flex-1 min-w-0"
              />
              <span className="text-[#78716C] font-mono font-bold">–</span>
              <TimePickerPopover
                value={endTime}
                onChange={(val) => {
                  setEndTime(val);
                  setTimeType("scheduled");
                  markDraftChanged();
                }}
                placeholder="Kết thúc"
                align="right"
                className="flex-1 min-w-0"
              />
            </div>
          </div>
        </CollapsibleTaskSection>

        {/* MỤC 3: HẠN CHÓT (DUE / DEADLINE) */}
        <CollapsibleTaskSection
          title="Hạn định"
          icon={<Hourglass size={12} />}
          open={openSections.deadline}
          onToggle={() => toggleSection("deadline")}
          trailing={timeType === "deadline" ? (
            <span className="text-[10px] font-mono font-bold text-[#1C1917] bg-[#E7E5E4] px-1.5 py-0.2 rounded border border-[#A8A29E]">
              Đang chọn
            </span>
          ) : undefined}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Ngày hết hạn */}
            <DatePickerPopover
              value={dueDate}
              onChange={(val) => {
                setDueDate(val);
                markDraftChanged();
              }}
              placeholder="Chọn ngày hết hạn"
              className="w-full"
            />

            {/* Giờ chót */}
            <div className="w-full">
              <TimePickerPopover
                value={deadlineTime}
                onChange={(val) => {
                  setDeadlineTime(val);
                  setTimeType("deadline");
                  markDraftChanged();
                }}
                placeholder="Không đặt giờ (Cả ngày)"
                align="right"
                className="w-full"
              />
            </div>
          </div>
        </CollapsibleTaskSection>

        {/* MỤC 4: GHI CHÚ & NỘI DUNG (NOTES) */}
        <CollapsibleTaskSection
          title="Ghi chú & Chi tiết"
          open={openSections.notes}
          onToggle={() => toggleSection("notes")}
          trailing={<span className="text-[10px] font-mono text-[#78716C]">Hỗ trợ Markdown</span>}
        >
          <textarea
            rows={4}
            value={description}
            onChange={(e) => {
              const nextVal = e.target.value;
              setDescription(nextVal);
              markDraftChanged();
            }}
            placeholder="Viết ghi chú, nội dung chi tiết, dàn ý cho công việc này..."
            className="w-full p-3 bg-white border border-[#262626] rounded-[6px] shadow-[1px_1px_0px_#262626] text-xs font-medium text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#1C1917] leading-relaxed resize-y"
          />
        </CollapsibleTaskSection>

        {/* MỤC 5: PHÂN LOẠI & MỨC ĐỘ (METADATA) */}
        <CollapsibleTaskSection
          title="Phân loại & Mức độ"
          icon={<Sparkles size={12} />}
          open={openSections.metadata}
          onToggle={() => toggleSection("metadata")}
        >

          <div className="space-y-2.5 text-xs">
            {/* Mức độ ưu tiên */}
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-[#78716C] flex items-center gap-1 shrink-0">
                <Sparkles size={13} />
                <span>Ưu tiên:</span>
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  { key: "high", label: "Gấp", sym: "●" },
                  { key: "medium", label: "Vừa", sym: "◐" },
                  { key: "low", label: "Thấp", sym: "○" },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      const nextP = p.key as TaskPriority;
                      setPriority(nextP);
                      markDraftChanged();
                    }}
                    className={`px-2.5 py-1 rounded-[3px] border font-bold flex items-center gap-1 cursor-pointer transition-all ${
                      priority === p.key
                        ? "bg-[#1C1917] text-white border-[#1C1917]"
                        : "bg-[#FAF8F3] text-[#78716C] border-[#D4CEBF] hover:bg-white"
                    }`}
                  >
                    <span className="font-mono text-[10px]">{p.sym}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sổ tay */}
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-[#78716C] flex items-center gap-1 shrink-0">
                <BookOpen size={13} />
                <span>Sổ tay:</span>
              </span>
              <div className="flex-1 max-w-[200px]">
                <CustomSelect
                  options={[
                    { value: "none", label: "Không thuộc sổ tay" },
                    ...notebooks.map((nb) => ({
                      value: nb.id,
                      label: nb.name,
                      icon: nb.icon,
                      color: nb.color,
                    })),
                  ]}
                  value={notebookId}
                  onChange={(val) => {
                    setNotebookId(val);
                    markDraftChanged();
                  }}
                  placeholder="Chọn sổ tay..."
                />
              </div>
            </div>

            {/* Nhãn Tag */}
            {tags.length > 0 && (
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#78716C] flex items-center gap-1 shrink-0">
                  <TagIcon size={13} />
                  <span>Nhãn (#):</span>
                </span>
                <div className="flex-1 max-w-[200px]">
                  <CustomSelect
                    options={[
                      { value: "none", label: "Không gắn nhãn" },
                      ...tags.map((t) => ({
                        value: t,
                        label: `#${t}`,
                      })),
                    ]}
                    value={tag}
                    onChange={(val) => {
                      setTag(val);
                      markDraftChanged();
                    }}
                    placeholder="Chọn nhãn..."
                  />
                </div>
              </div>
            )}
          </div>
        </CollapsibleTaskSection>

        {/* MỤC 6: DANH SÁCH VIỆC CON (SUBTASKS / CHECKLIST) */}
        <CollapsibleTaskSection
          title={`Việc con (${childSubtasks.filter((c) => c.completed).length}/${childSubtasks.length})`}
          icon={<CheckCircle2 size={12} />}
          open={openSections.subtasks}
          onToggle={() => toggleSection("subtasks")}
        >

          {/* Render danh sách việc con */}
          <div className="space-y-1.5">
            {childSubtasks.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626]"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <HandDrawnCheckbox
                    checked={child.completed}
                    onChange={() => toggleTask(child.id)}
                  />
                  <span
                    className={`text-xs font-bold truncate ${
                      child.completed ? "line-through text-[#78716C] opacity-70" : "text-[#1C1917]"
                    }`}
                  >
                    {child.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => deleteTask(child.id)}
                  className="p-1 text-[#78716C] hover:text-rose-600 rounded cursor-pointer"
                  title="Xóa việc con"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Form thêm việc con */}
          <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="+ Thêm việc con..."
              className="flex-1 px-3 py-1.5 rounded-[4px] border-[1.5px] border-dashed border-[#262626] bg-white text-xs font-bold focus:outline-none focus:border-solid focus:border-[#1C1917]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#1C1917] text-white border-[1.5px] border-[#1C1917] rounded-[4px] text-xs font-bold shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] cursor-pointer"
            >
              Thêm
            </button>
          </form>
        </CollapsibleTaskSection>
      </div>
    </div>
  );
};
