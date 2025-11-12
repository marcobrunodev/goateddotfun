import { useState, useEffect } from 'react';
import './App.css';
import goat from '@/assets/goat.png';

function App() {
  const [tweetUrl, setTweetUrl] = useState('');
  const [prizeAmount, setPrizeAmount] = useState('');
  const [winnerCount, setWinnerCount] = useState('1');
  const [endDate, setEndDate] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Busca a URL do tweet do background script
    browser.runtime.sendMessage({ action: 'getTweetUrl' }).then((response) => {
      if (response?.tweetUrl) {
        setTweetUrl(response.tweetUrl);
      }
    });
  }, []);

  const shortenUrl = (url: string) => {
    if (url.length <= 40) return url;
    const start = url.substring(0, 25);
    const end = url.substring(url.length - 15);
    return `${start}...${end}`;
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(tweetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raffleData = {
      tweet_url: tweetUrl,
      prize_amount: parseFloat(prizeAmount),
      end_date: new Date(endDate).getTime() / 1000, // Convert to Unix timestamp
      winner_count: parseInt(winnerCount),
    };
    console.log('Creating raffle:', raffleData);
    // TODO: Adicionar lógica para criar a raffle on-chain
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="header-icon">
            <img src={goat} />
          </div>
          <div className="header-text">
            <h1>Raffle</h1>
            <p>Create New Raffle</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="content-wrapper">
          

          <form onSubmit={handleSubmit} className="task-form">
            <div className="form-field">
              <label>Tweet Link</label>
              {tweetUrl ? (
                <div className="tweet-link-container">
                  <a
                    href={tweetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tweet-link"
                  >
                    {shortenUrl(tweetUrl)}
                  </a>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="copy-button"
                    title="Copy URL"
                  >
                    {copied ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    )}
                  </button>
                </div>
              ) : (
                <span className="tweet-link-placeholder">No tweet selected</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-field prize-field">
                <label htmlFor="prizeAmount">Prize Pool</label>
                <input
                  type="number"
                  id="prizeAmount"
                  value={prizeAmount}
                  onChange={(e) => setPrizeAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.001"
                  min="0"
                  required
                />
                <span className="field-info">Total SOL to distribute</span>
              </div>

              <div className="form-field winner-field">
                <label htmlFor="winnerCount">Winners</label>
                <input
                  type="number"
                  id="winnerCount"
                  value={winnerCount}
                  onChange={(e) => setWinnerCount(e.target.value)}
                  placeholder="1"
                  min="1"
                  max="100"
                  required
                />
                <span className="field-info">
                  {prizeAmount && winnerCount && parseFloat(prizeAmount) > 0 && parseInt(winnerCount) > 0
                    ? `${(parseFloat(prizeAmount) / parseInt(winnerCount)).toFixed(3)} SOL each`
                    : 'Number of winners'}
                </span>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="endDate">End Date & Time</label>
              <input
                type="datetime-local"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
              <span className="field-info">
                {endDate
                  ? `Ends ${new Date(endDate).toLocaleString()}`
                  : 'When should the raffle end?'}
              </span>
            </div>

            <button type="submit" className="submit-button">
              Create Raffle
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default App;
