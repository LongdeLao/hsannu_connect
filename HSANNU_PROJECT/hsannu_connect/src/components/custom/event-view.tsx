"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { MapPin, Calendar, Clock, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Event, getImageUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ImageModel } from "@/lib/api";

interface EventViewProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

interface ImageViewerProps {
  image: ImageModel;
  onClose: () => void;
}

function ImageViewer({ image, onClose }: ImageViewerProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0" title="Image preview">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <img
            src={getImageUrl(image.filePath)}
            alt="Event"
            className="w-full h-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EventView({
  event,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true
}: EventViewProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageModel | null>(null);
  const { toast } = useToast();

  if (!event) return null;

  const eventDate = parseISO(event.eventDate);
  const startTime = event.startTime ? parseISO(event.startTime) : null;
  const endTime = event.endTime ? parseISO(event.endTime) : null;

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(event);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(event.eventID);
      setShowDeleteConfirm(false);
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete event",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl" title={event.title || "Event details"}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              {event.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Event Details */}
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{format(eventDate, "EEEE, MMMM d, yyyy")}</p>
                  {startTime && endTime && !event.isWholeDay && (
                    <p className="text-sm text-muted-foreground">
                      {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                    </p>
                  )}
                  {event.isWholeDay && (
                    <p className="text-sm text-muted-foreground">All day</p>
                  )}
                </div>
              </div>

              {event.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p>{event.address}</p>
                </div>
              )}

              {event.eventDescription && (
                <div className="pt-2">
                  <p className="whitespace-pre-wrap">{event.eventDescription}</p>
                </div>
              )}

              {/* Event Images */}
              {event.images && event.images.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-foreground">Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {event.images.map((image, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedImage(image)}
                      >
                        <img
                          src={getImageUrl(image.filePath)}
                          alt={`Event image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                {canEdit && (
                  <Button variant="outline" onClick={handleEdit}>
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedImage && (
        <ImageViewer
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {showDeleteConfirm && (
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                event.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}