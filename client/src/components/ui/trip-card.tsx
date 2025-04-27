import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Globe, Users } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Trip, TripTag } from "@shared/schema";

interface TripCardProps {
  trip: Trip;
  tags?: TripTag[];
  onEditClick?: (trip: Trip) => void;
}

export function TripCard({ trip, tags = [], onEditClick }: TripCardProps) {
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const formatDate = (date: Date) => format(date, "MMM d, yyyy");
  
  // Default image if none provided
  const imageUrl = trip.imageUrl || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&h=400&q=80';

  return (
    <Card className="overflow-hidden bg-white">
      <div className="h-48 w-full relative">
        <img 
          src={imageUrl} 
          alt={trip.destination} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black opacity-50"></div>
        <div className="absolute bottom-0 left-0 p-4 text-white">
          <h4 className="text-xl font-bold">{trip.name}</h4>
          <p className="text-sm opacity-90">{formatDate(startDate)} - {formatDate(endDate)}</p>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center text-sm text-neutral-500 mb-3">
          <Globe className="h-5 w-5 mr-1" />
          {trip.destination}
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-sm text-neutral-500">
            <Calendar className="h-5 w-5 mr-1" />
            {daysDifference} {daysDifference === 1 ? 'day' : 'days'}
          </div>
          <div className="flex items-center text-sm text-neutral-500">
            <Users className="h-5 w-5 mr-1" />
            {trip.isShared ? 'Shared' : 'Private'}
          </div>
        </div>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <Badge 
                key={tag.id} 
                className="text-xs"
                style={{ 
                  backgroundColor: `${tag.color}25`, 
                  color: tag.color,
                  borderColor: `${tag.color}50`
                }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            asChild
          >
            <Link to={`/trips/${trip.id}`}>View Details</Link>
          </Button>
          <Button 
            variant="default" 
            className="flex-1"
            onClick={() => onEditClick && onEditClick(trip)}
          >
            Edit Trip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
