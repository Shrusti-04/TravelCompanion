import { useState } from "react";
import { Schedule } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit, MapPin, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface ScheduleItemProps {
  schedule: Schedule;
  onEdit?: (schedule: Schedule) => void;
  onDelete?: (id: number) => void;
}

export function ScheduleItem({ schedule, onEdit, onDelete }: ScheduleItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const formatTime = (time: string | null) => {
    if (!time) return null;
    
    // If time is in 24hr format (HH:MM), convert to display format
    const timeParts = time.split(':');
    if (timeParts.length === 2) {
      const hour = parseInt(timeParts[0], 10);
      const minute = timeParts[1];
      
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      
      return { time: `${hour12}:${minute}`, period };
    }
    
    return { time, period: '' };
  };
  
  const formattedTime = formatTime(schedule.time);

  return (
    <Card 
      className="flex items-start p-3 border border-neutral-200 hover:bg-neutral-50 transition-colors mb-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {formattedTime && (
        <div className="flex-shrink-0 w-16 text-center mr-4">
          <div className="text-sm font-medium text-neutral-500">{formattedTime.time}</div>
          <div className="text-xs text-neutral-400">{formattedTime.period}</div>
        </div>
      )}
      
      <div className="flex-1">
        <h5 className="text-sm font-medium text-neutral-800">{schedule.title}</h5>
        {schedule.description && (
          <p className="text-sm text-neutral-500 mt-1">{schedule.description}</p>
        )}
        
        {schedule.location && (
          <div className="mt-2 flex items-center text-xs text-neutral-500">
            <MapPin className="h-4 w-4 mr-1" />
            {schedule.location}
          </div>
        )}
      </div>
      
      {isHovered && onEdit && onDelete && (
        <div className="ml-4 flex-shrink-0 flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={() => onEdit(schedule)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-red-500 hover:text-red-700" 
            onClick={() => onDelete(schedule.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </Card>
  );
}
