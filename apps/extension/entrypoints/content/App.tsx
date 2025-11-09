import { PortalContext } from '@/contexts/PortalContext';
import { WalletButton } from '@/components/WalletButton';
import { CreateButton } from '@/components/CreateButton';

interface ContentAppProps {
  address?: string;
  portalTarget: HTMLElement;
  type: 'wallet' | 'create';
}

export function ContentApp({ address, portalTarget, type }: ContentAppProps) {
  return (
    <PortalContext.Provider value={portalTarget}>
      {type === 'wallet' && address ? (
        <WalletButton address={address} />
      ) : (
        <CreateButton />
      )}
    </PortalContext.Provider>
  );
}
