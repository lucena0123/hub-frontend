import { Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CreativePerformanceLoadingCard() {
  return (
    <Card className="border-l-4 border-l-pink-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Performance de Criativos</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

export function CreativePerformanceEmptyState() {
  return (
    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
      Nenhum dado de criativos no período selecionado. Se a campanha não teve entrega, isso é esperado; caso contrário, execute o sync com syncLevel &quot;ad&quot; ou &quot;full&quot;.
    </div>
  );
}
