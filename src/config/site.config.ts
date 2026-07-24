import type { ThemeName, SwatchName, SiteVariant } from '@apotome/archetype-shared/themes/tokens'

/** Photo manifest entry; `slot` matches a key in `photos.*` below. */
export interface PhotoSlot { src: string; alt?: string; caption?: string }

export interface MesaPhotos {
  hero: PhotoSlot
  about: PhotoSlot
  /** Gallery: 6-8 in essentials, 12-16 in portfolio. */
  gallery: PhotoSlot[]
}

export interface MenuItem { name: string; description?: string; price: string; tags?: string[] }
export interface MenuCategory { name: string; description?: string; items: MenuItem[] }

export interface MesaSiteConfig {
  brand: string
  tagline: string
  blurb: string
  theme: ThemeName
  swatch: SwatchName
  variant: SiteVariant
  contact: {
    address: string
    phone: string
    email: string
    mapEmbedUrl?: string
  }
  hours: Array<{ day: string; open: string }>
  photos: MesaPhotos
  story: { title: string; paragraphs: string[]; facts?: Array<{ label: string; value: string }> }
  menu: { intro?: string; categories: MenuCategory[]; fullMenuUrl?: string }
  testimonials: Array<{ quote: string; author: string; source?: string }>
  social: Array<{ label: string; href: string }>
  /** Editable section headers (eyebrows / titles / notes) so owners have full
   *  control over every heading on the site, not just body copy. */
  sections: {
    story: { eyebrow: string }
    gallery: { eyebrow: string; title: string }
    featured: { eyebrow: string; title: string }
    hours: { eyebrow: string; title: string; note: string }
    reviews: { eyebrow: string }
    galleryPage: { eyebrow: string; title: string }
    menuPage: { eyebrow: string; title: string }
    order: { eyebrow: string; title: string }
    visit: { eyebrow: string; title: string; subtitle: string }
    contact: { title: string }
  }
}

/**
 * Demo configuration. To deploy for a customer, change values here only.
 * Switch `theme` / `swatch` / `variant` to instantly re-skin the site.
 */
import { reactive } from 'vue'

export const siteConfig: MesaSiteConfig = reactive(({
  brand: 'Mesa Trinidad',
  tagline: 'Wood-fired kitchen',
  blurb: 'A neighborhood kitchen serving Southern Colorado classics with a wood-fired heart.',
  theme: 'studio',
  swatch: 'sand',
  variant: 'essentials',
  contact: {
    address: '123 Main St, Trinidad, CO 81082',
    phone: '(719) 555-0142',
    email: 'hello@mesatrinidad.com',
    mapEmbedUrl: 'https://www.google.com/maps?q=Trinidad,CO&output=embed',
  },
  hours: [
    { day: 'Monday', open: 'Closed' },
    { day: 'Tuesday – Thursday', open: '11:00 – 9:00' },
    { day: 'Friday – Saturday', open: '11:00 – 10:00' },
    { day: 'Sunday', open: '10:00 – 8:00' },
  ],
  photos: {
    hero: { src: '/photos/hero.jpg', alt: 'Wood-fired oven at golden hour' },
    about: { src: '/photos/about-room.jpg', alt: 'Dining room interior' },
    gallery: [
      { src: '/photos/dish-01.jpg', alt: 'Hand-shaped pizza' },
      { src: '/photos/dish-02.jpg', alt: 'Seasonal salad' },
      { src: '/photos/dish-03.jpg', alt: 'Braised dish' },
      { src: '/photos/interior-01.jpg', alt: 'Bar seating' },
      { src: '/photos/interior-02.jpg', alt: 'Window table' },
      { src: '/photos/team-01.jpg', alt: 'Chef plating' },
    ],
  },
  story: {
    title: 'A table built for Trinidad.',
    paragraphs: [
      'Mesa opened in a 19th-century brick storefront with one idea: feed the people of Trinidad the way their grandparents used to be fed — slow, generous, and seasonal.',
      'Our cooks pull from the high-desert pantry: chiles, beans, lamb, and stone-fruit from valleys you can see from the back door.',
    ],
    facts: [
      { label: 'Founded', value: '2024' },
      { label: 'Seats', value: '48' },
      { label: 'Heat', value: 'Wood-fired' },
    ],
  },
  menu: {
    intro: 'Updated weekly with whatever is best from the valley. Ask about tonight’s specials.',
    categories: [
      {
        name: 'Small',
        items: [
          { name: 'Wood-fired bread', description: 'Cultured butter, sea salt', price: '$8' },
          { name: 'Charred greens', description: 'Lemon, pecorino, anchovy', price: '$12', tags: ['GF'] },
          { name: 'House chorizo', description: 'Stone-ground mustard, pickles', price: '$14' },
        ],
      },
      {
        name: 'Large',
        items: [
          { name: 'Margherita pizza', description: 'San Marzano, mozzarella, basil', price: '$18', tags: ['V'] },
          { name: 'Braised lamb', description: 'Posole, lime, charred onion', price: '$28' },
          { name: 'Pan-roasted trout', description: 'Brown butter, herbs', price: '$26' },
        ],
      },
      {
        name: 'Sweet',
        items: [
          { name: 'Olive oil cake', description: 'Citrus, crème fraîche', price: '$10' },
          { name: 'Affogato', description: 'Local espresso, vanilla bean', price: '$8' },
        ],
      },
    ],
  },
  testimonials: [
    { quote: 'The best meal we have had in Southern Colorado. Twice.', author: 'Diana K.', source: 'Google' },
    { quote: 'Real food, real welcome. Mesa is the new heart of Main Street.', author: 'Marcus R.', source: 'Yelp' },
    { quote: 'Bread alone is worth the drive from Pueblo.', author: 'Sam P.', source: 'Tripadvisor' },
  ],
  social: [
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'Facebook', href: 'https://facebook.com' },
  ],
  sections: {
    story: { eyebrow: 'Our story' },
    gallery: { eyebrow: 'From the kitchen', title: 'A look around' },
    featured: { eyebrow: 'Tonight', title: 'A few favorites' },
    hours: { eyebrow: 'Visit', title: 'When to come by', note: 'Brunch and dinner. Reservations recommended on weekends.' },
    reviews: { eyebrow: 'Kind words' },
    galleryPage: { eyebrow: 'Gallery', title: 'The kitchen, the room, the food' },
    menuPage: { eyebrow: 'Eat with us', title: 'The full menu' },
    order: { eyebrow: 'Order', title: 'Order for pickup' },
    visit: { eyebrow: 'Visit', title: 'Find your seat', subtitle: 'We are easy to find on Main Street, with parking on the cross streets.' },
    contact: { title: 'Reservations & questions' },
  },
}))
