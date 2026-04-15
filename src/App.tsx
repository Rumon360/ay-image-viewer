import { useRef, useState } from "react";
import type { SelectedImage } from "./types";
import { useFileProcessor } from "./hooks/useFileProcessor";
import { useImageSelection } from "./hooks/useImageSelection";
import { usePagination } from "./hooks/usePagination";
import { FileUpload } from "./components/FileUpload";
import { DataTable } from "./components/DataTable";
import { Pagination } from "./components/Pagination";
import { SkeletonTable } from "./components/SkeletonTable";
import { ImageModal } from "./components/ImageModal";
import { SelectionToolbar } from "./components/SelectionToolbar";
import { CollagePanel } from "./components/CollagePanel";

export default function App() {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const {
    processingState,
    records,
    errors,
    allImageColumns,
    processFiles,
    reset,
  } = useFileProcessor();
  const selection = useImageSelection();

  const [modalState, setModalState] = useState<{
    image: SelectedImage;
    siblings: SelectedImage[];
  } | null>(null);
  const [collagePanelOpen, setCollagePanelOpen] = useState(false);
  const [completeOnly, setCompleteOnly] = useState(false);

  const filteredRecords =
    completeOnly && allImageColumns.length > 0
      ? records.filter((r) => allImageColumns.every((col) => r.images[col]))
      : records;

  const pagination = usePagination(filteredRecords.length);
  const pageRecords = filteredRecords.slice(
    pagination.startIndex,
    pagination.endIndex
  );

  const pageImages: SelectedImage[] = pageRecords.flatMap((record) =>
    allImageColumns
      .filter((col) => record.images[col])
      .map((col) => ({
        student_id: record.student_id,
        column: col,
        url: record.images[col],
      }))
  );

  const allPageSelected =
    pageImages.length > 0 &&
    pageImages.every((img) => selection.isSelected(img));
  const hasData = processingState === "done" || processingState === "error";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-void)" }}
    >
      {/* Header */}
      <header
        className="w-full border-b"
        style={{ borderColor: "rgba(255,255,255,0.08)", background: "#000" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className="w-7 h-7 rounded flex items-center justify-center"
              style={{
                background: "rgba(0,255,255,0.08)",
                border: "1px solid rgba(0,255,255,0.20)",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#00ffff"
                strokeWidth="1.75"
                strokeLinecap="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <span
              className="text-sm font-medium"
              style={{
                fontFamily: "var(--font-mono)",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              ay-image-viewer
            </span>
          </div>

          <div className="flex-1" />

          {/* Compact add-more button — only shown after data is loaded */}
          {hasData && (
            <>
              <button
                onClick={() => uploadInputRef.current?.click()}
                className="flex items-center gap-2 text-xs px-3 py-1.5 rounded border transition-all duration-150"
                style={{
                  fontFamily: "var(--font-mono)",
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.55)",
                  background: "transparent",
                }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Add CSV
              </button>
              <input
                ref={uploadInputRef}
                type="file"
                accept=".csv,text/csv"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length) processFiles(files);
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => {
                  reset();
                  selection.clearAll();
                }}
                className="text-xs px-3 py-1.5 rounded border transition-all duration-150 opacity-40 hover:opacity-70"
                style={{
                  fontFamily: "var(--font-mono)",
                  borderColor: "rgba(255,255,255,0.10)",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                reset
              </button>
            </>
          )}
        </div>

        {/* Per-file errors (shown in header when data is loaded) */}
        {hasData && errors.length > 0 && (
          <div className="max-w-7xl mx-auto px-6 pb-3 flex flex-col gap-1">
            {errors.map((err, i) => (
              <div
                key={i}
                className="flex items-start gap-2 px-3 py-2 rounded text-xs"
                style={{
                  background: "rgba(239,68,68,0.07)",
                  border: "1px solid rgba(239,68,68,0.18)",
                  color: "rgba(252,165,165,0.9)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <span style={{ color: "rgba(239,68,68,0.7)", flexShrink: 0 }}>
                  !
                </span>
                <span>
                  <span>{err.file}</span>: {err.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Main */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
        {/* Idle: full upload zone */}
        {processingState === "idle" && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-lg">
              <FileUpload
                onFiles={processFiles}
                errors={errors}
                isProcessing={false}
                uploadInputRef={uploadInputRef}
              />
            </div>
          </div>
        )}

        {processingState === "processing" && (
          <SkeletonTable rows={8} cols={allImageColumns.length || 3} />
        )}

        {hasData && records.length === 0 && (
          <div
            className="flex flex-col items-center justify-center min-h-[30vh] gap-3 text-sm"
            style={{
              color: "rgba(255,255,255,0.35)",
              fontFamily: "var(--font-mono)",
            }}
          >
            <span>No valid records found.</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
              Check that each CSV has a student_id column.
            </span>
          </div>
        )}

        {processingState === "done" && records.length > 0 && (
          <div className="flex flex-col gap-4">
            {/* Complete-only filter */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCompleteOnly((v) => !v)}
                className="flex items-center gap-2 text-xs px-3 py-1.5 rounded border transition-all duration-150"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: completeOnly
                    ? "rgba(0,255,255,0.08)"
                    : "transparent",
                  borderColor: completeOnly
                    ? "rgba(0,255,255,0.30)"
                    : "rgba(255,255,255,0.10)",
                  color: completeOnly ? "#00ffff" : "rgba(255,255,255,0.45)",
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 16,
                    borderRadius: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    background: completeOnly
                      ? "rgba(0,255,255,0.25)"
                      : "rgba(255,255,255,0.08)",
                    border: `1px solid ${
                      completeOnly
                        ? "rgba(0,255,255,0.4)"
                        : "rgba(255,255,255,0.12)"
                    }`,
                    transition: "all 150ms ease-out",
                    flexShrink: 0,
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: completeOnly
                        ? "#00ffff"
                        : "rgba(255,255,255,0.35)",
                      position: "absolute",
                      left: completeOnly ? 14 : 2,
                      transition: "all 150ms ease-out",
                    }}
                  />
                </span>
                complete rows only
                {completeOnly && (
                  <span style={{ color: "rgba(255,255,255,0.3)" }}>
                    ({filteredRecords.length}/{records.length})
                  </span>
                )}
              </button>
            </div>

            <SelectionToolbar
              count={selection.count}
              totalVisible={pageImages.length}
              allVisibleSelected={allPageSelected}
              selectedImages={selection.selectedImages}
              onSelectAll={() => selection.selectAll(pageImages)}
              onDeselectAll={() => selection.deselectAll(pageImages)}
              onClearAll={selection.clearAll}
              onGenerateCollage={() => setCollagePanelOpen(true)}
            />

            <DataTable
              records={pageRecords}
              imageColumns={allImageColumns}
              onImageClick={(img, siblings) =>
                setModalState({ image: img, siblings })
              }
              onImageSelect={selection.toggleImage}
              isSelected={selection.isSelected}
              onSelectAllPage={(imgs, checked) =>
                checked
                  ? selection.selectAll(imgs)
                  : selection.deselectAll(imgs)
              }
              pageImages={pageImages}
              allPageSelected={allPageSelected}
            />

            <Pagination pagination={pagination} totalItems={records.length} />
          </div>
        )}
      </main>

      {modalState && (
        <ImageModal
          image={modalState.image}
          siblings={modalState.siblings}
          onClose={() => setModalState(null)}
          onNavigate={(img) =>
            setModalState((s) => (s ? { ...s, image: img } : null))
          }
        />
      )}

      {collagePanelOpen && (
        <CollagePanel
          selectedImages={selection.selectedImages}
          onClose={() => setCollagePanelOpen(false)}
        />
      )}
    </div>
  );
}
