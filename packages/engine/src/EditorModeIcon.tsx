const paths = {
  construct: "m14 3 7 7-3 3-3-3L5 20l-3-3L12 7l-1-1z",
  furnish:
    "M6 12V7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v5M5 19v2m14-2v2M4 11a2 2 0 0 1 2 2v2h12v-2a2 2 0 0 1 4 0v6H2v-6a2 2 0 0 1 2-2Z",
  connect:
    "m10 14 4-4m-6 6-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 3 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0",
} as const;

export type EditorMode = keyof typeof paths;

export function EditorModeIcon({ name, className }: { name: EditorMode; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
