let mockNotebooks = [
    {
        id: "nb-1",
        name: "Dự án Task App",
        description: "Sổ tay thiết kế và phát triển ứng dụng Digital Sketchbook",
        color: "yellow",
        icon: "🎨",
        taskCount: 8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];
export class NotebookService {
    static async getAll() {
        return mockNotebooks;
    }
    static async create(data) {
        const newNotebook = {
            id: `nb-${Date.now()}`,
            name: data.name,
            description: data.description,
            color: data.color || "yellow",
            icon: data.icon || "📓",
            taskCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        mockNotebooks.push(newNotebook);
        return newNotebook;
    }
    static async update(id, data) {
        const index = mockNotebooks.findIndex((n) => n.id === id);
        if (index === -1)
            return null;
        mockNotebooks[index] = {
            ...mockNotebooks[index],
            ...data,
            updatedAt: new Date().toISOString(),
        };
        return mockNotebooks[index];
    }
}
