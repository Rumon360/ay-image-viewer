// src/components/DataTable.tsx
import { useState } from "react";
import JSZip from "jszip";
import type { StudentRecord, SelectedImage } from "../types";

interface ThumbnailProps {
  img: SelectedImage;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
}

function Thumbnail({ img, isSelected, onSelect, onClick }: ThumbnailProps) {
  return (
    <div className="relative w-[150px] h-[150px] shrink-0 group">
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        aria-label={`${isSelected ? "Deselect" : "Select"} image`}
        className="absolute top-0.5 left-0.5 z-10 w-5 h-5 flex items-center justify-center rounded-sm border transition-all duration-120"
        style={{
          background: isSelected ? "#00ffff" : "rgba(0,0,0,0.75)",
          borderColor: isSelected ? "#00ffff" : "rgba(255,255,255,0.25)",
        }}
      >
        {isSelected && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <polyline
              points="1.5,5 3.8,7.5 8.5,2.5"
              stroke="#000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Image button */}
      <button
        onClick={onClick}
        aria-label={`View ${img.column} for ${img.student_id}`}
        className="w-[150px] h-[150px] rounded-sm overflow-hidden border transition-all duration-150 block"
        style={{
          borderColor: isSelected
            ? "rgba(0,255,255,0.45)"
            : "rgba(255,255,255,0.08)",
          boxShadow: isSelected ? "0 0 0 1px rgba(0,255,255,0.2)" : "none",
        }}
      >
        <img
          src={img.url}
          alt={`${img.student_id} ${img.column}`}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
          style={{ display: "block" }}
          onError={(e) => {
            const wrapper = e.currentTarget.parentElement;
            if (!wrapper) return;
            e.currentTarget.style.display = "none";
            const placeholder = wrapper.querySelector(
              "[data-placeholder]"
            ) as HTMLElement;
            if (placeholder) placeholder.style.display = "flex";
          }}
        />
        <div
          data-placeholder
          className="w-full h-full items-center justify-center"
          style={{ display: "none", background: "rgba(255,255,255,0.03)" }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.5"
          >
            <line x1="3" y1="3" x2="21" y2="21" />
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        </div>
      </button>
    </div>
  );
}

function extFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split(".").pop()?.split("?")[0]?.toLowerCase();
    if (ext && /^(jpg|jpeg|png|gif|webp|avif|svg)$/.test(ext)) return `.${ext}`;
  } catch { /* ignore */ }
  return ".jpg";
}

function DownloadButton({ record, imageColumns }: { record: StudentRecord; imageColumns: string[] }) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function handleDownload() {
    const images = imageColumns
      .filter((col) => record.images[col])
      .map((col) => ({ col, url: record.images[col] }));
    if (images.length === 0) return;

    setState("loading");
    try {
      const zip = new JSZip();
      const folder = zip.folder(record.student_id)!;

      await Promise.allSettled(
        images.map(async ({ col, url }) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          const ext = extFromUrl(url);
          folder.file(`${col}${ext}`, blob);
        })
      );

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(zipBlob);
      a.download = `${record.student_id}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      setState("idle");
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={state === "loading"}
      aria-label={`Download all images for ${record.student_id}`}
      title={`Download ${record.student_id}.zip`}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border transition-all duration-150 disabled:opacity-40"
      style={{
        fontFamily: "var(--font-mono)",
        background: state === "error" ? "rgba(239,68,68,0.07)" : "transparent",
        borderColor: state === "error"
          ? "rgba(239,68,68,0.30)"
          : "rgba(255,255,255,0.10)",
        color: state === "error"
          ? "rgba(252,165,165,0.9)"
          : "rgba(255,255,255,0.45)",
        whiteSpace: "nowrap",
      }}
    >
      {state === "loading" ? (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
          loading
        </>
      ) : state === "error" ? (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          failed
        </>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          .zip
        </>
      )}
    </button>
  );
}

interface DataTableProps {
  records: StudentRecord[];
  imageColumns: string[];
  onImageClick: (img: SelectedImage, rowImages: SelectedImage[]) => void;
  onImageSelect: (img: SelectedImage) => void;
  isSelected: (img: SelectedImage) => boolean;
  onSelectAllPage: (images: SelectedImage[], checked: boolean) => void;
  pageImages: SelectedImage[];
  allPageSelected: boolean;
}

export function DataTable({
  records,
  imageColumns,
  onImageClick,
  onImageSelect,
  isSelected,
  onSelectAllPage,
  pageImages,
  allPageSelected,
}: DataTableProps) {
  const thStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.35)",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    textAlign: "left",
    padding: "10px 16px",
    whiteSpace: "nowrap",
  };

  return (
    <div
      className="w-full overflow-x-auto rounded border"
      style={{ borderColor: "rgba(255,255,255,0.10)" }}
    >
      <table
        className="w-full border-collapse text-sm"
        style={{ minWidth: 480 }}
      >
        <thead>
          <tr
            style={{
              background: "#000",
              borderBottom: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <th style={{ ...thStyle, width: 44, padding: "10px 16px" }}>
              <input
                type="checkbox"
                checked={allPageSelected && pageImages.length > 0}
                onChange={(e) => onSelectAllPage(pageImages, e.target.checked)}
                aria-label="Select all images on this page"
                style={{
                  width: 16,
                  height: 16,
                  cursor: "pointer",
                  accentColor: "#00ffff",
                }}
              />
            </th>
            <th style={thStyle}>student_id</th>
            {imageColumns.map((col) => (
              <th key={col} style={thStyle}>
                {col}
              </th>
            ))}
            <th style={{ ...thStyle, textAlign: "right" }}>download</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, rowIdx) => {
            const rowImages: SelectedImage[] = imageColumns
              .filter((col) => record.images[col])
              .map((col) => ({
                student_id: record.student_id,
                column: col,
                url: record.images[col],
              }));

            return (
              <tr
                key={record.student_id}
                style={{
                  background:
                    rowIdx % 2 === 0 ? "#000" : "rgba(255,255,255,0.01)",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <td style={{ padding: "10px 16px", width: 44 }} />
                <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                  <span
                    className="text-xs"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "rgba(255,255,255,0.85)",
                    }}
                  >
                    {record.student_id}
                  </span>
                </td>
                {imageColumns.map((col) => {
                  const url = record.images[col];
                  if (!url) {
                    return (
                      <td key={col} style={{ padding: "10px 16px" }}>
                        <div className="w-[150px] h-[150px]" />
                      </td>
                    );
                  }
                  const img: SelectedImage = {
                    student_id: record.student_id,
                    column: col,
                    url,
                  };
                  return (
                    <td key={col} style={{ padding: "10px 16px" }}>
                      <Thumbnail
                        img={img}
                        isSelected={isSelected(img)}
                        onSelect={() => onImageSelect(img)}
                        onClick={() => onImageClick(img, rowImages)}
                      />
                    </td>
                  );
                })}
                <td style={{ padding: "10px 16px", textAlign: "right" }}>
                  <DownloadButton record={record} imageColumns={imageColumns} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
