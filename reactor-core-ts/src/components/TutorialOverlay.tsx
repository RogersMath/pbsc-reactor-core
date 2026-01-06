import React from 'react';
import { MousePointerClick, X } from 'lucide-react';

interface TutorialOverlayProps {
  step: number;
  onNext: () => void;
  onClose: () => void;
  equationTerm: number; // The "b" in X + b = c
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ 
  step, 
  onNext, 
  onClose,
  equationTerm 
}) => {
  const isMatter = equationTerm > 0;
  const targetValue = Math.abs(equationTerm);
  const targetType = isMatter ? "Matter" : "Antimatter";
  const counterType = isMatter ? "Antimatter" : "Matter";
  const counterColor = isMatter ? "text-red-400" : "text-green-400";

  return (
    <div className="tutorial-backdrop">
      {/* Step 1: Explain the Goal (Spotlight on Equation) */}
      {step === 1 && (
        <div className="tutorial-card centered">
          <h3 className="tutorial-title">⚠️ SYSTEM UNSTABLE</h3>
          <p>The Reactor Core has a non-zero energy reading, there is an addend.</p>
          <p>Your mission is to isolate <strong>X</strong> to stabilize the core.</p>
          <button onClick={onNext} className="btn-tutorial-next">
            ANALYZE
          </button>
        </div>
      )}

      {/* Step 2: Identify the Problem (Spotlight on Left Constant) */}
      {step === 2 && (
        <div className="tutorial-card near-equation">
          <h3 className="tutorial-title">ANALYSIS COMPLETE</h3>
          <p>
            Detected excess <span className={isMatter ? "text-green-400" : "text-red-400"}>{targetValue} {targetType}</span> attached to the core.
          </p>
          <p>We must neutralize this value to get <strong>X</strong> to zero.</p>
          <button onClick={onNext} className="btn-tutorial-next">
            INITIATE COUNTERMEASURE
          </button>
        </div>
      )}

      {/* Step 3: Explain the Solution (Spotlight on Cards) */}
      {step === 3 && (
        <div className="tutorial-card near-deck">
          <h3 className="tutorial-title">SELECT DOCTRINE</h3>
          <p>
            Use <span className={counterColor}>{counterType}</span> cards from your deck.
          </p>
          <p>
            <span className={counterColor}>
              {isMatter ? "Antimatter (−)" : "Matter (+)"}
            </span> cancels out {targetType}.
          </p>
          <p className="tutorial-instruction">
            <MousePointerClick size={16} /> Tap a card to inject energy.
          </p>
          <button onClick={onClose} className="btn-tutorial-start">
            ENGAGE
          </button>
        </div>
      )}

      <button onClick={onClose} className="btn-tutorial-skip">
        <X size={24} />
      </button>
    </div>
  );
};