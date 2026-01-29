export const mockCourseMaterials = {
    1: [
        {
            id: "t1",
            week: 1,
            topic: "Deadlocks",
            contents: [
                { id: "c1", type: "Slide", title: "Deadlock Slides", url: "/mock/Week1_Slides.pdf" },
                { id: "c2", type: "PDF", title: "Deadlock Notes", url: "/mock/Deadlock_Notes.pdf" },
                { id: "c3", type: "Code", title: "Deadlock Example Code", url: "/mock/Deadlock.java" },
            ],
        },
        {
            id: "t2",
            week: 2,
            topic: "Process Scheduling",
            contents: [
                { id: "c4", type: "Slide", title: "Scheduling Slides" },
                { id: "c5", type: "Code", title: "Scheduler Code" },
            ],
        },
    ],
};
