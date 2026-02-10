"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { OptimizationTask, BoardColumn as ColumnType } from "@/types/optimization";
import { TaskCard } from "./task-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface BoardColumnProps {
    column: ColumnType;
    tasks: OptimizationTask[];
}

export function BoardColumn({ column, tasks }: BoardColumnProps) {
    const { setNodeRef } = useDroppable({
        id: column.id,
        data: {
            type: "column",
            column,
        },
    });

    return (
        <div className="flex flex-col h-full bg-muted/50 rounded-lg border w-80 shrink-0">
            <div className="p-4 border-b bg-background/50 backdrop-blur pb-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{column.title}</h3>
                    <Badge variant="secondary" className="text-xs bg-muted-foreground/10 text-muted-foreground">{tasks.length}</Badge>
                </div>
            </div>

            <ScrollArea className="flex-1 p-2">
                <div ref={setNodeRef} className="flex flex-col gap-2 min-h-[150px]">
                    <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                        {tasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                        ))}
                    </SortableContext>
                    {tasks.length === 0 && (
                        <div className="h-24 flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed rounded-md m-1">
                            Drop here
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
