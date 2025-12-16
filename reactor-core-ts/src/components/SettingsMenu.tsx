import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Volume2, VolumeX, Globe, RotateCcw, Save, FolderOpen, BookOpen, Home } from 'lucide-react';

interface SettingsMenuProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onNewGame: () => void;
  onSaveProgress: () => void;
  onLoadProgress: () => void;
  onShowTutorial: () => void;
  onBackToMenu: () => void;
  inGame: boolean; // Whether player is currently in a game
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  soundEnabled,
  onToggleSound,
  onNewGame,
  onSaveProgress,
  onLoadProgress,
  onShowTutorial,
  onBackToMenu,
  inGame,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleNewGame = () => {
    if (window.confirm('Start a new game? Your current progress will be lost.')) {
      setIsOpen(false);
      onNewGame();
    }
  };

  const handleSaveProgress = () => {
    if (window.confirm('Save your current progress? This will overwrite any existing save.')) {
      setIsOpen(false);
      onSaveProgress();
    }
  };

  const handleLoadProgress = () => {
    if (window.confirm('Load saved progress? Your current game will be lost.')) {
      setIsOpen(false);
      onLoadProgress();
    }
  };

  const handleBackToMenu = () => {
    if (window.confirm('Return to main menu? Your current game will be lost.')) {
      setIsOpen(false);
      onBackToMenu();
    }
  };

  const handleShowTutorial = () => {
    setIsOpen(false);
    onShowTutorial();
  };

  const handleToggleSound = () => {
    onToggleSound();
    // Don't close menu, allow multiple toggles
  };

  return (
    <div className="settings-menu-container">
      {/* Hamburger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="hamburger-button"
        aria-label={isOpen ? 'Close settings menu' : 'Open settings menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Menu Panel */}
      {isOpen && (
        <div
          ref={menuRef}
          className="settings-panel"
          role="menu"
          aria-label="Settings menu"
        >
          <h3 className="settings-title">Settings</h3>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="settings-item"
            role="menuitem"
            aria-label={soundEnabled ? 'Disable sound' : 'Enable sound'}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            <span>Sound: {soundEnabled ? 'On' : 'Off'}</span>
          </button>

          {/* Language (placeholder for future) */}
          <button
            className="settings-item disabled"
            disabled
            role="menuitem"
            aria-label="Language selection (coming soon)"
          >
            <Globe size={20} />
            <span>Language: English</span>
            <span className="coming-soon">More coming soon</span>
          </button>

          <div className="settings-divider" />

          {/* New Game */}
          <button
            onClick={handleNewGame}
            className="settings-item"
            role="menuitem"
            aria-label="Start new game"
          >
            <RotateCcw size={20} />
            <span>New Game</span>
          </button>

          {/* Save Progress */}
          <button
            onClick={handleSaveProgress}
            className="settings-item"
            role="menuitem"
            aria-label="Save progress"
          >
            <Save size={20} />
            <span>Save Progress</span>
          </button>

          {/* Load Progress */}
          <button
            onClick={handleLoadProgress}
            className="settings-item"
            role="menuitem"
            aria-label="Load progress"
          >
            <FolderOpen size={20} />
            <span>Load Progress</span>
          </button>

          <div className="settings-divider" />

          {/* Tutorial */}
          <button
            onClick={handleShowTutorial}
            className="settings-item"
            role="menuitem"
            aria-label="Show tutorial"
          >
            <BookOpen size={20} />
            <span>Tutorial</span>
          </button>

          {/* Back to Menu (only show in game) */}
          {inGame && (
            <>
              <div className="settings-divider" />
              <button
                onClick={handleBackToMenu}
                className="settings-item danger"
                role="menuitem"
                aria-label="Back to main menu"
              >
                <Home size={20} />
                <span>Main Menu</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
