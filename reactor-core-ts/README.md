# Reactor Core - TypeScript Edition

An educational algebra game built with React and TypeScript. Players solve equations by manipulating energy cards to stabilize reactor cores.

## Project Structure

```
reactor-core-ts/
├── src/
│   ├── components/          # React components
│   │   ├── Tutorial.tsx     # Tutorial modal
│   │   └── UnitGrid.tsx     # Visual equation display
│   ├── types/               # TypeScript type definitions
│   │   └── game.types.ts    # Core game types
│   ├── utils/               # Utility functions
│   │   ├── gameLogic.ts     # Game mechanics
│   │   └── soundEngine.ts   # Audio system
│   ├── styles/              # CSS stylesheets
│   │   ├── index.css        # Base styles
│   │   └── App.css          # Component styles
│   ├── App.tsx              # Main application
│   └── main.tsx             # Entry point
├── index.html               # HTML template
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
└── README.md               # This file
```

## Features

- **Pure TypeScript**: Strict type checking for reliability
- **Custom CSS**: No Tailwind dependency, fully custom styling
- **Accessible**: WCAG 2.1 AA compliant with keyboard navigation
- **Sound Engine**: Web Audio API for game effects
- **LocalStorage**: Progress persistence
- **Responsive**: Mobile-first design

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Game Mechanics

### Objective
Get the value next to **E** to equal **0** by using energy cards.

### How It Works
- Each card applies to **both sides** of the equation
- **Matter (⚛+)** cards add positive energy
- **Antimatter (⚛−)** cards add negative energy
- Solve in minimum moves for optimal star rating

### Controls
- **Mouse/Touch**: Click cards to use them
- **Keyboard**: 
  - Arrow keys to navigate cards
  - Enter/Space to select card
  - Tab for focus navigation
  - Escape to close modals

## Development Notes

### Type Safety
All game logic uses strict TypeScript types defined in `src/types/game.types.ts`.

### State Management
Uses React hooks (useState, useEffect, useCallback, useRef) for state management.

### Animation System
- CSS keyframe animations
- React state-driven animation triggers
- Timeout cleanup for memory management

### Accessibility
- Semantic HTML elements
- ARIA labels and roles
- Focus management
- Screen reader support
- Keyboard-only navigation

## CSS Architecture

### Structure
- `index.css`: Reset, base styles, animations
- `App.css`: Component-specific styles
- No CSS preprocessors or CSS-in-JS

### Naming Convention
- BEM-inspired class names
- Descriptive, semantic names
- Utility classes for common patterns

### Responsive Design
- Mobile-first approach
- Breakpoints: 640px (sm), 768px (md)
- Flexible layouts with CSS Grid and Flexbox

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern mobile browsers

## License

MIT - See comprehensive technical specification for full details.

## Future Enhancements

This is Phase 1 of the rebuild. Future phases will add:
- Zustand state management
- Economic progression system
- Upgrade doctrine trees
- Critical Mass mode
- i18n support
- Comprehensive testing
- SCORM integration hooks
