// hooks/useDragAndDrop.ts
import { useState, useRef } from 'react';

export interface DragItem {
  type: string;
  id: string;
  data?: any;
}

export interface DropResult {
  dia: string;
  actividadId: string;
  empleadoId: string;
}

export const useDragAndDrop = () => {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragImageRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: React.DragEvent, item: DragItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
    
    // Crear una imagen de drag personalizada
    const dragImage = document.createElement('div');
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.background = 'rgba(59, 130, 246, 0.8)';
    dragImage.style.color = 'white';
    dragImage.style.padding = '4px 8px';
    dragImage.style.borderRadius = '4px';
    dragImage.style.fontSize = '12px';
    dragImage.innerText = 'Asignando...';
    document.body.appendChild(dragImage);
    dragImageRef.current = dragImage;
    
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    setDraggedItem(item);
    setIsDragging(true);

    // Timeout para asegurar que el estado se actualiza
    setTimeout(() => {
      setIsDragging(true);
    }, 0);
  };

  const handleDragEnd = () => {
    if (dragImageRef.current) {
      document.body.removeChild(dragImageRef.current);
      dragImageRef.current = null;
    }
    setDraggedItem(null);
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, onDrop: (result: DropResult) => void) => {
    e.preventDefault();
    
    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      const item: DragItem = JSON.parse(data);
      const dia = e.currentTarget.getAttribute('data-dia');
      const actividadId = e.currentTarget.getAttribute('data-actividad-id');

      if (dia && actividadId && item.id) {
        onDrop({
          dia,
          actividadId,
          empleadoId: item.id
        });
      }
    } catch (error) {
      console.error('Error processing drop:', error);
    } finally {
      handleDragEnd();
    }
  };

  return {
    draggedItem,
    isDragging,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop
  };
};
