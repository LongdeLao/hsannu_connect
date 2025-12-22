"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { MapPin, Calendar, Clock } from "lucide-react";
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
import { Event } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface EventViewProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
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
        <DialogContent className="max-w-2xl">
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
            </div>

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
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 