// src/components/DataTable.tsx
import type { StudentRecord, SelectedImage } from "../types";

interface ThumbnailProps {
  img: SelectedImage;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
}

function Thumbnail({ img, isSelected, onSelect, onClick }: ThumbnailProps) {
  return (
    <div className="relative w-24 h-24 shrink-0 group">
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
        className="w-24 h-24 rounded-sm overflow-hidden border transition-all duration-150 block"
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
                <td style={{ padding: "10px 16px", width: 44 }}>
                  {/* no row-level checkbox; per-image only */}
                </td>
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
                        <div className="w-24 h-24" />
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
