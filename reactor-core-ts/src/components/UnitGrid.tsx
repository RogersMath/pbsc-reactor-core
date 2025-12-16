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
          <div className="unit-grid zero" aria-hidden="true">
            0
          </div>
        </div>
      </div>
    );
  }

  const type = isPositive ? 'matter' : 'antimatter';

  // Create squares of max 25
  const squares: number[] = [];
  let remaining = absValue;
  while (remaining > 0) {
    squares.push(Math.min(remaining, 25));
    remaining -= 25;
  }

  return (
    <div className="unit-grid-container">
      {squares.map((size, index) => (
        <div
          key={index}
          className={`unit-square ${type}`}
          aria-label={`${size} ${isPositive ? 'Matter' : 'Antimatter'} ${size === 1 ? 'unit' : 'units'}`}
        >
          <div className={`unit-badge ${type}`}>{size}</div>
          <div
            className={`unit-grid ${type}`}
            style={{
              gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(size))}, 1fr)`,
              fontSize: size === 1 ? '1.5rem' : '0.75rem',
            }}
            aria-hidden="true"
          >
            {Array(size)
              .fill(0)
              .map((_, i) => (
                <span key={i} className="unit-symbol">
                  ⚛
                </span>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};
