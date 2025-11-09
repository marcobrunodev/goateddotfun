import { useState, useRef, useEffect } from 'react'
import confetti from 'canvas-confetti'
import goat from '@/assets/goat.png';
import solLight from '@/assets/sol-light.png';
import solDark from '@/assets/sol-dark.png';
import './WalletButton.css'

interface WalletButtonProps {
  address: string;
}

type TwitterTheme = 'light' | 'dim' | 'dark' ;

export function WalletButton({ address }: WalletButtonProps) {
  const [isActive, setIsActive] = useState(false);
  const [theme, setTheme] = useState<TwitterTheme>('light');
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const detectTheme = () => {
      const $html = document.querySelector('html');
      const htmlTheme = $html?.style.colorScheme;

      if (htmlTheme === 'light' || htmlTheme === 'dim' || htmlTheme === 'dark') {
        setTheme(htmlTheme as TwitterTheme);
      } else {
        setTheme('light');
      }
    };

    detectTheme();

    // Observa mudanças no tema
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          detectTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isActive) {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;
        const colorsDark = ['#FFD700', '#FFA500', '#FFAA00', '#FFB732', '#DAA520', '#B8860B']
        const colorsLight = ['#FF5733', '#FF8D1A', '#FFC300', '#DAF7A6', '#33FF57', '#33FFF3']

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { x, y },
          colors: theme === 'light' ? colorsLight : colorsDark
        });

        setTimeout(() => {
          setIsActive(true);
        }, 2000);
      }
    }
  };

  return (
    <div
      data-theme={theme}
      className={`goat ${isActive ? '-active' : ''}`}
      onClick={handleClick}
    >
      <p className="prize">
        <img src={theme === 'light' ? solLight : solDark} />
        <span>0.3</span>
      </p>
      <button className="wrapper-animation-border" ref={buttonRef}>
        <div className="animation-border">
          <div className="goat-img-container">
            <img src={goat} className="goat-img" style={{ height: "22px" }} />
          </div>
        </div>
      </button>
    </div>
  );
}
