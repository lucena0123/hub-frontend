'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Loader2, Trash2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import {
    getLeadTracking,
    upsertLeadTracking,
    deleteLeadTracking,
    getCampaigns,
} from '@/lib/api/client';
import { type LeadTrackingData, type Campaign } from '@/types';

const formSchema = z.object({
    campaignId: z.string().min(1, 'Campanha é obrigatória'),
    date: z.string().min(1, 'Data é obrigatória'),
    qualifiedLeads: z.coerce.number().min(0, 'Deve ser maior ou igual a 0'),
    contractsClosed: z.coerce.number().min(0, 'Deve ser maior ou igual a 0'),
    revenueGenerated: z.coerce.number().min(0, 'Deve ser maior ou igual a 0'),
});

type FormInput = z.input<typeof formSchema>;
type FormData = z.output<typeof formSchema>;

interface ClientLeadTrackingProps {
    clientId: string;
}

export function ClientLeadTracking({ clientId }: ClientLeadTrackingProps) {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
    const [history, setHistory] = useState<LeadTrackingData[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormInput, unknown, FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            qualifiedLeads: 0,
            contractsClosed: 0,
            revenueGenerated: 0,
        },
    });

    const watchCampaignId = watch('campaignId');

    useEffect(() => {
        const loadCampaigns = async () => {
            try {
                const data = await getCampaigns();
                const clientCampaigns = data.filter((c) => c.clientId === clientId);
                setCampaigns(clientCampaigns);
                if (clientCampaigns.length > 0) {
                    const firstId = clientCampaigns[0].id;
                    setSelectedCampaignId(firstId);
                    setValue('campaignId', firstId);
                }
            } catch (err) {
                console.error('Failed to load campaigns', err);
            }
        };
        loadCampaigns();
    }, [clientId, setValue]);

    useEffect(() => {
        if (watchCampaignId) {
            setSelectedCampaignId(watchCampaignId);
        }
    }, [watchCampaignId]);


    const loadHistory = async (campId: string) => {
        setLoading(true);
        try {
            const data = await getLeadTracking(campId, { limit: 30 });
            setHistory(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (error) {
            console.error('Failed to load history', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedCampaignId) {
            loadHistory(selectedCampaignId);
        }
    }, [selectedCampaignId]);

    const onSubmit = async (values: FormData) => {
        setSaving(true);
        try {
            await upsertLeadTracking({
                campaignId: values.campaignId,
                date: values.date,
                qualifiedLeads: values.qualifiedLeads,
                contractsClosed: values.contractsClosed,
                revenueGenerated: values.revenueGenerated,
            });
            await loadHistory(values.campaignId);
            // Keep campaign and date, reset metrics
            reset({
                campaignId: values.campaignId,
                date: values.date,
                qualifiedLeads: 0,
                contractsClosed: 0,
                revenueGenerated: 0,
            });
        } catch (error) {
            console.error('Failed to save', error);
            alert('Erro ao salvar dados. Verifique a conexão.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (date: string) => {
        if (!confirm('Tem certeza que deseja remover este registro?')) return;
        try {
            await deleteLeadTracking(selectedCampaignId, date);
            await loadHistory(selectedCampaignId);
        } catch (error) {
            console.error('Failed to delete', error);
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Registro Diário</CardTitle>
                    <CardDescription>
                        Insira os resultados manuais do funil para esta campanha.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="campaignId">Campanha</Label>
                            <Select
                                onValueChange={(val) => {
                                    setValue('campaignId', val);
                                    setSelectedCampaignId(val);
                                }}
                                value={watchCampaignId}
                            >
                                <SelectTrigger id="campaignId">
                                    <SelectValue placeholder="Selecione a campanha" />
                                </SelectTrigger>
                                <SelectContent>
                                    {campaigns.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.campaignId && (
                                <p className="text-sm text-destructive">{errors.campaignId.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Data</Label>
                            <Input
                                type="date"
                                id="date"
                                {...register('date')}
                            />
                            {errors.date && (
                                <p className="text-sm text-destructive">{errors.date.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="qualifiedLeads">Leads Qualificados</Label>
                                <Input
                                    type="number"
                                    id="qualifiedLeads"
                                    min="0"
                                    {...register('qualifiedLeads')}
                                />
                                {errors.qualifiedLeads && (
                                    <p className="text-sm text-destructive">{errors.qualifiedLeads.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contractsClosed">Fechamentos</Label>
                                <Input
                                    type="number"
                                    id="contractsClosed"
                                    min="0"
                                    {...register('contractsClosed')}
                                />
                                {errors.contractsClosed && (
                                    <p className="text-sm text-destructive">{errors.contractsClosed.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="revenueGenerated">Receita Total (R$)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                id="revenueGenerated"
                                min="0"
                                {...register('revenueGenerated')}
                            />
                            {errors.revenueGenerated && (
                                <p className="text-sm text-destructive">{errors.revenueGenerated.message}</p>
                            )}
                        </div>

                        <Button type="submit" disabled={saving || campaigns.length === 0} className="w-full">
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Dados
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Histórico Recente</CardTitle>
                    <CardDescription>
                        Últimos registros desta campanha.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border h-[400px] overflow-y-auto relative">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead className="text-right">Qualif.</TableHead>
                                    <TableHead className="text-right">Vendas</TableHead>
                                    <TableHead className="text-right">Receita</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            <div className="flex items-center justify-center">
                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : history.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            Nenhum dado registrado para esta campanha.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    history.map((item) => (
                                        <TableRow key={item.date}>
                                            <TableCell>{format(new Date(item.date), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell className="text-right">{item.qualifiedLeads}</TableCell>
                                            <TableCell className="text-right">{item.contractsClosed}</TableCell>
                                            <TableCell className="text-right">
                                                {new Intl.NumberFormat('pt-BR', {
                                                    style: 'currency',
                                                    currency: 'BRL',
                                                }).format(item.revenueGenerated)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive"
                                                    onClick={() => handleDelete(item.date)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
