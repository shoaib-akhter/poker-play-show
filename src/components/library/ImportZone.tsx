import { useRef, useState, DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload } from 'lucide-react';

interface ImportZoneProps {
  isImporting: boolean;
  processed: number;
  total: number;
  onFiles: (files: FileList | File[]) => void;
}

export function ImportZone({ isImporting, processed, total, onFiles }: ImportZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) onFiles(e.dataTransfer.files);
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`
        rounded-lg border-2 border-dashed p-8 text-center transition-colors
        ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-card'}
        ${isImporting ? 'pointer-events-none' : 'cursor-pointer'}
      `}
    >
      <Upload className="mx-auto mb-3 w-8 h-8 text-muted-foreground" />
      <p className="mb-4 text-sm text-muted-foreground">
        Drop .txt hand history files here, or use the pickers below
      </p>

      <div className="flex gap-3 justify-center">
        <Button
          variant="outline"
          size="sm"
          disabled={isImporting}
          onClick={() => fileInputRef.current?.click()}
        >
          Pick Files
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isImporting}
          onClick={() => folderInputRef.current?.click()}
        >
          Pick Folder
        </Button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt"
        multiple
        className="hidden"
        onChange={e => e.target.files && onFiles(e.target.files)}
      />
      <input
        ref={folderInputRef}
        type="file"
        accept=".txt"
        // @ts-expect-error — webkitdirectory is non-standard but supported in all modern browsers
        webkitdirectory=""
        className="hidden"
        onChange={e => e.target.files && onFiles(e.target.files)}
      />

      {isImporting && (
        <div className="mt-6 space-y-2">
          <Progress value={pct} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {processed.toLocaleString()} / {total.toLocaleString()} hands ({pct}%)
          </p>
        </div>
      )}
    </div>
  );
}
