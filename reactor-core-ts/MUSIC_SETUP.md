# Background Music Setup

## Required File

Place your background music file at:
```
src/assets/preparing-for-the-uncertain-442653.mp3
```

## Music Behavior

- **Starts**: When "Initialize Core" button is pressed (game begins)
- **Loops**: Continuously during gameplay
- **Stops**: When returning to main menu
- **Toggle**: Can be turned on/off via settings menu (hamburger button)
- **Volume**: Set to 30% by default (adjustable in code)

## Supported Formats

The game supports:
- `.mp3`
- `.wav`
- `.ogg`

## If Music File is Missing

If the music file is not present, the game will:
- Log an error to console
- Continue to work normally without music
- Sound effects will still function

## Adjusting Music Volume

To change the default music volume, edit `src/utils/soundEngine.ts`:

```typescript
let musicVolume = 0.3; // Change this value (0.0 to 1.0)
```

Or use the runtime method:
```typescript
SoundEngine.setMusicVolume(0.5); // 50% volume
```

## Implementation Details

- Music uses HTML5 Audio API (not Web Audio oscillators)
- Separate from sound effects system
- Controlled by same "Sound" toggle in settings
- Persists setting to localStorage
