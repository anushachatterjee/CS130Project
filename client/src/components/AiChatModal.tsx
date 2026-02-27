import type { MouseEvent as ReactMouseEvent } from 'react';
import { useEffect, useState } from 'react';
import AiChat from './AiChat';
import './AiChatModal.css';

type Props = {
  open: boolean;
  onClose: () => void;
};

type ResizeDirection = 'right' | 'bottom' | 'left' | 'top';

export default function AiChatModal({ open, onClose }: Props) {
  const [size, setSize] = useState({ width: 680, height: 680 });
  const [top, setTop] = useState(72);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const startResize = (event: ReactMouseEvent<HTMLDivElement>, direction: ResizeDirection) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = size.width;
    const startHeight = size.height;
    const startTop = top;

    const minWidth = 360;
    const minHeight = 260;

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newTop = startTop;

      if (direction === 'right') {
        newWidth = Math.max(minWidth, startWidth + dx);
      }

      if (direction === 'left') {
        newWidth = Math.max(minWidth, startWidth - dx);
      }

      if (direction === 'bottom') {
        newHeight = Math.max(minHeight, startHeight + dy);
      }

      if (direction === 'top') {
        newHeight = Math.max(minHeight, startHeight - dy);
        newTop = startTop + dy;
      }

      setSize({ width: newWidth, height: newHeight });
      setTop(newTop);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (!open) return null;

  return (
    <div
      className="ai-chat-overlay"
      role="presentation"
    >
      <div
        className="ai-chat-modal-content"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="AI Chat"
        style={{ width: size.width, height: size.height, top, right: 32 }}
      >
        {/* Resize handles on all four sides */}
        <div
          className="ai-chat-resize-handle ai-chat-resize-right"
          onMouseDown={(e) => startResize(e, 'right')}
        />
        <div
          className="ai-chat-resize-handle ai-chat-resize-left"
          onMouseDown={(e) => startResize(e, 'left')}
        />
        <div
          className="ai-chat-resize-handle ai-chat-resize-bottom"
          onMouseDown={(e) => startResize(e, 'bottom')}
        />
        <div
          className="ai-chat-resize-handle ai-chat-resize-top"
          onMouseDown={(e) => startResize(e, 'top')}
        />

        <div className="ai-chat-modal-header">
          <div className="ai-chat-modal-title">FinTrack AI</div>
          <button type="button" className="ai-chat-close" onClick={onClose} aria-label="Close chat">
            ×
          </button>
        </div>

        <AiChat />
      </div>
    </div>
  );
}

