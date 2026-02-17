"use client";

import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Zap, TrendingUp, DollarSign } from "lucide-react";
import { OptimizationRule } from "@/types/optimization";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useOptimizationStore } from "@/lib/stores/optimization-store";
import { useEffect } from "react";
import { RuleConfigDialog } from "./rule-config-dialog";
import { Settings } from "lucide-react";

const getRuleIcon = (rule: OptimizationRule, enabled: boolean) => {
    const color = enabled ? "" : "text-muted-foreground";
    if (rule.category === 'campaign' || rule.id.includes('campaign') || rule.id.includes('cpl') || rule.id.includes('budget')) {
        return <DollarSign className={cn("w-4 h-4", enabled ? "text-emerald-400" : color)} />;
    }
    if (rule.category === 'adset' || rule.id.includes('adset') || rule.action === 'scale') {
        return <TrendingUp className={cn("w-4 h-4", enabled ? "text-primary" : color)} />;
    }
    if (rule.category === 'creative' || rule.id.includes('creative') || rule.id.includes('copy')) {
        return <Zap className={cn("w-4 h-4", enabled ? "text-amber-400" : color)} />;
    }
    return <BookOpen className="w-4 h-4" />;
};

function DraggableRule({
    rule,
    enabled,
    onToggle,
    onConfig,
    readOnly,
}: {
    rule: OptimizationRule,
    enabled: boolean,
    onToggle: (val: boolean) => void,
    onConfig: () => void,
    readOnly: boolean,
}) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `rule-${rule.id}`,
        data: {
            type: 'rule',
            rule
        },
        disabled: !enabled || readOnly
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} className="mb-2 relative group">
            <Card className={cn(
                "transition-all border-dashed",
                enabled ? "cursor-grab hover:shadow-md bg-background" : "opacity-60 bg-muted"
            )}>
                <CardHeader className="p-3 pb-2 space-y-0 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2" {...(enabled ? listeners : {})} {...(enabled ? attributes : {})}>
                        {getRuleIcon(rule, enabled)}
                        <CardTitle className="text-xs font-medium">{rule.title ?? rule.name ?? rule.id}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onConfig}
                            disabled={readOnly}
                            className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Settings className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <Switch
                            checked={enabled}
                            onCheckedChange={onToggle}
                            disabled={readOnly}
                            className="scale-75"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 text-[10px] text-muted-foreground">
                    {rule.description}
                </CardContent>
            </Card>
        </div>
    );
}

export function RuleLibrary({ readOnly = false }: { readOnly?: boolean }) {
    const { rules, fetchRules, toggleRule, selectedClientId } = useOptimizationStore();

    const [configOpen, setConfigOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<OptimizationRule | null>(null);

    useEffect(() => {
        // We might want to fetch rules here if valid client is selected, 
        // but typically the board handles the main fetch.
        // However, keeping it safe.
        if (selectedClientId) fetchRules(selectedClientId);
    }, [fetchRules, selectedClientId]);

    const handleToggle = async (id: string, val: boolean) => {
        if (selectedClientId) {
            await toggleRule(id, val, selectedClientId);
        } else {
            console.warn("No client selected, rule toggle not saved.");
        }
    }

    const handleConfig = (rule: OptimizationRule) => {
        setSelectedRule(rule);
        setConfigOpen(true);
    };

    return (
        <div className="w-[220px] border-r border-border/60 h-full flex flex-col bg-card/40">
            <RuleConfigDialog
                key={selectedRule?.id ?? 'rule-config'}
                open={configOpen}
                onOpenChange={setConfigOpen}
                rule={selectedRule}
            />

            <div className="p-4 border-b border-border/60">
                <h2 className="font-semibold text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Playbook
                </h2>
                <p className="text-[10px] text-muted-foreground mt-1">
                    Ative ou desative regras para este cliente.
                </p>
            </div>
            <ScrollArea className="flex-1 p-3">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase">Regras ({rules.length})</h3>
                    </div>
                    {rules.length === 0 ? (
                        <div className="text-xs text-muted-foreground text-center py-4">
                            Carregando regras...
                        </div>
                    ) : rules.map(rule => (
                        <DraggableRule
                            key={rule.id}
                            rule={rule}
                            enabled={rule.enabled ?? true}
                            onToggle={(val) => handleToggle(rule.id, val)}
                            onConfig={() => handleConfig(rule)}
                            readOnly={readOnly}
                        />
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
