import Link from 'next/link';
import type { Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AUTO_THEME_VALUE } from './use-campaign-table-state';

type ThemeOption = {
  key: string;
  name: string;
};

type SaveInfo = {
  status: 'idle' | 'saving' | 'error';
  message?: string;
};

interface CampaignThemeControlsProps {
  campaignId: string;
  clientId: string;
  draftSubtheme: string;
  handleSubthemeSave: (campaignId: string) => void;
  handleThemeChange: (campaignId: string, value: string) => void;
  isSaving: boolean;
  saveInfo?: SaveInfo;
  setSubthemeDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  subthemeDirty: boolean;
  themeDisabled: boolean;
  themeKey: string | null;
  themeOptions: ThemeOption[];
  themeSelectValue: string;
}

export function CampaignThemeControls({
  campaignId,
  clientId,
  draftSubtheme,
  handleSubthemeSave,
  handleThemeChange,
  isSaving,
  saveInfo,
  setSubthemeDrafts,
  subthemeDirty,
  themeDisabled,
  themeKey,
  themeOptions,
  themeSelectValue,
}: CampaignThemeControlsProps) {
  const hasError = saveInfo?.status === 'error';

  return (
    <div className="grid gap-2">
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Tema & Subtema</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select
          value={themeSelectValue}
          onValueChange={(value) => handleThemeChange(campaignId, value)}
          disabled={themeDisabled}
        >
          <SelectTrigger className="h-8 min-w-[200px]">
            <SelectValue placeholder="Definir tema" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={AUTO_THEME_VALUE}>Automático</SelectItem>
            {themeOptions.map((theme) => (
              <SelectItem key={theme.key} value={theme.key}>
                {theme.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input
            value={draftSubtheme}
            onChange={(event) =>
              setSubthemeDrafts((prev) => ({
                ...prev,
                [campaignId]: event.target.value,
              }))
            }
            placeholder={themeKey ? 'Subtema (opcional)' : 'Selecione um tema'}
            disabled={!themeKey || isSaving}
            className="h-8"
          />
          <Button
            size="xs"
            variant="outline"
            onClick={() => handleSubthemeSave(campaignId)}
            disabled={!themeKey || isSaving || !subthemeDirty}
          >
            Salvar
          </Button>
        </div>
      </div>
      {isSaving && (
        <span className="text-xs text-muted-foreground">Salvando...</span>
      )}
      {hasError && (
        <span className="text-xs text-rose-600">{saveInfo?.message ?? 'Falha ao salvar.'}</span>
      )}

      <div className="pt-1">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Ações rápidas</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="xs" variant="outline" asChild>
            <Link href={`/optimization/board?clientId=${clientId}`}>Ir para board</Link>
          </Button>
          <Button size="xs" variant="outline" asChild>
            <Link href={`/optimization/settings?clientId=${clientId}`}>Ajustar regras</Link>
          </Button>
          <Button size="xs" variant="outline" asChild>
            <Link href={`/optimization/effectiveness?clientId=${clientId}`}>Ver efetividade</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
