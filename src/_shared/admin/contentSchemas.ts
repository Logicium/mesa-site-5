/**
 * Per-archetype content shape + tab descriptors used by ContentView.
 *
 * Each archetype shares the common tabs (brand, contact, hours, photos, story,
 * testimonials, social) and adds one archetype-specific tab (menu, rooms,
 * services, products, mission).
 */

export type TabId =
  | 'brand'
  | 'contact'
  | 'hours'
  | 'photos'
  | 'story'
  | 'menu'
  | 'rooms'
  | 'services'
  | 'products'
  | 'mission'
  | 'testimonials'
  | 'social'

export interface TabDef {
  id: TabId
  label: string
}

export type ArchetypeName = 'mesa' | 'hearth' | 'keystone' | 'vault' | 'project'

const COMMON_HEAD: TabDef[] = [
  { id: 'brand',   label: 'Brand'   },
  { id: 'contact', label: 'Contact' },
  { id: 'hours',   label: 'Hours'   },
  { id: 'photos',  label: 'Photos'  },
  { id: 'story',   label: 'Story'   },
]
const COMMON_TAIL: TabDef[] = [
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'social',       label: 'Social'       },
]

const PER_ARCHETYPE: Record<ArchetypeName, TabDef[]> = {
  mesa:     [{ id: 'menu',     label: 'Menu'     }],
  hearth:   [{ id: 'rooms',    label: 'Rooms'    }],
  keystone: [{ id: 'services', label: 'Services' }],
  vault:    [{ id: 'products', label: 'Products' }],
  project:  [{ id: 'mission',  label: 'Mission'  }],
}

export function tabsForArchetype(archetype: string | undefined | null): TabDef[] {
  const a = (archetype ?? 'mesa').toLowerCase() as ArchetypeName
  const extra = PER_ARCHETYPE[a] ?? []
  return [...COMMON_HEAD, ...extra, ...COMMON_TAIL]
}
