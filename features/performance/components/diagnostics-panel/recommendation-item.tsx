import { Sparkles, Wand2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { OptimizationCenterItem } from '@/types';

import {
  actionIconMap,
  actionLabelMap,
  severityBorder,
  severityColor,
  severityIcon,
  severityLabel,
} from './constants';

export function RecommendationItem({ item }: { item: OptimizationCenterItem }) {
  const SevIcon = severityIcon[item.severity] ?? Sparkles;
  const ActionIcon = actionIconMap[item.action] ?? Wand2;
  const actionLabel = actionLabelMap[item.action] ?? item.action;

  return (
    <div className={`rounded-[2px] border border-l-2 ${severityBorder[item.severity]} p-3`}>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={`text-[10px] ${severityColor[item.severity]}`}>
            <SevIcon className="h-3 w-3 mr-0.5" />
            {severityLabel[item.severity]}
          </Badge>
          <Badge variant="outline" className="text-[10px] flex items-center gap-1">
            <ActionIcon className="h-3 w-3" />
            {actionLabel}
          </Badge>
          {item.entity?.name && (
            <span className="text-xs text-muted-foreground truncate max-w-[300px]">
              {item.entity.name}
            </span>
          )}
        </div>
        <p className="text-sm font-medium">{item.title}</p>
        <p className="text-xs text-muted-foreground">{item.description}</p>
      </div>
    </div>
  );
}
