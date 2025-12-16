import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface TutorialProps {
  onClose: () => void;
}

export const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap: Keep focus within modal
  useEffect(() => {
    if (!modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus the close button when modal opens
    closeButtonRef.current?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  return (
    <div className="tutorial-overlay">
      <div
        ref={modalRef}
        className="tutorial-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
      >
        <div className="tutorial-header">
          <h2 id="tutorial-title" className="tutorial-title">
            Reactor Core Tutorial
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="btn-close-tutorial"
            aria-label="Close tutorial"
          >
            <X size={32} />
          </button>
        </div>

        <div className="tutorial-content">
          <div className="tutorial-section">
            <h3 className="tutorial-section-title mission">🎯 Your Mission</h3>
            <div className="tutorial-section-content">
              <strong>Get the value next to E to equal 0.</strong> When you do, the reactor stabilizes
              and you win!
            </div>
          </div>

          <div className="tutorial-section">
            <h3 className="tutorial-section-title how-it-works">⚛️ How It Works</h3>
            <div className="tutorial-list">
              <p>
                • <span className="text-yellow-400" style={{ fontWeight: 'bold' }}>E</span> represents
                an unknown energy level
              </p>
              <p>
                • The equation shows:{' '}
                <span style={{ fontFamily: 'monospace' }} className="text-cyan-300">
                  E + (number) = result
                </span>
              </p>
              <p>• Tap any energy card to inject it into BOTH sides of the equation</p>
              <p>
                • <span className="text-green-400">Matter ⚛ (+)</span> adds positive energy
              </p>
              <p>
                • <span className="text-red-400">Antimatter ⚛ (−)</span> adds negative energy
              </p>
            </div>
          </div>

          <div className="tutorial-section">
            <h3 className="tutorial-section-title example">💡 Example</h3>
            <div className="tutorial-example">
              <p>
                If you see: <span className="text-cyan-300">E + (2) = 7</span>
              </p>
              <p>
                You need: <span className="text-red-400">2 Antimatter</span> to get to{' '}
                <span className="text-yellow-400">E + (0) = 5</span>
              </p>
              <p className="text-green-400" style={{ marginTop: '0.5rem' }}>
                ✓ Reactor Stabilized!
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-start-mission">
            Start Mission
          </button>
        </div>
      </div>
    </div>
  );
};
