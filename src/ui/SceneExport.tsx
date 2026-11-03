import { useEffect, useState, type RefObject } from 'react';
import { toBlob } from 'html-to-image';

/** Capture the full report, including content below the viewport. */
async function scenePng(node: HTMLElement): Promise<Blob> {
  await document.fonts.ready;
  await Promise.all(Array.from(node.querySelectorAll('img'), image => image.decode().catch(() => undefined)));
  const blob = await toBlob(node, {
    backgroundColor: '#111714',
    pixelRatio: 2,
    preferredFontFormat: 'woff2',
  });
  if (!blob) throw new Error('The image could not be created. Please try again.');
  return blob;
}

export function SceneExport({ target, title, onExport }: {
  target: RefObject<HTMLElement | null>; title: string; onExport?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [download, setDownload] = useState<string>();
  useEffect(() => () => { if (download) URL.revokeObjectURL(download); }, [download]);

  const copy = async () => {
    if (!target.current || busy) return;
    onExport?.();
    setBusy(true); setStatus('Creating PNG…'); setDownload(undefined);
    // Start the clipboard write during the click, before rendering awaits fonts
    // and portraits. This preserves user activation in browsers such as Safari.
    const png = scenePng(target.current);
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        throw new Error('Clipboard image copying is unavailable in this browser.');
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
      setStatus('PNG copied! Paste it into Discord or any chat.');
    } catch {
      try {
        setDownload(URL.createObjectURL(await png));
        setStatus('Clipboard access is unavailable. Download the PNG to share it.');
      } catch {
        setStatus('Could not create the PNG. Please try again.');
      }
    } finally { setBusy(false); }
  };

  return <div className="scene-export-controls">
    <button className="subtle" onClick={() => void copy()} disabled={busy}>{busy ? 'Creating PNG…' : 'Copy scene as PNG'}</button>
    {download && <a className="button subtle" href={download} download={`${title.replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 100) || 'scene'}.png`}>Download PNG</a>}
    <span role="status">{status}</span>
  </div>;
}
