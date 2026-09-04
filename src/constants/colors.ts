// Apple-style category color palette
export const CATEGORY_COLORS = [
  { name: 'Red', value: '#FF3B30' },
  { name: 'Orange', value: '#FF9500' },
  { name: 'Yellow', value: '#FFCC00' },
  { name: 'Green', value: '#34C759' },
  { name: 'Mint', value: '#00C7BE' },
  { name: 'Teal', value: '#30B0C7' },
  { name: 'Cyan', value: '#32ADE6' },
  { name: 'Blue', value: '#007AFF' },
  { name: 'Indigo', value: '#5856D6' },
  { name: 'Purple', value: '#AF52DE' },
  { name: 'Pink', value: '#FF2D55' },
  { name: 'Brown', value: '#A2845E' },
  { name: 'Gray', value: '#8E8E93' },
  { name: 'Graphite', value: '#636366' },
  { name: 'Slate', value: '#3A3A3C' },
] as const;

export const DEFAULT_CATEGORY_COLOR = '#007AFF';

// Get color by index (for auto-assigning colors)
export function getColorByIndex(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length].value;
}
