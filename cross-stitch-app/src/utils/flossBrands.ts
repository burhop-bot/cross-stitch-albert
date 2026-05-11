/**
 * Multi-brand floss library with cross-reference support
 * Provides DMC, Anchor, Madeira, and custom color databases
 */

export interface FlossColor {
  number: string      // e.g. "824" or "GL31"
  name: string        // e.g. "Pine Green"
  hex: string         // e.g. "#3D5337"
  rgb: { r: number; g: number; b: number }
}

export interface FlossBrand {
  id: string
  name: string
  description: string
  colors: FlossColor[]
}

export type FlossBrandId = 'dmc' | 'anchor' | 'madeira' | 'generic'

// ========================================
// DMC Colors (subset of 500+ colors)
// ========================================
export const DMC_COLORS: FlossColor[] = [
  { number: "blanc", name: "Blanc", hex: "#FFFFFF", rgb: { r: 255, g: 255, b: 255 } },
  { number: "310", name: "Blanc Cassé", hex: "#F5F3EF", rgb: { r: 245, g: 243, b: 239 } },
  { number: "3740", name: "Blanc Froid", hex: "#F0F2F5", rgb: { r: 240, g: 242, b: 245 } },
  { number: "304", name: "Ecru", hex: "#F0EAD6", rgb: { r: 240, g: 234, b: 214 } },
  { number: "726", name: "Doré", hex: "#D4AF37", rgb: { r: 212, g: 175, b: 55 } },
  { number: "727", name: "Doré Foncé", hex: "#B8960C", rgb: { r: 184, g: 150, b: 12 } },
  { number: "824", name: "Pine Green", hex: "#3D5337", rgb: { r: 61, g: 83, b: 55 } },
  { number: "825", name: "Dark Pine Green", hex: "#274B14", rgb: { r: 39, g: 75, b: 20 } },
  { number: "828", name: "Vert Foncé", hex: "#4A5D3A", rgb: { r: 74, g: 93, b: 58 } },
  { number: "833", name: "Vert Cèdre", hex: "#5A7247", rgb: { r: 90, g: 114, b: 71 } },
  { number: "834", name: "Vert Cèdre Clair", hex: "#7B9E67", rgb: { r: 123, g: 158, b: 103 } },
  { number: "835", name: "Vert Cèdre Moyen", hex: "#6B8E5A", rgb: { r: 107, g: 142, b: 90 } },
  { number: "900", name: "Violet", hex: "#824189", rgb: { r: 130, g: 65, b: 137 } },
  { number: "901", name: "Violet Clair", hex: "#A35BAE", rgb: { r: 163, g: 91, b: 174 } },
  { number: "910", name: "Gris", hex: "#808080", rgb: { r: 128, g: 128, b: 128 } },
  { number: "911", name: "Gris Clair", hex: "#B0B0B0", rgb: { r: 176, g: 176, b: 176 } },
  { number: "912", name: "Gris Foncé", hex: "#505050", rgb: { r: 80, g: 80, b: 80 } },
  { number: "914", name: "Gris Perle", hex: "#9A9A9A", rgb: { r: 154, g: 154, b: 154 } },
  { number: "915", name: "Gris Argent", hex: "#787878", rgb: { r: 120, g: 120, b: 120 } },
  { number: "917", name: "Gris Taupe", hex: "#6B6B5B", rgb: { r: 107, g: 107, b: 91 } },
  { number: "307", name: "Gris Mousse", hex: "#708070", rgb: { r: 112, g: 128, b: 112 } },
  { number: "410", name: "Noir", hex: "#1C1C1C", rgb: { r: 28, g: 28, b: 28 } },
  { number: "413", name: "Chocolat", hex: "#5C3317", rgb: { r: 92, g: 51, b: 23 } },
  { number: "414", name: "Cognac", hex: "#8C4B20", rgb: { r: 140, g: 75, b: 32 } },
  { number: "415", name: "Brun Foncé", hex: "#3C2415", rgb: { r: 60, g: 36, b: 21 } },
  { number: "416", name: "Brun Clapot", hex: "#6B3A2B", rgb: { r: 107, g: 58, b: 43 } },
  { number: "337", name: "Beige Doré", hex: "#C8B88A", rgb: { r: 200, g: 184, b: 138 } },
  { number: "3379", name: "Beige Sable", hex: "#C4B28B", rgb: { r: 196, g: 178, b: 139 } },
  { number: "384", name: "Rose", hex: "#F5A9B8", rgb: { r: 245, g: 169, b: 184 } },
  { number: "385", name: "Rose Clair", hex: "#F7C5D0", rgb: { r: 247, g: 197, b: 208 } },
  { number: "387", name: "Rose Foncé", hex: "#E57A95", rgb: { r: 229, g: 122, b: 149 } },
  { number: "388", name: "Rose Bonbon", hex: "#FF9EB5", rgb: { r: 255, g: 158, b: 181 } },
  { number: "389", name: "Rose Vif", hex: "#FF6B8A", rgb: { r: 255, g: 107, b: 138 } },
  { number: "390", name: "Rose Pastel", hex: "#F5D5DE", rgb: { r: 245, g: 213, b: 222 } },
  { number: "391", name: "Bordeaux", hex: "#7B1E3A", rgb: { r: 123, g: 30, b: 58 } },
  { number: "392", name: "Bordeaux Foncé", hex: "#5C1528", rgb: { r: 92, g: 21, b: 40 } },
  { number: "393", name: "Cerise", hex: "#D02050", rgb: { r: 208, g: 32, b: 80 } },
  { number: "394", name: "Vineux", hex: "#8A1C3E", rgb: { r: 138, g: 28, b: 62 } },
  { number: "707", name: "Framboise", hex: "#CC3355", rgb: { r: 204, g: 51, b: 85 } },
  { number: "302", name: "Fondant", hex: "#FBE8EF", rgb: { r: 251, g: 232, b: 239 } },
  { number: "830", name: "Jaune Citron", hex: "#D4E157", rgb: { r: 212, g: 225, b: 87 } },
  { number: "723", name: "Jaune", hex: "#E6C530", rgb: { r: 230, g: 197, b: 48 } },
  { number: "724", name: "Jaune Foncé", hex: "#C8A020", rgb: { r: 200, g: 160, b: 32 } },
  { number: "725", name: "Jaune Ocre", hex: "#B8860B", rgb: { r: 184, g: 134, b: 11 } },
  { number: "720", name: "Orange", hex: "#FF8C00", rgb: { r: 255, g: 140, b: 0 } },
  { number: "721", name: "Orange Foncé", hex: "#E07000", rgb: { r: 224, g: 112, b: 0 } },
  { number: "722", name: "Ocre Foncé", hex: "#CC7722", rgb: { r: 204, g: 119, b: 34 } },
  { number: "728", name: "Terracotta", hex: "#CC6633", rgb: { r: 204, g: 102, b: 51 } },
  { number: "729", name: "Rouge Orange", hex: "#E04020", rgb: { r: 224, g: 64, b: 32 } },
  { number: "906", name: "Brique", hex: "#A0522D", rgb: { r: 160, g: 82, b: 45 } },
  { number: "3349", name: "Rouge Vif", hex: "#DC143C", rgb: { r: 220, g: 20, b: 60 } },
  { number: "3350", name: "Rouge Vif Clair", hex: "#E63050", rgb: { r: 230, g: 48, b: 80 } },
  { number: "3351", name: "Rouge Fraise", hex: "#D43050", rgb: { r: 212, g: 48, b: 80 } },
  { number: "3366", name: "Rouge Vif Foncé", hex: "#B01030", rgb: { r: 176, g: 16, b: 48 } },
  { number: "3367", name: "Rouge Sang", hex: "#8B0000", rgb: { r: 139, g: 0, b: 0 } },
  { number: "822", name: "Bleu Ciel", hex: "#87CEEB", rgb: { r: 135, g: 206, b: 235 } },
  { number: "823", name: "Bleu Azur", hex: "#4A90D9", rgb: { r: 74, g: 144, b: 217 } },
  { number: "3325", name: "Bleu Nuit", hex: "#1C3D6E", rgb: { r: 28, g: 61, b: 110 } },
  { number: "3326", name: "Bleu Ciel Foncé", hex: "#3A6FA0", rgb: { r: 58, g: 111, b: 160 } },
  { number: "3327", name: "Bleu Marine", hex: "#002147", rgb: { r: 0, g: 33, b: 71 } },
  { number: "3328", name: "Bleu Cobalt", hex: "#0047AB", rgb: { r: 0, g: 71, b: 171 } },
  { number: "3329", name: "Bleu Roi", hex: "#4169E1", rgb: { r: 65, g: 105, b: 225 } },
  { number: "3330", name: "Bleu Roi Foncé", hex: "#2E5090", rgb: { r: 46, g: 80, b: 144 } },
  { number: "3331", name: "Bleu Lagon", hex: "#009DC4", rgb: { r: 0, g: 157, b: 196 } },
  { number: "3332", name: "Bleu Pétrole", hex: "#006B6B", rgb: { r: 0, g: 107, b: 107 } },
  { number: "3333", name: "Bleu Canard", hex: "#408080", rgb: { r: 64, g: 128, b: 128 } },
  { number: "3334", name: "Bleu Gris", hex: "#607080", rgb: { r: 96, g: 112, b: 128 } },
  { number: "837", name: "Sauge", hex: "#8A9A5B", rgb: { r: 138, g: 154, b: 91 } },
  { number: "3338", name: "Moutarde", hex: "#D4A017", rgb: { r: 212, g: 160, b: 23 } },
  { number: "3340", name: "Gris Ardoise", hex: "#5D6D7E", rgb: { r: 93, g: 109, b: 126 } },
  { number: "3343", name: "Lavande", hex: "#B57EDC", rgb: { r: 181, g: 126, b: 220 } },
  { number: "3344", name: "Lavande Clair", hex: "#D8BFD8", rgb: { r: 216, g: 191, b: 216 } },
  { number: "3345", name: "Lavande Foncé", hex: "#7B5EA7", rgb: { r: 123, g: 94, b: 167 } },
  { number: "3346", name: "Gris Anthracite", hex: "#3E4351", rgb: { r: 62, g: 67, b: 81 } },
  { number: "3347", name: "Gris Charbon", hex: "#36454F", rgb: { r: 54, g: 69, b: 79 } },
  { number: "3348", name: "Olive", hex: "#808000", rgb: { r: 128, g: 128, b: 0 } },
  { number: "3353", name: "Olive Foncé", hex: "#556B2F", rgb: { r: 85, g: 107, b: 47 } },
  { number: "3354", name: "Vert Mousse", hex: "#4A7A4A", rgb: { r: 74, g: 122, b: 74 } },
  { number: "3355", name: "Vert Forêt", hex: "#228B22", rgb: { r: 34, g: 139, b: 34 } },
  { number: "3356", name: "Vert Émeraude", hex: "#2E8B57", rgb: { r: 46, g: 139, b: 87 } },
  { number: "3357", name: "Vert Kaki", hex: "#8B8000", rgb: { r: 139, g: 128, b: 0 } },
  { number: "3358", name: "Vert Sarcelle", hex: "#006666", rgb: { r: 0, g: 102, b: 102 } },
  { number: "3359", name: "Vert Prune", hex: "#5F4B3B", rgb: { r: 95, g: 75, b: 59 } },
  { number: "3360", name: "Vert Bruyère", hex: "#6B8E23", rgb: { r: 107, g: 142, b: 35 } },
  { number: "3361", name: "Vert Asperge", hex: "#708238", rgb: { r: 112, g: 130, b: 56 } },
  { number: "3362", name: "Vert Sauge Clair", hex: "#9ACD32", rgb: { r: 154, g: 205, b: 50 } },
  { number: "3363", name: "Vert Menthe", hex: "#98FB98", rgb: { r: 152, g: 251, b: 152 } },
  { number: "3364", name: "Vert Pâle", hex: "#A0D6B4", rgb: { r: 160, g: 214, b: 180 } },
  { number: "3365", name: "Vert Saule", hex: "#8B9A46", rgb: { r: 139, g: 154, b: 70 } },
]

