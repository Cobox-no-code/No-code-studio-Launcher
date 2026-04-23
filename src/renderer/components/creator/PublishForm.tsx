import { Button } from "@renderer/components/ui/Button";
import {
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownRoot,
  DropdownTrigger,
} from "@renderer/components/ui/DropdownMenu";
import { useAuthState } from "@renderer/hooks/useAuthState";
import { cn } from "@renderer/lib/cn";
import { fetchCategories } from "@renderer/lib/published-api";
import { ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PublishCategory } from "../../../shared/types/publish";

export interface PublishFormValues {
  title: string;
  description: string;
  categoryId: string;
  thumbnailFile: File | null;
}

interface Props {
  mode: "new" | "edit";
  projectId?: string;
  initial?: Partial<PublishFormValues> & { thumbnailUrl?: string | null };
  submitting?: boolean;
  onSubmit: (values: PublishFormValues) => void | Promise<void>;
  onCancel?: () => void;
}

// Light-colored input styling — matches Figma's near-white pills
const INPUT_BASE = cn(
  "flex items-center gap-3 h-12 px-4 rounded-md",
  "bg-[#D9D9D9] text-[#555]",
  "border border-transparent focus-within:border-brand-700 transition-colors",
);

const INPUT_PLACEHOLDER_TEXT = "placeholder:text-[#868686]";
const INPUT_VALUE_TEXT = "text-[#555]";

