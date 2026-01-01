import { Event, getImageUrl } from "@/lib/api";
import { Card } from "@/components/ui/card";

interface EventCardProps {
  event: Event;
  onClick: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      {event.images && event.images.length > 0 && (
        <div className="relative w-full h-48">
          <img
            src={getImageUrl(event.images[0].filePath)}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-bold">{event.title}</h3>
        <p className="text-sm text-gray-600">{event.eventDescription}</p>
        <p className="text-sm text-gray-600">Date: {new Date(event.eventDate).toLocaleDateString()}</p>
        <p className="text-sm text-gray-600">Location: {event.address}</p>
      </div>
    </Card>
  );
} 