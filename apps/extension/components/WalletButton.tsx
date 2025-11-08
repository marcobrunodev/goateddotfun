import goat from '@/assets/goat.png';
import sol from '@/assets/sol.png';
import './WalletButton.css'

interface WalletButtonProps {
  address: string;
}

export function WalletButton({ address }: WalletButtonProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    console.log('Wallet address clicked:', address);
  };

  const b = 3;
  const r = Math.round(0.25 * b);

  return (
    <div className="inline-flex items-center gap-1 ml-2">
      <p className='goat-img-wrapper'>
        <img src={sol} />
        <span>0.3</span>
      </p>
      <button style={{
        height: "34px",
        width: "34px",
        marginLeft: "5px",
        background: "black",
        padding: 0,
      }}>
        <div className="wrapper">
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "2px",
            background: "#f4e6c4",
            height: "28px",
            width: "28px",
            position: "relative",
          }}>
            <img src={goat} className="goat-img" style={{ height: "22px" }} />
          </div>
        </div>
      </button>
    </div>
  );
}
