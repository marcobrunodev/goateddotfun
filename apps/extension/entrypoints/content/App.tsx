import { PortalContext } from '@/contexts/PortalContext';
import { WalletButton } from '@/components/WalletButton';

interface ContentAppProps {
  address: string;
  portalTarget: HTMLElement;
}

export function ContentApp({ address, portalTarget }: ContentAppProps) {
  return (
    <PortalContext.Provider value={portalTarget}>
      <WalletButton address={address} />
    </PortalContext.Provider>
  );
}
