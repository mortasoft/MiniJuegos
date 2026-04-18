import React, { useState, useEffect, useRef } from 'react';
import PhaserGame from './components/PhaserGame';
import './index.css';
import gameOverSoundUrl from './assets/sounds/gameover.mp3';

function App() {
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lines, setLines] = useState(0);
  const [integrity, setIntegrity] = useState(100);
  const [speed, setSpeed] = useState(1);
  const [gameState, setGameState] = useState('start');
  const [difficulty, setDifficulty] = useState('easy');
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('data-tetris-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [leaderboard, setLeaderboard] = useState(() => {
    const saved = localStorage.getItem('data-tetris-leaderboard');
    return saved ? JSON.parse(saved) : [];
  });

  // Pre-load the gameover sound so it's ready to play instantly
  const gameOverAudioRef = useRef(null);
  useEffect(() => {
    gameOverAudioRef.current = new Audio(gameOverSoundUrl);
    gameOverAudioRef.current.volume = 0.7;
    gameOverAudioRef.current.load();
  }, []);

  useEffect(() => {
    window.onIntegrityChange = (val) => setIntegrity(val);
    window.onGameOver = () => {
      // Play sound first, synchronously, before any state change
      if (gameOverAudioRef.current) {
        gameOverAudioRef.current.currentTime = 0;
        gameOverAudioRef.current.play().catch(e => console.log("Audio blocked:", e));
      }
      // Update leaderboard with current score
      setScore(prev => {
        setLeaderboard(prevBoard => {
          const newBoard = [...prevBoard, prev]
            .sort((a, b) => b - a)
            .slice(0, 10);
          localStorage.setItem('data-tetris-leaderboard', JSON.stringify(newBoard));
          return newBoard;
        });
        if (prev > highScore) {
          setHighScore(prev);
          localStorage.setItem('data-tetris-highscore', prev);
        }
        return prev;
      });
      setGameState('gameover');
    };
    return () => {
      delete window.onIntegrityChange;
      delete window.onGameOver;
    };
  }, []);

  const handleScoreChange = (newScore, newCombo) => {
    setScore(newScore);
    setCombo(newCombo);
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('data-tetris-highscore', newScore);
    }
  };

  const startGame = () => {
    setScore(0);
    setCombo(0);
    setLines(0);
    setIntegrity(100);
    setSpeed(1);
    setGameState('playing');
  };

  return (
    <div className="app-container">
      <div className="background-effects">
        <div className="glow glow-1"></div>
        <div className="glow glow-2"></div>
      </div>

      <main className="game-wrapper">
        <header className="game-header">
          <div className="logo-container">
            <div className="logo-wrapper">
              <div className="logo-circuits left"></div>
              <div className="logo-main">
                <span className="logo-data">DATA</span>
                <span className="logo-tetris">TETRIS</span>
              </div>
              <div className="logo-circuits right"></div>

              <div className="logo-decorations">
                <div className="bit b1">1</div>
                <div className="bit b2">0</div>
                <div className="bit b3">1</div>
                <div className="piece-shadow p1"></div>
                <div className="piece-shadow p2"></div>
              </div>
            </div>
            <p className="logo-slogan">Misión: Clasificar Datos Personales</p>
          </div>

          <div className="stats-section">
            <div className="stat-box integrity-box">
              <span className="stat-label">VIDA</span>
              <div className="hearts-grid">
                {Array.from({ length: 10 }, (_, i) => {
                  const filled = i < Math.ceil(integrity / 10);
                  const danger = Math.ceil(integrity / 10) <= 3;
                  return (
                    <span
                      key={i}
                      className={`heart ${filled ? 'heart-full' : 'heart-empty'} ${filled && danger ? 'heart-danger' : ''}`}
                    >
                      {filled ? '❤️' : '🤍'}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="stat-box">
              <span className="stat-label">PUNTUACIÓN</span>
              <span className="stat-value">{score}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">RÉCORD</span>
              <span className="stat-value highlight">{highScore}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">LÍNEAS</span>
              <span className="stat-value lines-value">{lines}</span>
            </div>
          </div>
        </header>

        <section className="canvas-section glass-panel">
          {gameState === 'playing' && (
            <aside className="game-sidebar-left">
              <div className="sidebar-title">PROTOCOLOS DE DATOS</div>
              <div className="legend-item publico">
                <div className="legend-dot"></div>
                <div className="legend-text">
                  <strong>Acceso Irrestricto </strong>
                  <p>Información pública</p>
                </div>
              </div>
              <div className="legend-item confidencial">
                <div className="legend-dot"></div>
                <div className="legend-text">
                  <strong>Acceso Restringido</strong>
                  <p>No son de acceso general para todo el mundo</p>
                </div>
              </div>
              <div className="legend-item restringido">
                <div className="legend-dot"></div>
                <div className="legend-text">
                  <strong>Datos Sensibles</strong>
                  <p>Aquellos que revelan aspectos íntimos de la personalidad</p>
                </div>
              </div>

              <div className="sidebar-hint">
                <p>Presiona <span>ESPACIO</span> para cambiar el escudo de la pieza.</p>
              </div>
            </aside>
          )}

          {gameState === 'start' && (
            <div className="overlay start-overlay">
              <div className="overlay-content">

                <p>Debe jugar un nivel de Tetris, con la diferencia de que cada pieza contiene un dato personal que debe clasificar entre:</p>
                <ul>
                  <li style={{ color: '#00e676', fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'center', display: 'block' }}>Acceso Irrestricto</li>
                  <li style={{ color: '#ffc400', fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'center', display: 'block' }}>Acceso Restringido</li>
                  <li style={{ color: '#ff1744', fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'center', display: 'block' }}>Datos Sensibles</li>
                </ul>

                <p>Para clasificar los datos, presione la tecla <span>ESPACIO</span> para cambiar la clasificación del dato. Si clasifica incorrectamente perderá vida.</p>

                <div className="difficulty-selector">
                  <span className="stat-label">SELECCIONAR NIVEL</span>
                  <div className="difficulty-buttons">
                    <button className={`diff-btn ${difficulty === 'easy' ? 'active' : ''}`} onClick={() => setDifficulty('easy')}>FÁCIL</button>
                    <button className={`diff-btn ${difficulty === 'medium' ? 'active' : ''}`} onClick={() => setDifficulty('medium')}>MEDIO</button>
                    <button className={`diff-btn ${difficulty === 'hard' ? 'active' : ''}`} onClick={() => setDifficulty('hard')}>DIFÍCIL</button>
                  </div>
                </div>

                <p>Controles:</p>

                <div className="instructions-grid">
                  <div className="ins-item"><span>&larr; &rarr;</span> Mover la pieza</div>
                  <div className="ins-item"><span>ESPACIO</span> Cambiar Clasificación (Irrestricto/Restringido/Sensible)</div>
                  <div className="ins-item"><span>&uarr;</span> Rotar pieza</div>
                  <div className="ins-item"><span>&darr;</span> Bajar la pieza rápidamente</div>
                </div>
                <button className="primary-btn" onClick={startGame}>Jugar</button>
              </div>
            </div>
          )}

          {gameState === 'playing' && (
            <PhaserGame onScoreChange={handleScoreChange} onLinesChange={setLines} onSpeedChange={setSpeed} difficulty={difficulty} />
          )}

          {gameState === 'gameover' && (
            <div className="overlay gameover-overlay">
              <div className="overlay-content">
                <h2 className="text-danger">Brecha de datos</h2>
                <p>Los atacantes han obtenido información sensible de los usuarios.</p>

                <div className="final-stats">
                  <div className="final-stat">
                    <span>SCORE FINAL</span>
                    <strong>{score}</strong>
                  </div>
                  <div className="final-stat">
                    <span>MEJOR PUNTUACIÓN</span>
                    <strong style={{ color: '#00E5FF' }}>{highScore}</strong>
                  </div>
                </div>

                <div className="leaderboard">
                  <h3 className="leaderboard-title">TOP 10</h3>
                  <ol className="leaderboard-list">
                    {leaderboard.map((s, i) => (
                      <li
                        key={i}
                        className={`leaderboard-item ${s === score && i === leaderboard.indexOf(score) ? 'current' : ''}`}
                      >
                        <span className="lb-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                        <span className="lb-score">{s.toLocaleString()}</span>
                      </li>
                    ))}
                    {leaderboard.length === 0 && (
                      <li className="leaderboard-empty">Sin puntajes aún</li>
                    )}
                  </ol>
                </div>

                <button className="primary-btn" onClick={() => setGameState('start')}>VOLVER AL INICIO</button>
              </div>
            </div>
          )}
        </section>

        <footer className="game-header-bottom">
          <div className="combo-display">
            <span className="stat-label">COMBO</span>
            <span className={`combo-val ${combo > 0 ? 'active' : ''}`}>x{combo}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
