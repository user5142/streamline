"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  FormEvent,
  DragEvent,
} from "react";
import { createClient } from "@/libs/supabase/client";
import { getErrorMessage } from "@/libs/getErrorMessage";
import toast from "react-hot-toast";
import type { TodoItem } from "@/types/database";

export default function TodoClient({ orgId }: { orgId: string | null }) {
  const supabase = createClient();

  const [items, setItems] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [content, setContent] = useState<string>("");

  // Index of the row currently being dragged; null when not dragging.
  const dragIndex = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  // Insertion point for the drop indicator: a value in [0, items.length] marking
  // the gap the dragged row will land in (0 = above the first item, length = below
  // the last). null hides the indicator (e.g. a no-op drop back in place).
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("todo_items")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("load todos failed:", getErrorMessage(error), error);
      toast.error("Could not load your to-do list.");
    } else {
      setItems((data as TodoItem[]) ?? []);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    setIsSaving(true);
    try {
      // Append to the bottom so items stay chronological by default.
      const position = items.length
        ? Math.max(...items.map((i) => i.position)) + 1
        : 0;
      const { data, error } = await supabase
        .from("todo_items")
        .insert({ content: text, org_id: orgId, position })
        .select()
        .single();
      if (error) throw error;

      setItems((prev) => [...prev, data as TodoItem]);
      setContent("");
    } catch (error) {
      console.error("add todo failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (item: TodoItem) => {
    const next = !item.is_complete;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_complete: next } : i))
    );
    const { error } = await supabase
      .from("todo_items")
      .update({ is_complete: next })
      .eq("id", item.id);
    if (error) {
      console.error("toggle todo failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
      // Roll back optimistic update.
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_complete: item.is_complete } : i
        )
      );
    }
  };

  const handleDelete = async (item: TodoItem) => {
    const previous = items;
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    const { error } = await supabase
      .from("todo_items")
      .delete()
      .eq("id", item.id);
    if (error) {
      console.error("delete todo failed:", getErrorMessage(error), error);
      toast.error(getErrorMessage(error));
      setItems(previous);
    }
  };

  // Persist the new order by writing back each item's index as its position.
  const persistOrder = async (ordered: TodoItem[]) => {
    const changed = ordered
      .map((item, index) => ({ item, index }))
      .filter(({ item, index }) => item.position !== index);
    if (changed.length === 0) return;

    const results = await Promise.all(
      changed.map(({ item, index }) =>
        supabase.from("todo_items").update({ position: index }).eq("id", item.id)
      )
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      console.error(
        "reorder todos failed:",
        getErrorMessage(failed.error),
        failed.error
      );
      toast.error("Could not save the new order.");
      load();
    }
  };

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
    setDraggingIndex(index);
  };

  // Decide which gap the indicator should sit in based on whether the cursor is
  // over the top or bottom half of the row being hovered.
  const handleDragOver = (e: DragEvent, index: number) => {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const isAfter = e.clientY > rect.top + rect.height / 2;
    const target = isAfter ? index + 1 : index;

    // Hide the line when the drop wouldn't move the item (the gaps directly
    // above and below its current position).
    setDropIndex(target === from || target === from + 1 ? null : target);
  };

  const handleDrop = () => {
    const from = dragIndex.current;
    const to = dropIndex;
    handleDragEnd();
    if (from === null || to === null) return;

    const reordered = [...items];
    const [moved] = reordered.splice(from, 1);
    // After removing the dragged item, indices above it shift down by one.
    const insertAt = to > from ? to - 1 : to;
    reordered.splice(insertAt, 0, moved);

    setItems(reordered.map((item, i) => ({ ...item, position: i })));
    persistOrder(reordered);
  };

  const handleDragEnd = () => {
    dragIndex.current = null;
    setDraggingIndex(null);
    setDropIndex(null);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={content}
          placeholder="Add a to-do…"
          className="input input-bordered flex-1"
          onChange={(e) => setContent(e.target.value)}
          aria-label="New to-do item"
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSaving || !content.trim()}
        >
          {isSaving && (
            <span className="loading loading-spinner loading-xs"></span>
          )}
          Add
        </button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner"></span>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold text-base-content">
            Nothing to do yet
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-base-content/60">
            Add your first item above to start your personal to-do list.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              className={`relative flex items-center gap-3 rounded-lg border border-base-300 bg-base-100 px-3 py-2.5 ${
                draggingIndex === index ? "opacity-40" : ""
              }`}
            >
              {/* Drop indicator: a brand-colored line in the gap above/below the
                  row showing exactly where the dragged item will land. */}
              {dropIndex === index && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 -top-[5px] z-10 flex items-center"
                >
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="h-0.5 flex-1 rounded-full bg-primary" />
                </span>
              )}
              {dropIndex === items.length && index === items.length - 1 && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 -bottom-[5px] z-10 flex items-center"
                >
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="h-0.5 flex-1 rounded-full bg-primary" />
                </span>
              )}
              <span
                className="cursor-grab text-base-content/30 active:cursor-grabbing"
                aria-hidden="true"
                title="Drag to re-order"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M7 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-1 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9-13a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-1 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm1 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
                </svg>
              </span>
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary"
                checked={item.is_complete}
                onChange={() => handleToggle(item)}
                aria-label={`Mark "${item.content}" complete`}
              />
              <span
                className={`flex-1 text-sm ${
                  item.is_complete
                    ? "text-base-content/40 line-through"
                    : "text-base-content"
                }`}
              >
                {item.content}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-error"
                onClick={() => handleDelete(item)}
                aria-label={`Delete "${item.content}"`}
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
