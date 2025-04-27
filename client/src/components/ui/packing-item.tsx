import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { PackingItem, PackingCategory } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

interface PackingItemProps {
  item: PackingItem;
  category?: PackingCategory | null;
  onToggle: (id: number, isChecked: boolean) => void;
  onDelete?: (id: number) => void;
  onEdit?: (item: PackingItem) => void;
}

export function PackingItemComponent({
  item,
  category,
  onToggle,
  onDelete,
  onEdit
}: PackingItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Define badge colors based on category
  const getBadgeStyles = () => {
    if (!category) return {};
    
    return {
      backgroundColor: `${category.color}25`,
      color: category.color,
      borderColor: `${category.color}50`
    };
  };

  return (
    <li 
      className="py-3 flex items-center justify-between border-b border-neutral-200 last:border-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center">
        <Checkbox 
          id={`item-${item.id}`} 
          checked={item.isPacked}
          onCheckedChange={(checked) => onToggle(item.id, !!checked)}
        />
        <label 
          htmlFor={`item-${item.id}`} 
          className={`ml-3 block text-sm font-medium ${item.isPacked ? 'text-neutral-500 line-through' : 'text-neutral-800'}`}
        >
          {item.name}
          {item.quantity > 1 && <span className="text-neutral-500"> ({item.quantity}x)</span>}
        </label>
      </div>

      <div className="flex items-center">
        {isHovered && onEdit && onDelete ? (
          <div className="flex space-x-2 mr-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(item)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-700"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
        
        {category && (
          <Badge 
            className="text-xs" 
            style={getBadgeStyles()}
          >
            {category.name}
          </Badge>
        )}
      </div>
    </li>
  );
}