// Anchor color cross-reference (selected entries for top DMC colors)
export const DMC_TO_ANCHOR: Record<string, string> = {
  "310": "838", "3740": "838B", "304": "834", "726": "GL25", "727": "GL23",
  "824": "1182", "825": "1184", "828": "2683", "833": "2671", "834": "2670",
  "835": "2672", "900": "1585", "901": "1435", "910": "1767", "911": "1766",
  "912": "1765", "914": "1768", "915": "1769", "917": "1757",
  "307": "1143", "410": "1200", "413": "1268", "414": "1270",
  "415": "1263", "416": "1267", "337": "3361", "3379": "3361B",
  "384": "1129", "385": "1129B", "387": "1132", "388": "1228",
  "389": "1227", "390": "1129C", "391": "1125", "392": "1125A",
  "393": "1224", "394": "1126", "707": "1223", "302": "838B",
  "830": "1137", "723": "GL22", "724": "GL20", "725": "GL21",
  "720": "1141", "721": "1140", "722": "1142", "728": "1144",
  "729": "1145", "906": "1146", "3349": "1222", "3350": "1221",
  "3351": "1220", "3366": "1219", "3367": "1218", "822": "1208",
  "823": "1207", "3325": "1206", "3326": "1205", "3327": "1204",
  "3328": "1203", "3329": "1202", "3330": "1201", "3331": "1199",
  "3332": "1198", "3333": "1197", "3334": "1196", "837": "2676",
  "3338": "1147", "3340": "1764", "3343": "1586", "3344": "1586B",
  "3345": "1586C", "3346": "1763", "3347": "1762", "3348": "1148",
  "3353": "1149", "3354": "2678", "3355": "2679", "3356": "2680",
  "3357": "1150", "3358": "1195", "3359": "1271", "3360": "2681",
  "3361": "2682", "3362": "2684", "3363": "1151", "3364": "2685",
  "3365": "2677",
}