export function PublishForm({
  mode,
  projectId,
  initial,
  submitting,
  onSubmit,
  onCancel,
}: Props) {
  const auth = useAuthState();
  const creatorName = auth?.user?.name ?? auth?.user?.email ?? "";

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initial?.thumbnailUrl ?? null,
  );
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [categories, setCategories] = useState<PublishCategory[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetchCategories().then(setCategories);
  }, []);

  const selectedCategory = categories.find((c) => c.category_id === categoryId);
  const pickFile = () => fileRef.current?.click();

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = () => setThumbnailPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const canSubmit =
    !submitting &&
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    categoryId.length > 0 &&
    acceptTerms &&
    (mode === "edit" ? !!thumbnailPreview : !!thumbnailFile);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    void onSubmit({
      title: title.trim(),
      description: description.trim(),
      categoryId,
      thumbnailFile,
    });
  };

  return (
    <form onSubmit={submit} className="h-full flex flex-col relative">
      {/* Header */}
      <div className="flex items-start justify-between px-10 pt-8 pb-4">
        {mode === "edit" && projectId && (
          <div className="px-4 py-2 rounded-md bg-[#2A1050] text-[11px] font-bold tracking-wider text-text-secondary">
            PROJECT ID: {projectId.toUpperCase()}
          </div>
        )}
      </div>

      {/* Big outlined title */}
      <div className="px-10 pb-6">
        <h1
          className="font-display font-black text-[42px] leading-none tracking-tight"
          style={{
            color: "transparent",
            WebkitTextStroke: "1.5px #4A3A66",
          }}
        >
          {mode === "edit" ? "EDIT SAVED" : "PUBLISH GAME"}
        </h1>
      </div>

      {/* Two-column body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-10 px-10 pb-6">
        {/* LEFT — Upload area */}
        <div className="flex flex-col col-span-2">
          <button
            type="button"
            onClick={pickFile}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            data-no-drag
            className={cn(
              "w-full h-56 rounded-lg border-2 border-dashed transition-colors",
              "border-[#D9D9D9]/60 hover:border-brand-700/80 bg-white/[0.02]",
              "flex items-center justify-center overflow-hidden relative group",
            )}
          >
            {thumbnailPreview ? (
              <>
                <img
                  src={thumbnailPreview}
                  alt="thumbnail preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-xs font-bold tracking-wider text-white">
                    REPLACE IMAGE
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-[#868686]">
                <svg
                  width="38"
                  height="38"
                  viewBox="0 0 38 38"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19 0C29.45 0 38 8.55 38 19C38 29.45 29.45 38 19 38C8.55 38 0 29.45 0 19C0 8.55 8.55 0 19 0ZM26.6 28.5V24.7H11.4V28.5H26.6ZM26.6 15.2L19 7.6L11.4 15.2H16.15V22.8H21.85V15.2H26.6Z"
                    fill="#868686"
                  />
                </svg>
                <span className="text-sm">Upload</span>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </button>
          <p className="text-[11px] text-text-muted mt-3 leading-relaxed max-w-md">
            Click to upload you thumbnail image in the format of .jpg, .jpeg,
            .gif, .png and make sure the image upload is in 16:9 ratio
          </p>
        </div>

        {/* RIGHT — Fields */}
        <div className="flex flex-col gap-3 col-span-3">
          {/* Title + Creator — two cols */}
          <div className="grid grid-cols-2 gap-3">
            <div className={INPUT_BASE}>
              <GamepadIcon />
              <input
                type="text"
                placeholder="Title name to publish"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-no-drag
                data-selectable
                maxLength={80}
                className={cn(
                  "flex-1 bg-transparent text-sm outline-none",
                  INPUT_VALUE_TEXT,
                  INPUT_PLACEHOLDER_TEXT,
                )}
              />
            </div>

            <div className={INPUT_BASE}>
              <UserIcon />
              <input
                type="text"
                placeholder="Creator name"
                value={creatorName}
                readOnly
                className={cn(
                  "flex-1 bg-transparent text-sm outline-none cursor-default",
                  INPUT_VALUE_TEXT,
                  INPUT_PLACEHOLDER_TEXT,
                )}
              />
            </div>
          </div>

          {/* Category — full width, same light pill */}
          <DropdownRoot>
            <DropdownTrigger className={cn(INPUT_BASE, "w-full")}>
              <CategoryIcon />
              <span
                className={cn(
                  "flex-1 text-left truncate text-sm",
                  selectedCategory ? INPUT_VALUE_TEXT : "text-[#868686]",
                )}
              >
                {selectedCategory?.name ?? "Category"}
              </span>
              <ChevronDown size={14} className="text-[#868686]" />
            </DropdownTrigger>
            <DropdownContent
              className="max-h-[260px] overflow-auto w-full bg-[#D9D9D9] rounded-md p-1 border border-[#D9D9D9]/60"
              sideOffset={8}
            >
              <DropdownLabel>Category</DropdownLabel>
              {categories.length === 0 ? (
                <div className="px-3 py-2 text-xs text-text-muted">
                  Loading categories…
                </div>
              ) : (
                categories.map((c) => (
                  <DropdownItem
                    className=" text-black"
                    key={c.category_id}
                    active={c.category_id === categoryId}
                    onSelect={() => setCategoryId(c.category_id)}
                  >
                    {c.name}
                  </DropdownItem>
                ))
              )}
            </DropdownContent>
          </DropdownRoot>

          {/* Description — tall white panel */}
          <div
            className={cn(
              "flex gap-3 rounded-md bg-[#D9D9D9]",
              "border border-transparent focus-within:border-brand-700 transition-colors",
              "px-4 py-3",
            )}
          >
            <div className="mt-0.5 shrink-0">
              <DescriptionIcon />
            </div>
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={7}
              maxLength={500}
              data-no-drag
              data-selectable
              className={cn(
                "flex-1 bg-transparent text-sm outline-none resize-none min-h-[160px]",
                INPUT_VALUE_TEXT,
                INPUT_PLACEHOLDER_TEXT,
              )}
            />
          </div>

          {/* Terms */}
          <label className="flex items-center gap-2 text-[11px] text-text-secondary mt-1 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="size-3 accent-brand-700"
            />
            I accept the TERMS &amp; CONDITIONS
          </label>

          {/* Submit — centered inside right column, ~half column width */}
          <div className="mt-6 flex ">
            <Button
              type="submit"
              variant="cta"
              disabled={!canSubmit}
              size="md"
              className="rounded!"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving…
                </>
              ) : mode === "edit" ? (
                "Save changes"
              ) : (
                "Publish"
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small icon components — scoped to this form
// ─────────────────────────────────────────────────────────────────────────────
function GamepadIcon() {
  return (
    <svg
      width="24"
      height="12"
      viewBox="0 0 32 16"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M29.0909 0H2.90909C2.13755 0 1.39761 0.280951 0.852053 0.781048C0.306493 1.28115 0 1.95942 0 2.66667V13.3333C0 14.0406 0.306493 14.7189 0.852053 15.219C1.39761 15.719 2.13755 16 2.90909 16H29.0909C29.8624 16 30.6024 15.719 31.1479 15.219C31.6935 14.7189 32 14.0406 32 13.3333V2.66667C32 1.95942 31.6935 1.28115 31.1479 0.781048C30.6024 0.280951 29.8624 0 29.0909 0ZM29.0909 13.3333H2.90909V2.66667H29.0909M7.27273 12H10.1818V9.33333H13.0909V6.66667H10.1818V4H7.27273V6.66667H4.36364V9.33333H7.27273M19.6364 8C20.215 8 20.77 8.21071 21.1791 8.58579C21.5883 8.96086 21.8182 9.46957 21.8182 10C21.8182 10.5304 21.5883 11.0391 21.1791 11.4142C20.77 11.7893 20.215 12 19.6364 12C19.0577 12 18.5028 11.7893 18.0936 11.4142C17.6844 11.0391 17.4545 10.5304 17.4545 10C17.4545 9.46957 17.6844 8.96086 18.0936 8.58579C18.5028 8.21071 19.0577 8 19.6364 8ZM25.4545 4C26.0332 4 26.5882 4.21071 26.9973 4.58579C27.4065 4.96086 27.6364 5.46957 27.6364 6C27.6364 6.53043 27.4065 7.03914 26.9973 7.41421C26.5882 7.78929 26.0332 8 25.4545 8C24.8759 8 24.3209 7.78929 23.9118 7.41421C23.5026 7.03914 23.2727 6.53043 23.2727 6C23.2727 5.46957 23.5026 4.96086 23.9118 4.58579C24.3209 4.21071 24.8759 4 25.4545 4Z"
        fill="#868686"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M12.2 8.8C12.2 9.352 11.752 9.8 11.2 9.8C10.648 9.8 10.2 9.352 10.2 8.8C10.2 8.248 10.648 7.8 11.2 7.8C11.752 7.8 12.2 8.248 12.2 8.8ZM16 8C16 12.4 12.4 16 8 16H0V8C0 3.6 3.6 0 8 0C12.4 0 16 3.6 16 8ZM4 12.8C5.128 13.784 6.4 14.4 8 14.4C11.528 14.4 14.4 11.528 14.4 8C14.4 7.368 14.304 6.76 14.136 6.192C13.56 6.328 12.96 6.4 12.336 6.4C10.736 6.4 9.256 5.92 8 5.112C8 5.112 6.832 9.408 4.824 8.8C4.296 8.64 4 9.048 4 9.6"
        fill="#868686"
      />
    </svg>
  );
}

function CategoryIcon() {
  // Small folder/grid glyph — matches the Figma's left-icon slot for category
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M1.33 2.67h4L6.67 4H14.67c.74 0 1.33.6 1.33 1.33v8c0 .74-.6 1.34-1.33 1.34H1.33C.6 14.67 0 14.07 0 13.33V4c0-.74.6-1.33 1.33-1.33Z"
        fill="#868686"
      />
    </svg>
  );
}

function DescriptionIcon() {
  return (
    <svg
      width="28"
      height="14"
      viewBox="0 0 34 16"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M34 9.6H20.4V6.4H34V9.6ZM34 0H20.4V3.2H34V0ZM20.4 16H34V12.8H20.4V16ZM17 3.2V12.8C17 14.56 15.47 16 13.6 16H3.4C1.53 16 0 14.56 0 12.8V3.2C0 1.44 1.53 0 3.4 0H13.6C15.47 0 17 1.44 17 3.2ZM14.45 12.8L10.71 8L7.65 11.68L5.61 9.28L2.55 12.8H14.45Z"
        fill="#868686"
      />
    </svg>
  );
}
