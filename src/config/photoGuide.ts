/**
 * Mesa Photo Guide
 *
 * Customers should drop renamed photos into `public/photos/`. Filenames
 * here MUST match the `src` values in `src/config/site.config.ts`.
 *
 * Variants:
 *   - Essentials: 6 gallery + hero + about (≈ 8 total)
 *   - Portfolio:  12-16 gallery + hero + about (≈ 18 total)
 */

export interface PhotoBrief {
  filename: string
  shot: string
  notes: string
  /** 'essentials' photos are required for both variants. */
  variant: 'essentials' | 'portfolio'
}

export const MESA_PHOTO_GUIDE: PhotoBrief[] = [
  { filename: 'hero.jpg', shot: 'Signature exterior or signature dish at golden hour', notes: 'Landscape, 16:9 minimum, 2400px wide. Dramatic lighting.', variant: 'essentials' },
  { filename: 'about-room.jpg', shot: 'Wide dining room with people lightly visible', notes: 'Portrait or 4:5. Warm light, soft motion blur OK.', variant: 'essentials' },
  { filename: 'dish-01.jpg', shot: 'Top-down hero plate', notes: 'Square. Natural light, fork-ready styling.', variant: 'essentials' },
  { filename: 'dish-02.jpg', shot: 'Salad / lighter dish, 45° angle', notes: '4:3. Show texture and color contrast.', variant: 'essentials' },
  { filename: 'dish-03.jpg', shot: 'Centerpiece / large-format dish', notes: '4:3. Steam, sauce, generous portion.', variant: 'essentials' },
  { filename: 'interior-01.jpg', shot: 'Bar seating or counter detail', notes: 'Portrait. Glassware, brass, wood textures.', variant: 'essentials' },
  { filename: 'interior-02.jpg', shot: 'Window or doorway with daylight', notes: 'Portrait or 4:3. Hand-held feel; show neighborhood through window.', variant: 'essentials' },
  { filename: 'team-01.jpg', shot: 'Chef or staff at work', notes: 'Square or 4:5. Hands, motion, focus, no posed smiles.', variant: 'essentials' },

  { filename: 'dish-04.jpg', shot: 'Dessert or pastry close-up', notes: 'Macro. Crumbs, glaze, hand for scale.', variant: 'portfolio' },
  { filename: 'dish-05.jpg', shot: 'Drinks / cocktail / coffee', notes: 'Portrait. Backlit liquid, condensation.', variant: 'portfolio' },
  { filename: 'dish-06.jpg', shot: 'Family-style table spread', notes: 'Wide overhead. Multiple plates, hands reaching.', variant: 'portfolio' },
  { filename: 'interior-03.jpg', shot: 'Kitchen / open hearth in action', notes: 'Action shot, fire / steam.', variant: 'portfolio' },
  { filename: 'interior-04.jpg', shot: 'Quiet detail: menu board, ceramics, signage', notes: 'Square. Strong texture.', variant: 'portfolio' },
  { filename: 'team-02.jpg', shot: 'Server delivering plate to table', notes: 'Tells the service story.', variant: 'portfolio' },
  { filename: 'guests-01.jpg', shot: 'Two friends sharing a meal (with permission)', notes: 'Candid. Warm laughter, no logos.', variant: 'portfolio' },
  { filename: 'exterior-01.jpg', shot: 'Storefront at dusk with lights on', notes: 'Wide. Capture the address number.', variant: 'portfolio' },
]