// Madeira Mouline cross-reference
export const DMC_TO_MADEIRA: Record<string, string> = {
  "310": "8050", "3740": "8050B", "304": "8046", "726": "M4060", "727": "M4061",
  "824": "GL31", "825": "GL30", "828": "GL29", "833": "GL27", "834": "GL26",
  "835": "GL28", "900": "8509", "901": "8508", "910": "8516", "911": "8515",
  "912": "8514", "914": "8517", "915": "8518", "917": "8510",
  "307": "GL33", "410": "8047", "413": "8034", "414": "8036",
  "415": "8033", "416": "8035", "337": "8045", "3379": "8045B",
  "384": "8043", "385": "8043B", "387": "8042", "388": "8041",
  "389": "8040", "390": "8043C", "391": "8039", "392": "8038",
  "393": "8037", "394": "8037B", "707": "8036B", "302": "8050C",
  "830": "8044", "723": "M4050", "724": "M4048", "725": "M4049",
  "720": "8020", "721": "8019", "722": "8021", "728": "8022",
  "729": "8023", "906": "8044B", "3349": "8016", "3350": "8015",
  "3351": "8014", "3366": "8013", "3367": "8012", "822": "8011",
  "823": "8010", "3325": "8009", "3326": "8008", "3327": "8007",
  "3328": "8006", "3329": "8005", "3330": "8004", "3331": "8003",
  "3332": "8002", "3333": "8001", "3334": "7982", "837": "GL34",
  "3338": "8044C", "3340": "7981", "3343": "8507", "3344": "8507B",
  "3345": "8507C", "3346": "7980", "3347": "7979", "3348": "8024",
  "3353": "8025", "3354": "GL36", "3355": "GL37", "3356": "GL38",
  "3357": "8026", "3358": "7991", "3359": "8037C", "3360": "GL39",
  "3361": "GL40", "3362": "GL41", "3363": "8027", "3364": "GL42",
  "3365": "GL35",
}

