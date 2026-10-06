export const ROOM_TYPES = [
  { id: "living-room", label: "Living room" },
  { id: "kitchen", label: "Kitchen" },
  { id: "bedroom", label: "Bedroom" },
  { id: "bathroom", label: "Bathroom" },
  { id: "dining-room", label: "Dining room" },
  { id: "office", label: "Office" },
  { id: "entryway", label: "Entryway" },
  { id: "hallway", label: "Hallway" },
  { id: "laundry", label: "Laundry" },
  { id: "outdoor", label: "Outdoor" },
] as const;

export type RoomType = typeof ROOM_TYPES[number]["id"];
export const isRoomType = (value: unknown): value is RoomType =>
  ROOM_TYPES.some((room) => room.id === value);
