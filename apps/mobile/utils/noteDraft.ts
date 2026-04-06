// Shared mutable draft — survives note-editor ↔ note-category navigation within one session
export const noteDraft = {
  title: '',
  content: '',
  color: '',
  category: 'General',
  images: [] as string[],
  blocks: null as unknown[] | null,
};

export function clearNoteDraft() {
  Object.assign(noteDraft, { title: '', content: '', color: '', category: 'General', images: [], blocks: null });
}
