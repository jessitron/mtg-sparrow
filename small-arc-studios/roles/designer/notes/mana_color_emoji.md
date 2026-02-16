# MTG Mana Color Emoji Selection

**Date**: 2026-02-16
**Purpose**: Visual representation of the five MTG mana colors in Honeycomb trace span attributes

## Design Goals

- Visual distinctiveness at small sizes (16-24px in web UI)
- Thematic alignment with MTG color philosophy
- Universal emoji support across modern platforms
- Render clarity in Honeycomb's web interface

## Primary Recommendations

| Color | Emoji | Identity Alignment |
|-------|-------|------------------|
| White (W) | ☀️ | Plains, light, order, law |
| Blue (U) | 💧 | Islands, water, knowledge, intellect |
| Black (B) | 💀 | Swamps, death, ambition, power |
| Red (R) | 🔥 | Mountains, fire, passion, chaos |
| Green (G) | 🌿 | Forests, nature, growth, life |

**Combined example**: ☀️💧 (Azorius - White/Blue)

## Rationale

### White: ☀️ (Sunlight)
- Sun is the ultimate symbol of light and order
- Plains are sun-lit landscapes
- Represents clarity and law
- Alternative: ⚪ (white circle - too abstract)

### Blue: 💧 (Water Droplet)
- Islands are surrounded by water
- Water represents flow of knowledge and intellect
- Liquid nature suggests adaptability
- Alternative: 🌊 (ocean wave - more forceful but renders larger)

### Black: 💀 (Skull)
- Direct reference to death and mortality
- Represents Black's ambition and power through sacrifice
- Highly distinctive visually at small sizes
- Alternative: 🖤 (black heart - softer interpretation)

### Red: 🔥 (Fire)
- Mountains contain volcanic fire
- Fire represents passion and chaos
- Universally recognized as energy and danger
- Alternative: ⚡ (lightning - more storm-like)

### Green: 🌿 (Herb/Leaf Sprout)
- Subtle botanical reference without being a full tree
- Represents nature and growth
- Clean and simple
- Alternative: 🌲 (tree - bolder but larger rendering)

## Integration Notes

These emoji are designed for use in Honeycomb trace span attributes where mana color combinations are tagged.

Example workflow:
1. User views a card (e.g., "Azorius Charm")
2. Honeycomb span shows mana_colors attribute: "☀️💧"
3. Player quickly associates the combo with its name

## Testing Considerations

- Verify rendering at actual Honeycomb UI sizes
- Test in both light and dark themes
- Confirm mobile responsiveness
- Check accessibility with screen readers
