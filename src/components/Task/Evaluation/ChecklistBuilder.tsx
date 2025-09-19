import { useState } from 'react';
import { ChecklistData, ChecklistItem } from '../../../types/evaluation';
import { TrashIcon } from '@heroicons/react/24/outline';

type ChecklistBuilderProps = {
  initialData?: ChecklistData;
  onChange: (data: ChecklistData) => void;
};

export default function ChecklistBuilder({ initialData, onChange }: ChecklistBuilderProps) {
  const [checklist, setChecklist] = useState<ChecklistData>(() => {
    if (initialData) {
      return {
        title: initialData.title || '',
        items: initialData.items?.map(item => ({
          description: item.description || '',
          required: item.required !== undefined ? item.required : true,
          checked: item.checked !== undefined ? item.checked : false
        })) || []
      };
    }
    return {
      title: '',
      items: []
    };
  });

  const updateChecklist = (updates: Partial<ChecklistData>) => {
    const updated = { ...checklist, ...updates };
    setChecklist(updated);
    onChange(updated);
  };

  const handleAddItem = () => {
    const newItem: ChecklistItem = {
      description: '',
      required: true,
      checked: false
    };
    updateChecklist({
      items: [...checklist.items, newItem]
    });
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Título de la lista"
        value={checklist.title}
        onChange={(e) => updateChecklist({ title: e.target.value })}
        className="w-full p-2 border rounded"
      />

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={handleAddItem}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          + Añadir Ítem
        </button>
      </div>
      
      {checklist.items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3 p-2 border rounded">
          <input
            type="checkbox"
            checked={item.required}
            onChange={(e) => {
              const updatedItems = [...checklist.items];
              updatedItems[idx].required = e.target.checked;
              updateChecklist({ items: updatedItems });
            }}
            className="h-5 w-5"
          />
          <input
            type="text"
            placeholder="Descripción del ítem"
            value={item.description}
            onChange={(e) => {
              const updatedItems = [...checklist.items];
              updatedItems[idx].description = e.target.value;
              updateChecklist({ items: updatedItems });
            }}
            className="flex-1 p-2 border rounded"
          />
          <button
            type="button"
            onClick={() => {
              const updatedItems = [...checklist.items];
              updatedItems.splice(idx, 1);
              updateChecklist({ items: updatedItems });
            }}
            className="text-red-500 hover:text-red-700 p-2"
            title="Eliminar ítem"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}