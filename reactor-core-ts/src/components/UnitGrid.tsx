import React from 'react';

interface UnitGridProps {
  value: number;
}

export const UnitGrid: React.FC<UnitGridProps> = ({ value }) => {
  const absValue = Math.abs(value);
  const isPositive = value > 0;
  const isZero = value === 0;
  
  // Special case for zero
  if (isZero) {
    return (
      <div className="unit-grid-container">
        <div className="unit-square zero" aria-label="0 units">
          <div className="unit-badge zero">0</div>
          <div className="unit-grid zero">0</div>
        </div>
      </div>
    );
  }
  
  const typeClass = isPositive ? 'matter' : 'antimatter';
  const colorText = isPositive ? 'var(--green-400)' : 'var(--red-400)';

  // Create blocks of max 25 units
  const squares: number[] = [];
  let remaining = absValue;
  while (remaining > 0) {
    squares.push(Math.min(remaining, 25));
    remaining -= 25;
  }

  return (
    <div className="unit-grid-container">
      {squares.map((size, index) => {
        // Calculate columns for a nice rectangular shape
        // Sqrt(6) = 2.45 -> ceil = 3 columns. 6 items / 3 cols = 2 rows. Perfect.
        const cols = Math.ceil(Math.sqrt(size));
        
        return (
          <div 
            key={index} 
            className={`unit-square ${typeClass}`}
            aria-label={`${size} ${isPositive ? 'Matter' : 'Antimatter'} ${size === 1 ? 'unit' : 'units'}`}
          >
            <div className={`unit-badge ${typeClass}`}>
              {size}
            </div>
            <div 
              className={`unit-grid ${typeClass}`}
              style={{ 
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: '2px', // Tighter gap for the atoms
                fontSize: size === 1 ? '1.5rem' : '0.6rem', // Smaller atoms for groups
                color: colorText
              }}
              aria-hidden="true"
            >
              {Array(size).fill(0).map((_, i) => (
                <span key={i} className="unit-symbol">⚛</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};