import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { api } from './services/api';
import { FiCheck } from 'react-icons/fi';
import confetti from 'canvas-confetti';
import { LoadingAnimation } from './components/LoadingAnimation';
import './styles/main.css';

function App() {
  const [candidates, setCandidates] = useState([]);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [votingStatus, setVotingStatus] = useState(null);

  useEffect(() => {
    WebApp.ready();
    checkVotingStatus();
    const interval = setInterval(checkVotingStatus, 30000); // check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (votingStatus?.status === 'active') {
      fetchCandidates();
      checkIfVoted();
    }
  }, [votingStatus]);

  const checkVotingStatus = async () => {
    try {
      const status = await api.getVotingStatus();
      setVotingStatus(status);
      setLoading(false);
    } catch (err) {
      setError('Ошибка при проверке статуса голосования');
      setLoading(false);
    }
  };

  const triggerConfetti = () => {
    // Конфетти
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
        scalar: 1.2
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      origin: { x: 0.2 }
    });
    fire(0.2, {
      spread: 60,
      origin: { x: 0.5 }
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      origin: { x: 0.8 }
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      origin: { x: 0.5 }
    });
  };

  const handleVote = async (candidateId) => {
    try {
      setLoading(true);
      await api.vote({
        telegramUserId: WebApp.initDataUnsafe.user.id,
        candidateId: candidateId
      });
      
      setVoted(true);
      await fetchCandidates();
      triggerConfetti(); // Запуск конфетти
    } catch (err) {
      setError('Ошибка при голосовании');
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      const data = await api.getCandidates();
      setCandidates(data);
    } catch (err) {
      setError('Ошибка при загрузке кандидатов');
    } finally {
      setLoading(false);
    }
  };

  const checkIfVoted = async () => {
    try {
      const hasVoted = await api.checkVote(WebApp.initDataUnsafe.user.id);
      setVoted(hasVoted);
      if (hasVoted) {
        triggerConfetti(); // Запускаем конфетти если пользователь уже проголосовал
      }
    } catch (err) {
      console.error('Error checking vote status:', err);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <main className="main-content">
          <div className="loading">Загрузка...</div>
        </main>
      </div>
    );
  }

  if (votingStatus?.status === 'pending') {
    return (
      <div className="app-container">
        <main className="main-content">
          <div className="status-message pending">
            <LoadingAnimation />
            <h2>Голосование еще не началось</h2>
            {votingStatus.startTime && (
              <p>Начало: {new Date(votingStatus.startTime).toLocaleString()}</p>
            )}
          </div>
        </main>
        <footer className="footer">
          <p>© 2024 Система голосования</p>
          <p>React test</p>
        </footer>
      </div>
    );
  }

  if (votingStatus?.status === 'finished') {
    return (
      <div className="app-container">
        <main className="main-content">
          <div className="status-message finished">
            <h2>Голосование завершено</h2>
            <p>Спасибо за участие!</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <main className="main-content">
        {voted && (
          <div className="alert">
            <span>Вы уже проголосовали. Спасибо за участие!</span>
          </div>
        )}

        <div className="candidates-list">
          {candidates.map((candidate, index) => (
            <div 
              key={candidate.id} 
              className="candidate-item"
              style={{"--index": index}}
            >
              <span className="candidate-name">{candidate.name}</span>
              <button 
                onClick={() => handleVote(candidate.id)}
                disabled={voted || loading}
                className="vote-button"
                aria-label="Голосовать"
              >
                <FiCheck />
              </button>
            </div>
          ))}
        </div>
      </main>

      <footer className="footer">
        <p>© 2024 Voting System</p>
        <p>Made by h4sh.ru </p>
      </footer>
    </div>
  );
}

export default App; 