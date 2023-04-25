interface Project {
    id: string;
    name: string;
    description: string;
    teacherId: string;
    capacity: number;
    cost: number;
    minimumGrade: number;
    maximumGrade: number;
}

export { Project };