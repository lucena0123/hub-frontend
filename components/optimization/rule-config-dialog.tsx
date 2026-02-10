"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useMemo, useState } from "react";
import { OptimizationRule } from "@/types/optimization";
import { useOptimizationStore } from "@/lib/stores/optimization-store";
import Ajv from "ajv";
import type { ErrorObject } from "ajv";
import axios from "axios";

interface RuleConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rule: OptimizationRule | null;
    clientId?: string;
}

export function RuleConfigDialog({ open, onOpenChange, rule, clientId }: RuleConfigDialogProps) {
    const { updateRuleConfig, selectedClientId } = useOptimizationStore();
    const [jsonParams, setJsonParams] = useState("{}");
    const [isValid, setIsValid] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [schemaErrors, setSchemaErrors] = useState<string[]>([]);

    const ajv = useMemo(() => new Ajv({ allErrors: true, strict: false }), []);
    const schemaValidator = useMemo(() => {
        if (!rule?.parametersSchema || typeof rule.parametersSchema !== 'object') return null;
        try {
            return ajv.compile(rule.parametersSchema as Record<string, unknown>);
        } catch (err) {
            return null;
        }
    }, [ajv, rule?.parametersSchema]);

    useEffect(() => {
        if (rule?.parameters) {
            setJsonParams(JSON.stringify(rule.parameters, null, 2));
            setIsValid(true);
            setSchemaErrors([]);
        } else {
            setJsonParams("{}");
            setIsValid(true);
            setSchemaErrors([]);
        }
    }, [rule]);

    useEffect(() => {
        if (!open) return;
        if (!schemaValidator) {
            setSchemaErrors([]);
            return;
        }
        try {
            const parsed = JSON.parse(jsonParams);
            const valid = schemaValidator(parsed);
            if (!valid) {
                const errs = (schemaValidator.errors ?? []).map((e) => formatSchemaError(e));
                setSchemaErrors(errs);
            } else {
                setSchemaErrors([]);
            }
        } catch (_) {
            setSchemaErrors([]);
        }
    }, [jsonParams, schemaValidator, open]);

    const handleChange = (val: string) => {
        setJsonParams(val);
        setErrorMessage(null);
        try {
            const parsed = JSON.parse(val);
            setIsValid(true);
            if (schemaValidator) {
                const valid = schemaValidator(parsed);
                if (!valid) {
                    const errs = (schemaValidator.errors ?? []).map((e) => formatSchemaError(e));
                    setSchemaErrors(errs);
                } else {
                    setSchemaErrors([]);
                }
            } else {
                setSchemaErrors([]);
            }
        } catch (e) {
            setIsValid(false);
            setSchemaErrors([]);
        }
    };

    const handleSave = async () => {
        if (!rule || !isValid) return;
        const effectiveClientId = clientId ?? selectedClientId;
        if (!effectiveClientId) {
            alert("Nenhum cliente selecionado.");
            return;
        }

        try {
            const params = JSON.parse(jsonParams);
            if (schemaValidator) {
                const valid = schemaValidator(params);
                if (!valid) {
                    const errs = (schemaValidator.errors ?? []).map((e) => formatSchemaError(e));
                    setSchemaErrors(errs);
                    return;
                }
            }
            await updateRuleConfig(rule.id, params, effectiveClientId);
            // alert(`Regra ${rule.title ?? rule.name ?? rule.id} atualizada.`); // Optional feedback
            onOpenChange(false);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const data = error.response?.data as { error?: string; details?: Array<{ message?: string }> } | undefined;
                if (data?.details?.length) {
                    setErrorMessage(data.details.map((d) => d.message).filter(Boolean).join(' · '));
                } else {
                    setErrorMessage(data?.error ?? error.message);
                }
            } else {
                const message = error instanceof Error ? error.message : 'Erro ao salvar configuração.';
                setErrorMessage(message);
            }
        }
    };

    const formatSchemaError = (err: ErrorObject) => {
        const path = err.instancePath ? err.instancePath : '(root)';
        const message = err.message ?? 'invalid';
        return `${path} ${message}`;
    };

    if (!rule) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Configurar: {rule.title ?? rule.name ?? rule.id}</DialogTitle>
                    <DialogDescription>
                        Ajuste os parâmetros desta regra. Use formato JSON.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="params">Parâmetros (JSON)</Label>
                        <Textarea
                            id="params"
                            value={jsonParams}
                            onChange={(e) => handleChange(e.target.value)}
                            className={`font-mono text-xs h-[200px] ${!isValid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        />
                        {!isValid && <span className="text-[10px] text-red-500">JSON Inválido</span>}
                        {errorMessage && <span className="text-[10px] text-red-500">{errorMessage}</span>}
                    </div>
                    {schemaErrors.length > 0 && (
                        <div className="rounded-md border border-amber-200 bg-amber-50/60 p-2 text-[11px] text-amber-700">
                            <p className="text-[10px] uppercase tracking-widest text-amber-700/70">Erros de validação</p>
                            <div className="mt-2 space-y-1">
                                {schemaErrors.map((err, idx) => (
                                    <div key={`${err}-${idx}`}>{err}</div>
                                ))}
                            </div>
                        </div>
                    )}
                    {rule.parametersSchema && (
                        <div className="rounded-md border bg-muted/30 p-2">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Schema</p>
                            <pre className="mt-2 max-h-[160px] overflow-auto text-[11px] text-foreground">
                                {JSON.stringify(rule.parametersSchema, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!isValid}>Salvar Alterações</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
