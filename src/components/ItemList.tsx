"use client";

import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { QuotationItem } from "@/types/quotation";
import { ItemRow, isItemNeedingAttention } from "@/components/ItemRow";
import { formatMoney, rupeesToPaise } from "@/lib/money/formatMoney";
import { matchIconKey } from "@/lib/pdf/icons";

interface ItemListProps {
  items: QuotationItem[];
  onChange: (items: QuotationItem[]) => void;
}

export function ItemList({ items, onChange }: ItemListProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editQty, setEditQty] = useState<string>("1");
  const [editPrice, setEditPrice] = useState<string>("");
  const [editNote, setEditNote] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  const parentRef = useRef<HTMLDivElement | null>(null);

  const filteredWithIndex = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items
      .map((item, index) => ({ item, serialNumber: index + 1, index }))
      .filter(({ item }) =>
        q
          ? item.name.toLowerCase().includes(q) ||
            (item.note?.toLowerCase().includes(q) ?? false)
          : true
      );
  }, [items, searchQuery]);

  const rowVirtualizer = useVirtualizer({
    count: filteredWithIndex.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => (filteredWithIndex[i]?.item.note ? 74 : 62),
    overscan: 8,
  });

  const attentionCount = useMemo(
    () => items.filter(isItemNeedingAttention).length,
    [items]
  );

  const openEditor = (item: QuotationItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditQty(String(item.quantity));
    setEditPrice(
      item.unitPricePaise !== null && item.unitPricePaise > 0
        ? formatMoney(item.unitPricePaise).replace(/\.00$/, "")
        : ""
    );
    setEditNote(item.note ?? "");
    setConfirmDelete(false);
  };

  const handleAddBlankItem = () => {
    const newId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `item-${Date.now()}`;
    const newItem: QuotationItem = {
      id: newId,
      name: "New Sports Item",
      quantity: 1,
      unitPricePaise: null,
      iconKey: "generic",
      needsReview: true,
    };
    onChange([...items, newItem]);
    openEditor(newItem);
  };

  const editingIndex = items.findIndex((i) => i.id === editingId);
  const editingItem = editingIndex >= 0 ? items[editingIndex] : null;

  const handleSaveEdit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingItem) return;

    const cleanName = editName.trim() || "Sports Item";
    const parsedQty = Math.max(1, Number.parseInt(editQty, 10) || 1);
    const parsedPaise = rupeesToPaise(editPrice);

    const updated: QuotationItem = {
      ...editingItem,
      name: cleanName,
      quantity: parsedQty,
      unitPricePaise: parsedPaise,
      note: editNote.trim() ? editNote.trim() : undefined,
      iconKey: matchIconKey(cleanName),
      needsReview: parsedPaise === null || parsedPaise <= 0,
    };

    onChange(items.map((it) => (it.id === editingItem.id ? updated : it)));
    setEditingId(null);
  };

  const handleMove = (direction: -1 | 1) => {
    if (editingIndex < 0) return;
    const targetIndex = editingIndex + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const copy = [...items];
    const current = copy[editingIndex];
    const target = copy[targetIndex];
    if (!current || !target) return;
    copy[editingIndex] = target;
    copy[targetIndex] = current;
    onChange(copy);
  };

  const handleDelete = () => {
    if (!editingItem) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onChange(items.filter((it) => it.id !== editingItem.id));
    setEditingId(null);
  };

  return (
    <section className="space-y-3">
      {/* Sticky header with search & Add Item button */}
      <div className="sticky top-0 z-10 space-y-2 bg-sultan-white py-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold italic uppercase text-sultan-ink">
              Items ({items.length})
            </h2>
            {attentionCount > 0 ? (
              <p className="text-xs font-bold text-sultan-orange">
                {attentionCount} {attentionCount === 1 ? "row needs" : "rows need"} your check
              </p>
            ) : (
              <p className="text-xs text-sultan-grey">Tap any row to edit, move, or add a note</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddBlankItem}
            className="min-h-[44px] rounded-xl border border-sultan-black bg-sultan-white px-3 text-xs font-bold uppercase text-sultan-black active:bg-sultan-lightGrey"
          >
            + Add Item
          </button>
        </div>

        {items.length > 0 ? (
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name..."
            className="min-h-[44px] w-full rounded-xl border border-sultan-lineGrey bg-sultan-lightGrey px-3 py-2 text-base text-sultan-ink"
          />
        ) : null}
      </div>

      {/* Virtualized scrollable table */}
      {items.length === 0 ? (
        <div className="rounded-xl bg-sultan-lightGrey p-6 text-center text-sm text-sultan-grey">
          No items yet. Paste a list above or tap <strong>+ Add Item</strong>.
        </div>
      ) : filteredWithIndex.length === 0 ? (
        <div className="rounded-xl bg-sultan-lightGrey p-6 text-center text-sm text-sultan-grey">
          No items match &ldquo;{searchQuery}&rdquo;.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-sultan-lineGrey">
          <div className="flex items-center justify-between bg-sultan-black px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-sultan-white">
            <span># / Item</span>
            <span>Qty / Rate / Amount (Rs.)</span>
          </div>

          <div
            ref={parentRef}
            className="max-h-[440px] overflow-y-auto bg-sultan-white"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const entry = filteredWithIndex[virtualRow.index];
                if (!entry) return null;
                return (
                  <div
                    key={entry.item.id}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <ItemRow
                      item={entry.item}
                      serialNumber={entry.serialNumber}
                      isEven={entry.index % 2 === 1}
                      onSelect={openEditor}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sheet Editor Modal */}
      {editingItem ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-sultan-black/60 p-0 sm:items-center sm:p-4">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-md space-y-4 rounded-t-2xl bg-sultan-white p-4 shadow-xl sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-sultan-lineGrey pb-2">
              <h3 className="text-lg font-bold italic text-sultan-ink">
                Edit Item #{editingIndex + 1}
              </h3>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="min-h-[44px] px-3 text-sm font-bold text-sultan-grey"
              >
                Close
              </button>
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase text-sultan-grey">Item Name</span>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-sultan-lineGrey px-3 py-2 text-base font-bold text-sultan-ink"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-bold uppercase text-sultan-grey">Quantity</span>
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-sultan-lineGrey px-3 py-2 text-base font-bold tabular-nums text-sultan-ink"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-bold uppercase text-sultan-grey">Unit Price (Rs.)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="e.g. 750"
                  className="min-h-[44px] w-full rounded-xl border border-sultan-lineGrey px-3 py-2 text-base font-bold tabular-nums text-sultan-ink"
                />
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase text-sultan-grey">Optional Note Line</span>
              <input
                type="text"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="e.g. Comes with coins, striker & powder"
                className="min-h-[44px] w-full rounded-xl border border-sultan-lineGrey px-3 py-2 text-base text-sultan-ink"
              />
            </label>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={editingIndex <= 0}
                  onClick={() => handleMove(-1)}
                  className="min-h-[44px] rounded-xl border border-sultan-black px-3 text-xs font-bold text-sultan-black disabled:opacity-40"
                >
                  Move Up
                </button>
                <button
                  type="button"
                  disabled={editingIndex >= items.length - 1}
                  onClick={() => handleMove(1)}
                  className="min-h-[44px] rounded-xl border border-sultan-black px-3 text-xs font-bold text-sultan-black disabled:opacity-40"
                >
                  Move Down
                </button>
              </div>

              <button
                type="button"
                onClick={handleDelete}
                className="min-h-[44px] rounded-xl border border-sultan-errorRed px-3 text-xs font-bold text-sultan-errorRed"
              >
                {confirmDelete ? "Tap Again to Delete" : "Delete"}
              </button>
            </div>

            <button
              type="submit"
              className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-sultan-orange px-4 py-3 text-base font-bold text-sultan-black"
            >
              Done Editing
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
