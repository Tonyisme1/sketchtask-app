import { prisma } from "../db.js";
import { wsService } from "./websocket.service.js";
import { calculateConsecutiveStreak } from "./habit.service.js";
export class SyncService {
    /**
     * Lấy toàn bộ dữ liệu hiện có trên máy chủ của User
     */
    static async getUserData(userId) {
        const [tasks, notebooks, stickyNotes, habits, dailyMoods, weeklyReflection, tags] = await Promise.all([
            prisma.task.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
            prisma.notebook.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
            prisma.stickyNote.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
            prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
            prisma.dailyMood.findMany({ where: { userId } }),
            prisma.weeklyReflection.findUnique({ where: { userId } }),
            prisma.tag.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
        ]);
        // Chuyển đổi dailyMoods sang format key-value chuẩn API contract
        const moodsMap = {};
        dailyMoods.forEach((m) => {
            moodsMap[m.dateStr] = m.moodEmoji;
        });
        // Chuyển đổi habits.completedDates từ JSON string sang Array & tính streak
        const formattedHabits = habits.map((h) => {
            let completedDates = [];
            try {
                completedDates = JSON.parse(h.completedDates);
            }
            catch {
                completedDates = [];
            }
            return {
                ...h,
                completedDates,
                streak: calculateConsecutiveStreak(completedDates),
            };
        });
        return {
            tasks,
            notebooks,
            stickyNotes,
            habits: formattedHabits,
            dailyMoods: moodsMap,
            weeklyReflection: weeklyReflection?.text || "",
            tags: tags.map((t) => t.name),
        };
    }
    /**
     * Đồng bộ dữ liệu từ Client lên Server theo cơ chế Upsert / Merge an toàn.
     * Tuyệt đối không xóa toàn bộ dữ liệu cũ của User trước mỗi lần push.
     */
    static async syncData(userId, payload) {
        const payloadTimestampStr = payload.updatedAt || payload.clientTimestamp;
        const defaultPayloadTime = payloadTimestampStr ? new Date(payloadTimestampStr) : null;
        await prisma.$transaction(async (tx) => {
            // 1. Upsert Notebooks trước (để Tasks có foreign key hợp lệ)
            if (payload.notebooks && payload.notebooks.length > 0) {
                for (const nb of payload.notebooks) {
                    const clientUpdatedAt = nb.updatedAt
                        ? new Date(nb.updatedAt)
                        : defaultPayloadTime || new Date();
                    const existing = await tx.notebook.findFirst({
                        where: { id: nb.id, userId },
                    });
                    if (!existing) {
                        await tx.notebook.create({
                            data: {
                                id: nb.id,
                                userId,
                                name: nb.name,
                                description: nb.description || null,
                                color: nb.color || "yellow",
                                icon: nb.icon || "lucide:BookOpen",
                                createdAt: nb.createdAt ? new Date(nb.createdAt) : new Date(),
                                updatedAt: clientUpdatedAt,
                            },
                        });
                    }
                    else if (clientUpdatedAt >= existing.updatedAt) {
                        await tx.notebook.update({
                            where: { id: nb.id },
                            data: {
                                name: nb.name,
                                description: nb.description !== undefined ? nb.description : existing.description,
                                color: nb.color || existing.color,
                                icon: nb.icon !== undefined ? nb.icon : existing.icon,
                                updatedAt: clientUpdatedAt,
                            },
                        });
                    }
                }
            }
            // 2. Lấy danh sách ID Notebook hợp lệ của user (gồm cả cũ và mới upsert)
            const userNotebooks = await tx.notebook.findMany({
                where: { userId },
                select: { id: true },
            });
            const validNotebookIds = new Set(userNotebooks.map((n) => n.id));
            // 3. Upsert Tasks
            if (payload.tasks && payload.tasks.length > 0) {
                for (const t of payload.tasks) {
                    const clientUpdatedAt = t.updatedAt
                        ? new Date(t.updatedAt)
                        : defaultPayloadTime || new Date();
                    const validNotebookId = t.notebookId && validNotebookIds.has(t.notebookId) ? t.notebookId : null;
                    const existing = await tx.task.findFirst({
                        where: { id: t.id, userId },
                    });
                    if (!existing) {
                        await tx.task.create({
                            data: {
                                id: t.id,
                                userId,
                                title: t.title,
                                description: t.description || null,
                                completed: t.completed ?? false,
                                dueDate: t.dueDate || null,
                                timeType: t.timeType || "deadline",
                                startTime: t.startTime || null,
                                endTime: t.endTime || null,
                                deadlineDate: t.deadlineDate || null,
                                deadlineTime: t.deadlineTime || null,
                                tag: t.tag || null,
                                priority: t.priority || "medium",
                                status: t.status || (t.completed ? "completed" : "todo"),
                                notebookId: validNotebookId,
                                createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
                                updatedAt: clientUpdatedAt,
                            },
                        });
                    }
                    else if (clientUpdatedAt >= existing.updatedAt) {
                        await tx.task.update({
                            where: { id: t.id },
                            data: {
                                title: t.title,
                                description: t.description !== undefined ? t.description : existing.description,
                                completed: t.completed !== undefined ? t.completed : existing.completed,
                                dueDate: t.dueDate !== undefined ? t.dueDate : existing.dueDate,
                                timeType: t.timeType !== undefined ? t.timeType : existing.timeType,
                                startTime: t.startTime !== undefined ? t.startTime : existing.startTime,
                                endTime: t.endTime !== undefined ? t.endTime : existing.endTime,
                                deadlineDate: t.deadlineDate !== undefined ? t.deadlineDate : existing.deadlineDate,
                                deadlineTime: t.deadlineTime !== undefined ? t.deadlineTime : existing.deadlineTime,
                                tag: t.tag !== undefined ? t.tag : existing.tag,
                                priority: t.priority !== undefined ? t.priority : existing.priority,
                                status: t.status !== undefined
                                    ? t.status
                                    : t.completed !== undefined
                                        ? t.completed
                                            ? "completed"
                                            : "todo"
                                        : existing.status,
                                notebookId: t.notebookId !== undefined ? validNotebookId : existing.notebookId,
                                updatedAt: clientUpdatedAt,
                            },
                        });
                    }
                }
            }
            // 4. Upsert StickyNotes
            if (payload.stickyNotes && payload.stickyNotes.length > 0) {
                for (const sn of payload.stickyNotes) {
                    const clientUpdatedAt = sn.updatedAt
                        ? new Date(sn.updatedAt)
                        : defaultPayloadTime || new Date();
                    const existing = await tx.stickyNote.findFirst({
                        where: { id: sn.id, userId },
                    });
                    if (!existing) {
                        await tx.stickyNote.create({
                            data: {
                                id: sn.id,
                                userId,
                                content: sn.content,
                                color: sn.color || "yellow",
                                tilt: sn.tilt || "none",
                                isPinned: sn.isPinned ?? false,
                                createdAt: sn.createdAt ? new Date(sn.createdAt) : new Date(),
                                updatedAt: clientUpdatedAt,
                            },
                        });
                    }
                    else if (clientUpdatedAt >= existing.updatedAt) {
                        await tx.stickyNote.update({
                            where: { id: sn.id },
                            data: {
                                content: sn.content,
                                color: sn.color || existing.color,
                                tilt: sn.tilt !== undefined ? sn.tilt : existing.tilt,
                                isPinned: sn.isPinned !== undefined ? sn.isPinned : existing.isPinned,
                                updatedAt: clientUpdatedAt,
                            },
                        });
                    }
                }
            }
            // 5. Upsert Habits (Luôn luôn tính lại streak từ completedDates, không tin client streak)
            if (payload.habits && payload.habits.length > 0) {
                for (const h of payload.habits) {
                    const clientUpdatedAt = h.updatedAt
                        ? new Date(h.updatedAt)
                        : defaultPayloadTime || new Date();
                    const completedDates = Array.isArray(h.completedDates) ? h.completedDates : [];
                    // Bắt buộc tính lại streak chuỗi ngày liên tiếp từ completedDates
                    const calculatedStreak = calculateConsecutiveStreak(completedDates);
                    const existing = await tx.habit.findFirst({
                        where: { id: h.id, userId },
                    });
                    if (!existing) {
                        await tx.habit.create({
                            data: {
                                id: h.id,
                                userId,
                                name: h.name,
                                frequency: h.frequency || "daily",
                                targetDaysPerWeek: h.targetDaysPerWeek || 7,
                                completedDates: JSON.stringify(completedDates),
                                streak: calculatedStreak,
                                createdAt: h.createdAt ? new Date(h.createdAt) : new Date(),
                                updatedAt: clientUpdatedAt,
                            },
                        });
                    }
                    else if (clientUpdatedAt >= existing.updatedAt) {
                        await tx.habit.update({
                            where: { id: h.id },
                            data: {
                                name: h.name,
                                frequency: h.frequency !== undefined ? h.frequency : existing.frequency,
                                targetDaysPerWeek: h.targetDaysPerWeek !== undefined
                                    ? h.targetDaysPerWeek
                                    : existing.targetDaysPerWeek,
                                completedDates: JSON.stringify(completedDates),
                                streak: calculatedStreak,
                                updatedAt: clientUpdatedAt,
                            },
                        });
                    }
                }
            }
            // 6. Upsert DailyMoods (Chống stale-write toàn diện cho cả dạng string và object)
            if (payload.dailyMoods && Object.keys(payload.dailyMoods).length > 0) {
                for (const [dateStr, moodVal] of Object.entries(payload.dailyMoods)) {
                    if (!dateStr || !moodVal)
                        continue;
                    const moodEmoji = typeof moodVal === "string" ? moodVal : moodVal.moodEmoji;
                    if (!moodEmoji)
                        continue;
                    // Lấy timestamp cụ thể của dateStr hoặc timestamp chung của payload
                    let itemUpdatedAt = null;
                    if (typeof moodVal === "object" && moodVal.updatedAt) {
                        itemUpdatedAt = new Date(moodVal.updatedAt);
                    }
                    else if (payload._metadata?.dailyMoodsUpdatedAt?.[dateStr]) {
                        itemUpdatedAt = new Date(payload._metadata.dailyMoodsUpdatedAt[dateStr]);
                    }
                    else if (defaultPayloadTime) {
                        itemUpdatedAt = defaultPayloadTime;
                    }
                    const existing = await tx.dailyMood.findUnique({
                        where: {
                            userId_dateStr: {
                                userId,
                                dateStr,
                            },
                        },
                    });
                    if (!existing) {
                        await tx.dailyMood.create({
                            data: {
                                userId,
                                dateStr,
                                moodEmoji,
                                updatedAt: itemUpdatedAt || new Date(),
                            },
                        });
                    }
                    else {
                        // Chống stale-write:
                        // 1) Nếu có timestamp (dù gửi dạng string kèm payload.updatedAt hay dạng object),
                        //    chỉ cho phép cập nhật khi clientUpdatedAt >= existing.updatedAt
                        // 2) Nếu không có timestamp nào, chỉ update nếu moodEmoji thực sự thay đổi
                        if (itemUpdatedAt) {
                            if (itemUpdatedAt >= existing.updatedAt) {
                                await tx.dailyMood.update({
                                    where: {
                                        userId_dateStr: {
                                            userId,
                                            dateStr,
                                        },
                                    },
                                    data: {
                                        moodEmoji,
                                        updatedAt: itemUpdatedAt,
                                    },
                                });
                            }
                            // Nếu itemUpdatedAt < existing.updatedAt -> BỎ QUA STALE WRITE, BẢO VỆ DỮ LIỆU MỚI HƠN TRÊN SERVER
                        }
                        else if (existing.moodEmoji !== moodEmoji) {
                            await tx.dailyMood.update({
                                where: {
                                    userId_dateStr: {
                                        userId,
                                        dateStr,
                                    },
                                },
                                data: {
                                    moodEmoji,
                                },
                            });
                        }
                    }
                }
            }
            // 7. Upsert WeeklyReflection (Chống stale-write toàn diện cho cả dạng string và object)
            if (payload.weeklyReflection !== undefined && payload.weeklyReflection !== null) {
                let reflectionText = "";
                let itemUpdatedAt = null;
                if (typeof payload.weeklyReflection === "string") {
                    reflectionText = payload.weeklyReflection;
                    if (payload._metadata?.weeklyReflectionUpdatedAt) {
                        itemUpdatedAt = new Date(payload._metadata.weeklyReflectionUpdatedAt);
                    }
                    else if (defaultPayloadTime) {
                        itemUpdatedAt = defaultPayloadTime;
                    }
                }
                else if (typeof payload.weeklyReflection === "object") {
                    reflectionText = payload.weeklyReflection.text || "";
                    if (payload.weeklyReflection.updatedAt) {
                        itemUpdatedAt = new Date(payload.weeklyReflection.updatedAt);
                    }
                    else if (defaultPayloadTime) {
                        itemUpdatedAt = defaultPayloadTime;
                    }
                }
                const existing = await tx.weeklyReflection.findUnique({
                    where: { userId },
                });
                if (!existing) {
                    await tx.weeklyReflection.create({
                        data: {
                            userId,
                            text: reflectionText,
                            updatedAt: itemUpdatedAt || new Date(),
                        },
                    });
                }
                else {
                    // Chống stale-write:
                    if (itemUpdatedAt) {
                        if (itemUpdatedAt >= existing.updatedAt) {
                            await tx.weeklyReflection.update({
                                where: { userId },
                                data: {
                                    text: reflectionText,
                                    updatedAt: itemUpdatedAt,
                                },
                            });
                        }
                        // Nếu itemUpdatedAt < existing.updatedAt -> BỎ QUA STALE WRITE, BẢO VỆ DỮ LIỆU MỚI HƠN TRÊN SERVER
                    }
                    else if (existing.text !== reflectionText) {
                        await tx.weeklyReflection.update({
                            where: { userId },
                            data: {
                                text: reflectionText,
                            },
                        });
                    }
                }
            }
            // 8. Upsert Tags
            if (payload.tags && payload.tags.length > 0) {
                for (const tagName of payload.tags) {
                    if (!tagName || typeof tagName !== "string")
                        continue;
                    const trimmed = tagName.trim();
                    if (!trimmed)
                        continue;
                    await tx.tag.upsert({
                        where: {
                            userId_name: {
                                userId,
                                name: trimmed,
                            },
                        },
                        create: {
                            userId,
                            name: trimmed,
                        },
                        update: {},
                    });
                }
            }
        });
        // Lấy lại dữ liệu đầy đủ sau sync
        const freshData = await this.getUserData(userId);
        // Phát broadcast WebSocket để các tab / điện thoại khác cùng tài khoản tự update ngay lập tức
        wsService.broadcastToUser(userId, {
            type: "REALTIME_DATA_UPDATE",
            payload: freshData,
        });
        return freshData;
    }
}
