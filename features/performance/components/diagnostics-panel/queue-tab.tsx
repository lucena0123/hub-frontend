import { RefreshCw } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import type { ActionProposal } from '@/types';
import { ProposalItem } from './proposal-item';

interface QueueTabProps {
  actingId: string | null;
  handleApprove: (proposalId: string) => void;
  handleExecute: (proposalId: string) => void;
  handleReject: (proposalId: string) => void;
  proposals: ActionProposal[];
  queueLoading: boolean;
  reasonsById: Record<string, string>;
  refresh: () => void;
  setReasonsById: Dispatch<SetStateAction<Record<string, string>>>;
}

export function QueueTab({
  actingId,
  handleApprove,
  handleExecute,
  handleReject,
  proposals,
  queueLoading,
  reasonsById,
  refresh,
  setReasonsById,
}: QueueTabProps) {
  return (
    <>
      <div className="flex items-center justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={queueLoading}
          className="text-xs"
        >
          <RefreshCw className={`h-3 w-3 ${queueLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {queueLoading ? (
        <p className="text-sm text-muted-foreground py-4">Carregando fila...</p>
      ) : proposals.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          Nenhuma proposta. Clique em <strong>Gerar propostas</strong> para criar
          sugestões do playbook.
        </p>
      ) : (
        <div className="space-y-2">
          {proposals.map((proposal) => (
            <ProposalItem
              key={proposal.proposalId}
              proposal={proposal}
              busy={actingId === proposal.proposalId}
              reason={reasonsById[proposal.proposalId] ?? ''}
              onReasonChange={(value) =>
                setReasonsById((previous) => ({ ...previous, [proposal.proposalId]: value }))
              }
              onApprove={() => handleApprove(proposal.proposalId)}
              onReject={() => handleReject(proposal.proposalId)}
              onExecute={() => handleExecute(proposal.proposalId)}
            />
          ))}
        </div>
      )}
    </>
  );
}
