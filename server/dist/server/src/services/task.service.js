// In-memory mock service sẵn sàng chuyển sang Prisma
let mockTasks = [
    {
        id: "task-1",
        title: "Nghiên cứu tài liệu Design System và AGENTS.md",
        dueDate: "09:30",
        tag: "Học tập",
        completed: true,
        status: "completed",
        priority: "high",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "task-2",
        title: "Khởi tạo bộ khung Monorepo",
        dueDate: "14:00",
        tag: "Công việc",
        completed: false,
        status: "in_progress",
        priority: "medium",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];
export class TaskService {
    static async getAllTasks() {
        return mockTasks;
    }
    static async createTask(data) {
        const newTask = {
            id: `task-${Date.now()}`,
            title: data.title,
            description: data.description,
            dueDate: data.dueDate,
            tag: data.tag,
            priority: data.priority || "medium",
            status: "todo",
            completed: false,
            notebookId: data.notebookId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        mockTasks.unshift(newTask);
        return newTask;
    }
    static async updateTask(id, data) {
        const taskIndex = mockTasks.findIndex((t) => t.id === id);
        if (taskIndex === -1)
            return null;
        mockTasks[taskIndex] = {
            ...mockTasks[taskIndex],
            ...data,
            updatedAt: new Date().toISOString(),
        };
        return mockTasks[taskIndex];
    }
    static async deleteTask(id) {
        const prevLength = mockTasks.length;
        mockTasks = mockTasks.filter((t) => t.id !== id);
        return mockTasks.length < prevLength;
    }
}
