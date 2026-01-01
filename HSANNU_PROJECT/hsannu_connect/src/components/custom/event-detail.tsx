import { Event, getImageUrl } from "@/lib/api";
import { CalendarIcon, MapPinIcon, UserIcon } from "lucide-react";
import { format } from "date-fns";

export function EventDetail({ event }: { event: Event }) {
  return (
    <div className="space-y-6">
      {/* Image Gallery */}
      {event.images && event.images.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Images</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {event.images.map((image, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                <img
                  src={getImageUrl(image.filePath)}
                  alt={`${event.title} - Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Details */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{event.title}</h2>
        
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarIcon className="w-4 h-4 mr-2" />
          <time dateTime={event.eventDate}>
            {format(new Date(event.eventDate), "MMMM d, yyyy")}
            {!event.isWholeDay && event.startTime && (
              <> at {format(new Date(event.startTime), "h:mm a")}</>
            )}
          </time>
        </div>

        {event.address && (
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPinIcon className="w-4 h-4 mr-2" />
            <span>{event.address}</span>
          </div>
        )}

        <div className="flex items-center text-sm text-muted-foreground">
          <UserIcon className="w-4 h-4 mr-2" />
          <span>Posted by {event.authorName}</span>
        </div>

        {event.eventDescription && (
          <div className="prose max-w-none">
            <p>{event.eventDescription}</p>
          </div>
        )}
      </div>
    </div>
  );
} 