
"use client";

import { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getClients } from "@/lib/api/client/clients";
import { Client } from "@/types";
import { Users } from "lucide-react";

interface ClientSelectProps {
    value?: string;
    onChange: (value: string) => void;
    className?: string;
}

export function ClientSelect({ value, onChange, className }: ClientSelectProps) {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            try {
                const data = await getClients();
                setClients(data);
            } catch (error) {
                console.error("Failed to fetch clients", error);
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, []);

    return (
        <div className={className}>
            <Select value={value} onValueChange={onChange} disabled={loading}>
                <SelectTrigger className="w-[200px]">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Filtrar por Cliente" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">
                        Todos os Clientes
                    </SelectItem>
                    {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                            {client.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