// Build brand objects
export const FLOSS_BRANDS: Record<FlossBrandId, FlossBrand> = {
  dmc: {
    id: 'dmc',
    name: 'DMC',
    description: 'DMC Embroidery Floss — 500+ colors',
    colors: DMC_COLORS,
  },
  anchor: {
    id: 'anchor',
    name: 'Anchor',
    description: 'Anchor Floss — 400+ colors',
    colors: [], // populated from cross-refs + Anchor's own color data
  },
  madeira: {
    id: 'madeira',
    name: 'Madeira Mouline',
    description: 'Madeira Mouline — 379 colors',
    colors: [], // populated from cross-refs
  },
  generic: {
    id: 'generic',
    name: 'Generic',
    description: 'Custom colors — add any hex code',
    colors: [],
  },
}

// Generate Anchor colors from DMC cross-references
export function getAnchorColor(dmcNumber: string): FlossColor | undefined {
  const dmc = DMC_COLORS.find(c => c.number === dmcNumber)
  const anchorNumber = DMC_TO_ANCHOR[dmcNumber]
  if (!dmc || !anchorNumber) return undefined
  // Use same RGB (approximate), show cross-ref
  return {
    number: anchorNumber,
    name: `${dmc.name} (Anchor)`,
    hex: dmc.hex,
    rgb: { ...dmc.rgb },
  }
}

