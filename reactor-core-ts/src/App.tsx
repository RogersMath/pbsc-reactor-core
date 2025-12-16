import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, RotateCcw, Atom, Calculator, ScrollText, X } from 'lucide-react';
import { UnitGrid } from './components/UnitGrid';
import { Tutorial } from './components/Tutorial';
import { SettingsMenu } from './components/SettingsMenu';
import { SoundEngine } from './utils/soundEngine';
import { generateDeck, calculateMinMoves, getSymbolicEquation } from './utils/gameLogic';
import {
  GameState,
  Card,
  FallingCard,
  StreamingUnit,
  Particle,
  Move,
} from './types/game.types';
import './styles/App.css';
import backgroundMusic from './assets/preparing-for-the-uncertain-442653.mp3';
import backgroundImage from './assets/background.png';

const App: React.FC = () => {
  // State with localStorage persistence
  const [level, setLevel] = useState<number>(() => parseInt(localStorage.getItem('rc_level') || '1'));
  const [puzzlesSolved, setPuzzlesSolved] = useState<number>(
    () => parseInt(localStorage.getItem('rc_solved') || '0')
  );
  const [showTutorial, setShowTutorial] = useState<boolean>(
    () => !localStorage.getItem('rc_tutorial_seen')
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    () => localStorage.getItem('rc_sound_enabled') !== 'false'
  );
  const [gameState, setGameState] = useState<GameState>('menu');
  const [deck, setDeck] = useState<Card[]>([]);
  const [leftConstant, setLeftConstant] = useState<number>(0);
  const [rightValue, setRightValue] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [minMoves, setMinMoves] = useState<number>(0);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [undoAvailable, setUndoAvailable] = useState<number>(1);

  // Animation State
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [fallingCards, setFallingCards] = useState<FallingCard[]>([]);
  const [streamingUnits, setStreamingUnits] = useState<StreamingUnit[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [flash, setFlash] = useState<boolean>(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Refs for cleanup
  const timeoutsRef = useRef<number[]>([]);
  const focusRef = useRef<HTMLButtonElement>(null);

  // Focus Management
  useEffect(() => {
    if (focusRef.current) focusRef.current.focus();
  }, [gameState]);

  // Initialize sound engine settings
  useEffect(() => {
    SoundEngine.setSfxEnabled(soundEnabled);
    SoundEngine.setMusicEnabled(soundEnabled);
  }, []);

  // Update sound engine when soundEnabled changes
  useEffect(() => {
    SoundEngine.setSfxEnabled(soundEnabled);
    SoundEngine.setMusicEnabled(soundEnabled);
  }, [soundEnabled]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('rc_level', level.toString());
    localStorage.setItem('rc_solved', puzzlesSolved.toString());
  }, [level, puzzlesSolved]);

  // Cleanup timeouts on unmount or gameState change
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [gameState]);

  const initLevel = useCallback(() => {
    const maxVal = Math.min(5, Math.floor(level / 2) + 3);

    // Prevent E = 0 starting state
    let b: number;
    do {
      b = Math.floor(Math.random() * (maxVal * 2)) - maxVal;
    } while (b === 0);

    const solution = Math.floor(Math.random() * (maxVal * 2)) - maxVal;
    const c = solution + b;

    let newDeck: Card[];
    let optimal: number;
    let attempts = 0;
    do {
      newDeck = generateDeck(level);
      optimal = calculateMinMoves(-b, newDeck);
      attempts++;
    } while (optimal > 6 && attempts < 20);

    setLeftConstant(b);
    setRightValue(c);
    setDeck(newDeck);
    setMinMoves(optimal);
    setMoves(0);
    setMoveHistory([]);
    setUndoAvailable(1);
    setFallingCards([]);
    setParticles([]);
    setStreamingUnits([]);
    setIsAnimating(false);
    setSelectedCardId(null);
    setGameState('playing');

    // Start background music only if not already playing
    if (soundEnabled && !SoundEngine.isMusicPlaying()) {
      SoundEngine.playMusic(backgroundMusic);
    }
  }, [level, soundEnabled]);

  const handleCardClick = async (card: Card) => {
    if (isAnimating) return;

    // Store the remaining cards for focus management
    const remainingCards = deck.filter((c) => c.id !== card.id);

    // Clear any existing timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    setIsAnimating(true);
    setSelectedCardId(card.id);
    if (soundEnabled) SoundEngine.effects.cardTap();
    setMoves((m) => m + 1);
    setMoveHistory((prev) => [...prev, { type: card.type, value: card.value, name: card.name }]);

    // Animations
    const others = deck
      .filter((c) => c.id !== card.id)
      .map((c, i) => ({ id: c.id, delay: i * 100 }));
    setFallingCards(others);

    const timeout1 = setTimeout(() => {
      // Streaming
      const streams: StreamingUnit[] = [];
      for (let i = 0; i < card.value; i++) {
        streams.push({ id: `L${i}`, side: 'left', type: card.type, symbol: card.symbol, delay: i * 150 });
        streams.push({ id: `R${i}`, side: 'right', type: card.type, symbol: card.symbol, delay: i * 150 });
        if (soundEnabled) {
          const soundTimeout = setTimeout(() => SoundEngine.effects.stream(), i * 150);
          timeoutsRef.current.push(soundTimeout);
        }
      }
      setStreamingUnits(streams);

      const timeout2 = setTimeout(() => {
        // Impact
        setFlash(true);
        const flashTimeout = setTimeout(() => setFlash(false), 200);
        timeoutsRef.current.push(flashTimeout);
        if (soundEnabled) {
          card.type === 'antimatter' ? SoundEngine.effects.antimatterHit() : SoundEngine.effects.matterHit();
        }

        setParticles(
          Array(12)
            .fill(0)
            .map((_, i) => ({
              id: i,
              x: (Math.random() - 0.5) * 100,
              y: (Math.random() - 0.5) * 100,
              symbol: card.type === 'matter' ? '+' : '−',
              color: card.type === 'matter' ? '#4ade80' : '#f87171',
            }))
        );

        const timeout3 = setTimeout(() => {
          const delta = card.type === 'antimatter' ? -card.value : card.value;
          const newLeft = leftConstant + delta;
          setLeftConstant((l) => l + delta);
          setRightValue((r) => r + delta);

          setStreamingUnits([]);
          setFallingCards([]);
          setSelectedCardId(null);
          setParticles([]);
          setIsAnimating(false);

          // Focus management: Try to focus the first remaining card after animation
          const focusTimeout = setTimeout(() => {
            if (remainingCards.length > 0) {
              const firstRemainingButton = document.querySelector<HTMLButtonElement>(
                `button[data-card-id="${remainingCards[0].id}"]`
              );
              firstRemainingButton?.focus();
            }
          }, 100);
          timeoutsRef.current.push(focusTimeout);

          // Check if solved
          if (newLeft === 0) {
            if (soundEnabled) SoundEngine.effects.balance();
            const victoryTimeout = setTimeout(() => {
              if (soundEnabled) SoundEngine.effects.victory();
              setGameState('victory');
            }, 1000);
            timeoutsRef.current.push(victoryTimeout);
          }
        }, 300);
        timeoutsRef.current.push(timeout3);
      }, 1500);
      timeoutsRef.current.push(timeout2);
    }, 300);
    timeoutsRef.current.push(timeout1);
  };

  const handleUndo = () => {
    if (moveHistory.length === 0 || isAnimating || undoAvailable <= 0) return;
    if (soundEnabled) SoundEngine.effects.undo();
    const last = moveHistory[moveHistory.length - 1];
    const delta = last.type === 'antimatter' ? last.value : -last.value;
    setLeftConstant((l) => l + delta);
    setRightValue((r) => r + delta);
    setMoves((m) => m - 1);
    setUndoAvailable((u) => u - 1);
    setMoveHistory((prev) => prev.slice(0, -1));
  };

  const handleResetProgress = () => {
    if (window.confirm('Reset all progress? This cannot be undone.')) {
      localStorage.removeItem('rc_level');
      localStorage.removeItem('rc_solved');
      localStorage.removeItem('rc_tutorial_seen');
      window.location.reload();
    }
  };

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('rc_tutorial_seen', 'true');
  };

  const handleToggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('rc_sound_enabled', newValue.toString());
    
    // Update sound engine settings
    SoundEngine.setSfxEnabled(newValue);
    SoundEngine.setMusicEnabled(newValue);
  };

  const handleNewGame = () => {
    // Reset to level 1
    setLevel(1);
    setPuzzlesSolved(0);
    setGameState('menu');
    localStorage.setItem('rc_level', '1');
    localStorage.setItem('rc_solved', '0');
  };

  const handleSaveProgress = () => {
    const saveData = {
      level,
      puzzlesSolved,
      soundEnabled,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('rc_saved_game', JSON.stringify(saveData));
    alert('Progress saved successfully!');
  };

  const handleLoadProgress = () => {
    const saved = localStorage.getItem('rc_saved_game');
    if (!saved) {
      alert('No saved game found!');
      return;
    }

    try {
      const saveData = JSON.parse(saved);
      setLevel(saveData.level);
      setPuzzlesSolved(saveData.puzzlesSolved);
      setSoundEnabled(saveData.soundEnabled ?? true);
      setGameState('menu');
      localStorage.setItem('rc_level', saveData.level.toString());
      localStorage.setItem('rc_solved', saveData.puzzlesSolved.toString());
      localStorage.setItem('rc_sound_enabled', (saveData.soundEnabled ?? true).toString());
      alert('Progress loaded successfully!');
    } catch (error) {
      alert('Failed to load saved game!');
      console.error('Load error:', error);
    }
  };

  const handleShowTutorialFromMenu = () => {
    setShowTutorial(true);
  };

  const handleBackToMenu = () => {
    SoundEngine.stopMusic();
    setGameState('menu');
  };

  // --- RENDER VIEWS ---

  if (showTutorial) {
    return <Tutorial onClose={handleCloseTutorial} />;
  }

  if (gameState === 'menu') {
    return (
      <div className="menu-container" role="main">
        <SettingsMenu
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onNewGame={handleNewGame}
          onSaveProgress={handleSaveProgress}
          onLoadProgress={handleLoadProgress}
          onShowTutorial={handleShowTutorialFromMenu}
          onBackToMenu={handleBackToMenu}
          inGame={false}
        />
        <div className="menu-content">
          <div className="menu-icon" role="img" aria-label="Reactor Core">
            ⚡
          </div>
          <h1 className="menu-title">REACTOR CORE</h1>
          <p className="menu-subtitle">ENERGY EQUATION SYSTEM</p>

          <button
            onClick={initLevel}
            className="btn-primary"
            ref={focusRef}
            aria-label="Initialize reactor core and start game"
          >
            <Zap className="fill-current" aria-hidden="true" /> INITIALIZE CORE
          </button>

          <div className="menu-stats">
            <div className="menu-stat-item" aria-label={`Current level: ${level}`}>
              <Zap size={16} aria-hidden="true" /> LVL {level}
            </div>
            <div className="menu-stat-item" aria-label={`Puzzles solved: ${puzzlesSolved}`}>
              <Atom size={16} aria-hidden="true" /> {puzzlesSolved} SOLVED
            </div>
          </div>

          <div className="instructions-panel">
            <div className="instructions-icon" role="img" aria-label="Reactor">
              🔋
            </div>
            <h2 className="instructions-title">Core Operations:</h2>
            <div className="instructions-list">
              <p>
                • <span className="text-green-400">Matter ⚛ (+)</span> adds positive energy
              </p>
              <p>
                • <span className="text-red-400">Antimatter ⚛ (−)</span> adds negative energy
              </p>
              <p>
                • <span className="text-yellow-400">E</span> represents unknown energy level
              </p>
              <p>• Tap any card - streams to BOTH sides!</p>
              <p>• Watch the energy streams collide!</p>
              <p>
                • <strong className="text-yellow-300">Get the value next to E to equal 0!</strong>
              </p>
            </div>
          </div>

          <div className="menu-actions">
            <button onClick={() => setShowTutorial(true)} className="btn-link" aria-label="Show tutorial">
              Show Tutorial
            </button>
            {(level > 1 || puzzlesSolved > 0) && (
              <button
                onClick={handleResetProgress}
                className="btn-link small"
                aria-label="Reset all progress"
              >
                Reset Progress
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'victory') {
    const stars = moves === minMoves ? 3 : moves === minMoves + 1 ? 2 : 1;

    return (
      <div className="victory-container" role="main">
        <SettingsMenu
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onNewGame={handleNewGame}
          onSaveProgress={handleSaveProgress}
          onLoadProgress={handleLoadProgress}
          onShowTutorial={handleShowTutorialFromMenu}
          onBackToMenu={handleBackToMenu}
          inGame={false}
        />
        <h1 className="victory-title">REACTOR STABILIZED</h1>
        <div className="victory-stars" role="img" aria-label={`${stars} out of 3 stars earned`}>
          {[1, 2, 3].map((i) => (
            <span key={i} className={`star ${i <= stars ? 'filled' : 'empty'}`}>
              ★
            </span>
          ))}
        </div>
        <p className="victory-moves">
          {moves} {moves === 1 ? 'operation' : 'operations'}
        </p>
        {moves === minMoves && <p className="victory-message optimal">🎯 Optimal efficiency achieved!</p>}
        {moves === minMoves + 1 && <p className="victory-message near-optimal">✨ Near-optimal performance!</p>}
        {moves > minMoves + 1 && (
          <p className="victory-message default">
            💭 Optimal: {minMoves} {minMoves === 1 ? 'operation' : 'operations'}
          </p>
        )}
        <div className="victory-icon" role="img" aria-label="Success">
          ⚡
        </div>

        <div className="victory-actions">
          <button
            onClick={() => {
              setLevel((l) => l + 1);
              setPuzzlesSolved((p) => p + 1);
              initLevel();
            }}
            className="btn-next"
            ref={focusRef}
            aria-label="Proceed to next reactor core"
          >
            NEXT CORE
          </button>
          <button onClick={() => setGameState('menu')} className="btn-menu" aria-label="Return to main menu">
            MENU
          </button>
        </div>
      </div>
    );
  }

  // PLAYING STATE
  return (
    <div className={`app-container ${flash ? 'flash' : ''}`} role="main">
      <SettingsMenu
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onNewGame={handleNewGame}
        onSaveProgress={handleSaveProgress}
        onLoadProgress={handleLoadProgress}
        onShowTutorial={handleShowTutorialFromMenu}
        onBackToMenu={handleBackToMenu}
        inGame={true}
      />
      <div 
        className="app-background-gradient" 
        style={{ backgroundImage: `url(${backgroundImage})` }}
        aria-hidden="true" 
      />

      {/* Particle Effects Layer */}
      {particles.length > 0 && (
        <div className="particle-layer" aria-hidden="true">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="particle"
              style={
                {
                  color: particle.color,
                  '--x': `${particle.x}px`,
                  '--y': `${particle.y}px`,
                } as React.CSSProperties
              }
            >
              {particle.symbol}
            </div>
          ))}
        </div>
      )}

      {/* Streaming Units Animation Layer */}
      {streamingUnits.length > 0 && (
        <div className="streaming-layer" aria-hidden="true">
          {streamingUnits.map((unit) => (
            <div
              key={unit.id}
              className={`streaming-unit ${unit.side} ${unit.type}`}
              style={{
                animationDelay: `${unit.delay}ms`,
              }}
            >
              {unit.symbol}
            </div>
          ))}
        </div>
      )}

      {/* HEADER */}
      <header className="game-header">
        <div className="header-level">
          <Zap className="fill-current" aria-hidden="true" />
          <span className="header-level-text" aria-label={`Level ${level}`}>
            LVL {level}
          </span>
        </div>
        <div className="header-moves" aria-label={`Operations used: ${moves}`}>
          OPS: {moves}
        </div>
        <button onClick={() => setGameState('menu')} className="btn-abort" aria-label="Abort mission and return to menu">
          ABORT
        </button>
      </header>

      {/* DASHBOARD ROW: EQUATION + LOG */}
      <div className="dashboard">
        {/* Equation Display Box */}
        <section className="dashboard-box" aria-labelledby="equation-title">
          <h2 id="equation-title" className="dashboard-title">
            <Calculator size={14} aria-hidden="true" /> Equation Protocol
          </h2>
          <div className="equation-display">
            <span
              className="equation-text"
              aria-label={`Current equation: ${getSymbolicEquation(leftConstant, rightValue)}`}
            >
              {getSymbolicEquation(leftConstant, rightValue)}
            </span>
          </div>
        </section>

        {/* Operation Log Box */}
        <section className="dashboard-box" aria-labelledby="log-title">
          <h2 id="log-title" className="dashboard-title">
            <ScrollText size={14} aria-hidden="true" /> System Log
          </h2>
          <div className="log-display">
            {moveHistory.length === 0 ? (
              <span className="log-empty">No operations recorded...</span>
            ) : (
              <div className="log-items" role="list" aria-label="Recent operations">
                {moveHistory
                  .slice()
                  .reverse()
                  .map((m, i) => (
                    <span
                      key={i}
                      className={`log-item ${m.type}`}
                      role="listitem"
                      aria-label={`Operation ${moveHistory.length - i}: ${m.name}`}
                    >
                      {m.type === 'matter' ? '+' : '-'}
                      {m.value}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* MAIN VISUAL CORE */}
      <section className="reactor-section" aria-labelledby="reactor-title">
        <h2 id="reactor-title" className="sr-only">
          Reactor Core Equation Visualization
        </h2>
        <div className="reactor-core">
          <div className="equation-visual">
            {/* Left Side */}
            <div
              className="equation-side"
              role="region"
              aria-label={`Left side: E ${
                leftConstant !== 0
                  ? leftConstant > 0
                    ? `plus ${leftConstant}`
                    : `plus negative ${Math.abs(leftConstant)}`
                  : ''
              }`}
            >
              <span className="e-symbol" aria-label="Unknown energy E">
                E
              </span>
              {leftConstant !== 0 && (
                <>
                  <span className="plus-symbol" aria-hidden="true">
                    +
                  </span>
                  <div className="unit-grid-wrapper">
                    <UnitGrid value={leftConstant} />
                  </div>
                </>
              )}
            </div>

            {/* Equals */}
            <div className="equals-symbol" aria-label="equals">
              =
            </div>

            {/* Right Side */}
            <div className="equation-side right" role="region" aria-label={`Right side: ${rightValue}`}>
              <div className="unit-grid-wrapper">
                <UnitGrid value={rightValue} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CARD BANK */}
      <section className="card-bank" aria-labelledby="cards-title">
        <div className="card-bank-content">
          <div className="card-bank-header">
            <h3 id="cards-title" className="card-bank-title">
              <Atom size={16} className="animate-spin-slow" aria-hidden="true" /> ENERGY CARDS
            </h3>
            <button
              onClick={handleUndo}
              disabled={moveHistory.length === 0 || isAnimating || undoAvailable <= 0}
              className={`btn-undo ${
                moveHistory.length > 0 && !isAnimating && undoAvailable > 0 ? 'enabled' : 'disabled'
              }`}
              aria-label={`Time warp, ${undoAvailable} remaining. Undo last operation.`}
            >
              <RotateCcw size={12} aria-hidden="true" /> TIME WARP ({undoAvailable})
            </button>
          </div>

          <div className="card-grid" role="list" aria-label="Available energy cards">
            {deck.map((card) => {
              const isFalling = fallingCards.some((fc) => fc.id === card.id);
              const delay = fallingCards.find((fc) => fc.id === card.id)?.delay || 0;
              const isSelected = selectedCardId === card.id;

              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  disabled={isAnimating}
                  data-card-id={card.id}
                  style={{ animationDelay: `${delay}ms` }}
                  className={`energy-card ${card.type} ${isFalling ? 'animate-fallDown' : ''} ${
                    isSelected ? 'selected' : ''
                  } ${isAnimating ? 'disabled' : ''}`}
                  role="listitem"
                  aria-label={card.ariaLabel}
                >
                  {/* Badge */}
                  <div className={`card-value-badge ${card.type}`} aria-hidden="true">
                    {card.value}
                  </div>

                  {/* Symbol Grid */}
                  <div className="card-content">
                    <div
                      className={`card-symbols ${card.value === 1 ? 'single' : 'multiple'} ${card.type}`}
                      style={{
                        gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(card.value))}, 1fr)`,
                      }}
                      aria-hidden="true"
                    >
                      {Array(card.value)
                        .fill(0)
                        .map((_, i) => (
                          <span key={i} className="card-symbol">
                            ⚛
                          </span>
                        ))}
                    </div>
                    <div className={`card-type-label ${card.type}`} aria-hidden="true">
                      {card.type}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="game-footer">
        <a 
          href="https://pbsc.edu/slc/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="footer-link"
        >
          Powered by the SLC at PBSC
        </a>
      </footer>
    </div>
  );
};

export default App;