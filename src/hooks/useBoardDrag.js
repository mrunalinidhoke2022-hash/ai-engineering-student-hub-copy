import { useCallback, useEffect, useRef, useState } from "react";

const MOVE_THRESHOLD = 5;
const INTERACTIVE = "button, a, input, select, textarea";

// Pointer-based board dragging: the gesture activates on the first small pointer movement and
// the card drops onto the column under the pointer, so no drag-library event timing is involved.
export default function useBoardDrag(onDrop) {
  const [dragId, setDragId] = useState(null);
  const [overStatus, setOverStatus] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const session = useRef(null);

  const reset = useCallback(() => {
    session.current = null;
    setDragId(null);
    setOverStatus(null);
    setOffset({ x: 0, y: 0 });
    document.body.style.userSelect = "";
  }, []);

  const startDrag = useCallback((task, event) => {
    if (event.button) return;
    // Buttons and inputs inside the card keep their normal click behaviour.
    if (event.target?.closest?.(INTERACTIVE)) return;
    session.current = {
      id: task.id,
      status: task.status,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      overStatus: task.status,
    };
  }, []);

  const move = useCallback((event) => {
    const current = session.current;
    if (!current) return;

    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;

    if (!current.active) {
      if (Math.abs(dx) < MOVE_THRESHOLD && Math.abs(dy) < MOVE_THRESHOLD) return;
      current.active = true;
      document.body.style.userSelect = "none";
      setDragId(current.id);
    }

    event.preventDefault();

    // The dragged card ignores pointer events, so this finds the column underneath it.
    const column = document.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-drop-status]");
    current.overStatus = column?.getAttribute("data-drop-status") || null;
    setOverStatus(current.overStatus);
    setOffset({ x: dx, y: dy });
  }, []);

  const finish = useCallback(() => {
    const current = session.current;
    reset();
    if (current?.active && current.overStatus && current.overStatus !== current.status) {
      onDrop(current.id, current.overStatus);
    }
  }, [onDrop, reset]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") reset();
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", finish);
    window.addEventListener("pointercancel", reset);
    window.addEventListener("blur", reset);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", finish);
      window.removeEventListener("pointercancel", reset);
      window.removeEventListener("blur", reset);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.userSelect = "";
    };
  }, [move, finish, reset]);

  return { dragId, overStatus, offset, startDrag };
}