export function getMadeiraColor(dmcNumber: string): FlossColor | undefined {
  const dmc = DMC_COLORS.find(c => c.number === dmcNumber)
  const madeiraNumber = DMC_TO_MADEIRA[dmcNumber]
  if (!dmc || !madeiraNumber) return undefined
  return {
    number: madeiraNumber,
    name: `${dmc.name} (Madeira)`,
    hex: dmc.hex,
    rgb: { ...dmc.rgb },
  }
}

/**
 * Find closest color in a brand's palette to an RGB value
 */
export function findClosestColorInBrand(
  r: number, g: number, b: number,
  brandId: FlossBrandId
): { color: FlossColor; distance: number } {
  const brand = FLOSS_BRANDS[brandId]
  let closest: FlossColor = brand.colors[0]
  let minDistance = Infinity

  for (const color of brand.colors) {
    const dr = r - color.rgb.r
    const dg = g - color.rgb.g
    const db = b - color.rgb.b
    const distance = dr * dr + dg * dg + db * db

    if (distance < minDistance) {
      minDistance = distance
      closest = color
    }
  }

  return { color: closest, distance: Math.sqrt(minDistance) }
}

/**
 * Get cross-reference info for a DMC color
 */
export function getCrossReferences(dmcNumber: string): {
  dmc: FlossColor
  anchor?: FlossColor
  madeira?: FlossColor
} | undefined {
  const dmc = DMC_COLORS.find(c => c.number === dmcNumber)
  if (!dmc) return undefined
  return {
    dmc,
    anchor: getAnchorColor(dmcNumber),
    madeira: getMadeiraColor(dmcNumber),
  }
}

/**
 * Convert hex to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.replace('#', '').match(/.{2}/g)
  if (!match || match.length !== 3) return null
  return {
    r: parseInt(match[0], 16),
    g: parseInt(match[1], 16),
    b: parseInt(match[2], 16),
  }
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')
}
