import { useState, useEffect } from 'react';
import ticket from '@/assets/ticket.svg';
import './CreateButton.css';

type TwitterTheme = 'light' | 'dim' | 'dark';

export function CreateButton() {
  const [theme, setTheme] = useState<TwitterTheme>('light');

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

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('Create button clicked!');
    // TODO: Adicionar lógica de criação de task
  };

  return (
    <button
      data-theme={theme}
      className="create-button"
      onClick={handleClick}
      aria-label="Create task"
    >
      <img src={ticket} alt="Ticket" className="ticket-icon" />
      <span className="create-text">Create</span>
    </button>
  );
}
