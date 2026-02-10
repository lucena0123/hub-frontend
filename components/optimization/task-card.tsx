"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { OptimizationTask } from "@/types/optimization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, PlayCircle } from "lucide-react";

interface TaskCardProps {
    task: OptimizationTask;
}

export function TaskCard({ task }: TaskCardProps) {
    const input = task.input ?? {
        severity: 'low',
        description: 'Sem detalhes',
    };
    const severity = input.severity ?? 'low';
    const description = input.description ?? 'Sem detalhes';
    const autoAction = input.autoAction;
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: "task",
            task,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const getSeverityColor = (severity: string): 'destructive' | 'default' | 'secondary' => {
        switch (severity) {
            case "critical": return "destructive";
            case "high": return "destructive"; // or orange
            case "medium": return "default"; // or yellow
            default: return "secondary";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case "approved": return <PlayCircle className="w-4 h-4 text-blue-500" />;
            case "failed": return <AlertTriangle className="w-4 h-4 text-red-500" />;
            default: return null;
        }
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card className="cursor-grab hover:shadow-md transition bg-background border-l-4"
                style={{ borderLeftColor: severity === 'critical' ? 'red' : 'transparent' }}>
                <CardHeader className="p-3 pb-0 space-y-0">
                    <div className="flex justify-between items-start">
                        <Badge variant={getSeverityColor(severity)} className="text-[10px] px-1 h-5">
                            {severity.toUpperCase()}
                        </Badge>
                        {getStatusIcon(task.status)}
                    </div>
                    <CardTitle className="text-sm font-medium pt-2 leading-tight">
                        {task.name}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 text-xs text-muted-foreground">
                    <p className="line-clamp-2">{description}</p>
                    {autoAction && (
                        <div className="mt-2 text-[10px] bg-secondary p-1 rounded-sm flex items-center gap-1">
                            <span>🤖 Action:</span>
                            <span className="font-mono">{autoAction.type}</span>
                        </div>
                    )}
                    {task.status === 'completed' &&
                        typeof task.output === 'object' &&
                        task.output !== null &&
                        'success' in task.output &&
                        (task.output as { success?: unknown }).success === true && (
                        <div className="mt-2 text-[10px] text-green-600 flex items-center gap-1">
                            <span>✅ Executed</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
