import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, RotateCcw, Atom, Calculator, ScrollText, CheckCircle } from 'lucide-react';
import { UnitGrid } from './components/UnitGrid';
import { TutorialOverlay } from './components/TutorialOverlay';
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

import './styles/variables.css';
import './styles/animations.css';
import './styles/layout.css';
import './styles/menu.css';
import './styles/game-dashboard.css';
import './styles/reactor.css';
import './styles/cards.css';
import './styles/tutorial.css';

import backgroundMusic from './assets/preparing-for-the-uncertain-442653.mp3';
import backgroundImage from './assets/background.png';

const App: React.FC = () => {
  // --- STATE ---
  const [level, setLevel] = useState<number>(() => parseInt(localStorage.getItem('rc_level') || '1'));
  const [puzzlesSolved, setPuzzlesSolved] = useState<number>(() => parseInt(localStorage.getItem('rc_solved') || '0'));
  
  // Tutorial State
  const [isTutorialActive, setIsTutorialActive] = useState<boolean>(() => !localStorage.getItem('rc_tutorial_seen'));
  const [tutorialStep, setTutorialStep] = useState<number>(0); // 0 = off, 1 = Equation, 2 = LeftConstant, 3 = Deck
  
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => localStorage.getItem('rc_sound_enabled') !== 'false');
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

  // --- REFS (For Tutorial Highlighting) ---
  const focusRef = useRef<HTMLButtonElement>(null);
  const equationRef = useRef<HTMLDivElement>(null);
  const leftConstantRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLElement>(null);
  const timeoutsRef = useRef<number[]>([]);

  // Focus Management
  useEffect(() => {
    if (focusRef.current) focusRef.current.focus();
  }, [gameState]);

  // Sound Init
  useEffect(() => {
    SoundEngine.setSfxEnabled(soundEnabled);
    SoundEngine.setMusicEnabled(soundEnabled);
  }, []);

  useEffect(() => {
    SoundEngine.setSfxEnabled(soundEnabled);
    SoundEngine.setMusicEnabled(soundEnabled);
  }, [soundEnabled]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('rc_level', level.toString());
    localStorage.setItem('rc_solved', puzzlesSolved.toString());
  }, [level, puzzlesSolved]);

  // Cleanup
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [gameState]);

  // --- TUTORIAL LOGIC ---
  const nextTutorialStep = () => {
    setTutorialStep(prev => prev + 1);
  };

  const closeTutorial = () => {
    setIsTutorialActive(false);
    setTutorialStep(0);
    localStorage.setItem('rc_tutorial_seen', 'true');
  };

  const handleShowTutorialFromMenu = () => {
    setIsTutorialActive(true);
    // If in game, start at step 1, otherwise just set flag
    if (gameState === 'playing') setTutorialStep(1);
  };

  // --- GAME LOGIC ---
  const initLevel = useCallback(() => {
    const maxVal = Math.min(5, Math.floor(level / 2) + 3);
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

    if (soundEnabled && !SoundEngine.isMusicPlaying()) {
      SoundEngine.playMusic(backgroundMusic);
    }
    
    // Trigger tutorial if needed
    if (isTutorialActive) {
      setTimeout(() => setTutorialStep(1), 500);
    }
  }, [level, soundEnabled, isTutorialActive]);

  const handleCardClick = async (card: Card) => {
    if (isAnimating) return;
    
    // If tutorial is active, only allow clicks on Step 3, then close tutorial
    if (tutorialStep > 0 && tutorialStep !== 3) return;
    if (tutorialStep === 3) closeTutorial();

    const remainingCards = deck.filter((c) => c.id !== card.id);
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    setIsAnimating(true);
    setSelectedCardId(card.id);
    if (soundEnabled) SoundEngine.effects.cardTap();
    setMoves((m) => m + 1);
    setMoveHistory((prev) => [...prev, { type: card.type, value: card.value, name: card.name }]);

    const others = deck.filter((c) => c.id !== card.id).map((c, i) => ({ id: c.id, delay: i * 100 }));
    setFallingCards(others);

    const timeout1 = setTimeout(() => {
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
        setFlash(true);
        const flashTimeout = setTimeout(() => setFlash(false), 200);
        timeoutsRef.current.push(flashTimeout);
        if (soundEnabled) {
          card.type === 'antimatter' ? SoundEngine.effects.antimatterHit() : SoundEngine.effects.matterHit();
        }

        setParticles(
          Array(12).fill(0).map((_, i) => ({
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

          const focusTimeout = setTimeout(() => {
            if (remainingCards.length > 0) {
              const firstRemainingButton = document.querySelector<HTMLButtonElement>(
                `button[data-card-id="${remainingCards[0].id}"]`
              );
              firstRemainingButton?.focus();
            }
          }, 100);
          timeoutsRef.current.push(focusTimeout);

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

  const handleNewGame = () => {
    setLevel(1);
    setPuzzlesSolved(0);
    setGameState('menu');
    localStorage.setItem('rc_level', '1');
    localStorage.setItem('rc_solved', '0');
  };

  // --- HELPER FOR TUTORIAL HIGHLIGHTING ---
  const getHighlightClass = (stepTarget: number) => {
    return tutorialStep === stepTarget ? 'tutorial-highlight' : '';
  };

  // --- RENDER ---

  if (gameState === 'menu') {
    return (
      <div className="menu-container" role="main">
        <SettingsMenu
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onNewGame={handleNewGame}
          onSaveProgress={() => alert('Saved')} // Simplify for brevity
          onLoadProgress={() => alert('Loaded')} 
          onShowTutorial={handleShowTutorialFromMenu}
          onBackToMenu={() => setGameState('menu')}
          inGame={false}
        />
        <div className="menu-content">
          <div className="menu-icon" role="img" aria-label="Reactor Core">⚡</div>
          <h1 className="menu-title">REACTOR CORE</h1>
          <p className="menu-subtitle">ENERGY EQUATION SYSTEM</p>

          <button onClick={initLevel} className="btn-primary" ref={focusRef}>
             <Zap className="fill-current" aria-hidden="true" /> INITIALIZE CORE
          </button>

          <div className="menu-stats">
            <div><Zap size={16} /> LVL {level}</div>
            <div><Atom size={16} /> {puzzlesSolved} SOLVED</div>
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
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onNewGame={handleNewGame}
          onSaveProgress={() => alert('Saved')}
          onLoadProgress={() => alert('Loaded')}
          onShowTutorial={handleShowTutorialFromMenu}
          onBackToMenu={() => setGameState('menu')}
          inGame={false}
        />
        <h1 className="victory-title">REACTOR STABILIZED</h1>
        <div className="victory-stars">
          {[1, 2, 3].map((i) => (
            <span key={i} className={`star ${i <= stars ? 'filled' : 'empty'}`}>★</span>
          ))}
        </div>
        
        {moves === minMoves && (
          <div style={{display:'flex', alignItems:'center', gap:'0.5rem', color:'#4ade80', fontSize:'1.2rem', marginBottom:'1rem'}}>
            <CheckCircle size={32} />
            <span>Optimal Efficiency Achieved!</span>
          </div>
        )}
        
        <div className="victory-actions">
          <button onClick={() => { setLevel(l => l + 1); setPuzzlesSolved(p => p + 1); initLevel(); }} className="btn-next" ref={focusRef}>
            NEXT CORE
          </button>
          <button onClick={() => setGameState('menu')} className="btn-menu">MENU</button>
        </div>
      </div>
    );
  }

  // PLAYING STATE
  return (
    <div className={`app-container ${flash ? 'flash' : ''}`} role="main">
      <SettingsMenu
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onNewGame={handleNewGame}
        onSaveProgress={() => alert('Saved')}
        onLoadProgress={() => alert('Loaded')}
        onShowTutorial={handleShowTutorialFromMenu}
        onBackToMenu={() => { SoundEngine.stopMusic(); setGameState('menu'); }}
        inGame={true}
      />
      <div className="app-background-gradient" style={{ backgroundImage: `url(${backgroundImage})` }} />

      {/* Tutorial Overlay */}
      {tutorialStep > 0 && (
        <TutorialOverlay 
          step={tutorialStep} 
          onNext={nextTutorialStep} 
          onClose={closeTutorial} 
          equationTerm={leftConstant}
        />
      )}

      {/* Particles & Streaming Layers */}
      {particles.length > 0 && (
        <div className="particle-layer">
          {particles.map(p => (
            <div key={p.id} className="particle" style={{color: p.color, '--x': `${p.x}px`, '--y': `${p.y}px`} as any}>{p.symbol}</div>
          ))}
        </div>
      )}
      {streamingUnits.length > 0 && (
        <div className="streaming-layer">
          {streamingUnits.map(u => (
            <div key={u.id} className={`streaming-unit ${u.side} ${u.type}`} style={{animationDelay: `${u.delay}ms`}}>{u.symbol}</div>
          ))}
        </div>
      )}

      {/* Header */}
      <header className="game-header">
        <div className="header-level">
          <Zap className="fill-current" /> <span className="header-level-text">LVL {level}</span>
        </div>
        <div className="header-moves">OPS: {moves}</div>
        <button onClick={() => setGameState('menu')} className="btn-abort">ABORT</button>
      </header>

      {/* Dashboard */}
      <div className="dashboard">
        {/* EQUATION BOX - Highlightable for Step 1 */}
        <section ref={equationRef} className={`dashboard-box ${getHighlightClass(1)}`}>
          <h2 className="dashboard-title"><Calculator size={14} /> Equation Protocol</h2>
          <div className="equation-display">
            <span className="equation-text">
              {getSymbolicEquation(leftConstant, rightValue)}
            </span>
          </div>
        </section>

        <section className="dashboard-box">
          <h2 className="dashboard-title"><ScrollText size={14} /> System Log</h2>
          <div className="log-display">
            {moveHistory.length === 0 ? (
              <span style={{color:'#475569', fontSize:'0.75rem', textAlign:'center', fontStyle:'italic'}}>No operations recorded...</span>
            ) : (
              <div className="log-items">
                {moveHistory.slice().reverse().map((m, i) => (
                  <span key={i} className={`log-item ${m.type}`}>
                    {m.type === 'matter' ? '+' : '-'}{m.value}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* REACTOR VISUAL */}
      <section className="reactor-section">
        <div className="reactor-core">
          <div className="equation-visual">
            {/* Left Side - Highlightable for Step 2 */}
            <div className="equation-side">
              <span className="e-symbol">X</span>
              {leftConstant !== 0 && (
                <>
                  <span className="plus-symbol">+</span>
                  <div ref={leftConstantRef} className={`unit-grid-wrapper ${getHighlightClass(2)}`}>
                    <UnitGrid value={leftConstant} />
                  </div>
                </>
              )}
            </div>
            <div className="equals-symbol">=</div>
            <div className="equation-side right">
              <div className="unit-grid-wrapper">
                <UnitGrid value={rightValue} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CARD BANK - Highlightable for Step 3 */}
      <section ref={deckRef} className={`card-bank ${getHighlightClass(3)}`}>
        <div className="card-bank-content">
          <div className="card-bank-header">
            <h3 className="card-bank-title"><Atom size={16} className="animate-spin-slow" /> ENERGY CARDS</h3>
            <button onClick={handleUndo} disabled={moveHistory.length === 0} className={`btn-undo ${moveHistory.length > 0 ? 'enabled' : 'disabled'}`}>
              <RotateCcw size={12} /> TIME WARP ({undoAvailable})
            </button>
          </div>

          <div className="card-grid">
            {deck.map((card) => {
              const isFalling = fallingCards.some(fc => fc.id === card.id);
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  disabled={isAnimating}
                  data-card-id={card.id}
                  className={`energy-card ${card.type} ${isFalling ? 'animate-fallDown' : ''} ${selectedCardId === card.id ? 'selected' : ''}`}
                >
                  <div className={`card-value-badge ${card.type}`}>{card.value}</div>
                  <div className="card-content">
                    <div className={`card-symbols ${card.value === 1 ? 'single' : 'multiple'} ${card.type}`}
                         style={{gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(card.value))}, 1fr)`}}>
                      {Array(card.value).fill(0).map((_, i) => <span key={i} className="card-symbol">⚛</span>)}
                    </div>
                    <div className={`card-type-label ${card.type}`}>
                      {card.type === 'antimatter' ? <>ANTI-<br/>MATTER</> : card.type}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="game-footer">
        <a href="https://pbsc.edu/slc/" target="_blank" rel="noopener noreferrer" className="footer-link">
          Powered by the SLC at PBSC
        </a>
      </footer>
    </div>
  );
};

export default App;