"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Event, EventFormData, createEvent, updateEvent } from "@/lib/api";
import { ImageUpload } from "./image-upload";
import { useToast } from "@/hooks/use-toast";

interface ImageFile extends File {
  preview?: string;
  id: string;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event | null;
  selectedDate?: Date;
  selectedHour?: number;
  onSuccess: () => void;
}

export function EventForm({ 
  open, 
  onOpenChange, 
  event, 
  selectedDate, 
  selectedHour, 
  onSuccess 
}: EventFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    eventDescription: '',
    address: '',
    eventDate: selectedDate || new Date(),
    isWholeDay: true,
    startTime: undefined,
    endTime: undefined,
    images: undefined
  });
  const [selectedImages, setSelectedImages] = useState<ImageFile[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (event) {
      // Editing existing event
      setFormData({
        title: event.title,
        eventDescription: event.eventDescription,
        address: event.address,
        eventDate: new Date(event.eventDate),
        isWholeDay: event.isWholeDay,
        startTime: event.startTime ? new Date(event.startTime) : undefined,
        endTime: event.endTime ? new Date(event.endTime) : undefined,
        images: undefined
      });
    } else if (selectedDate) {
      // Creating new event with selected date/time
      const startTime = selectedHour !== undefined 
        ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), selectedHour)
        : undefined;
      const endTime = startTime 
        ? new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour later
        : undefined;

      setFormData({
        title: '',
        eventDescription: '',
        address: '',
        eventDate: selectedDate,
        isWholeDay: selectedHour === undefined,
        startTime,
        endTime,
        images: undefined
      });
    }
  }, [event, selectedDate, selectedHour]);

  // Auto-upload images when they're added
  useEffect(() => {
    const pendingImages = selectedImages.filter(img => img.uploadStatus === 'pending' && !img.error);
    
    if (pendingImages.length > 0) {
      // Start uploading pending images automatically
      pendingImages.forEach(image => {
        simulateUpload(image);
      });
    }
  }, [selectedImages]);

  const handleInputChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImagesChange = (images: ImageFile[]) => {
    setSelectedImages(images);
    // Clear any previous image-related errors
    if (errors.images) {
      setErrors(prev => ({ ...prev, images: '' }));
    }
  };

  const simulateUpload = async (image: ImageFile) => {
    // Update status to uploading
    setSelectedImages(prev => 
      prev.map(img => 
        img.id === image.id 
          ? { ...img, uploadStatus: 'uploading' as const, uploadProgress: 0 }
          : img
      )
    );

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setSelectedImages(prev => 
        prev.map(img => 
          img.id === image.id 
            ? { ...img, uploadProgress: progress }
            : img
        )
      );
    }

    // Mark as success
    setSelectedImages(prev => 
      prev.map(img => 
        img.id === image.id 
          ? { ...img, uploadStatus: 'success' as const, uploadProgress: 100 }
          : img
      )
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!formData.eventDescription.trim()) {
      newErrors.eventDescription = 'Event description is required';
    }

    if (!formData.isWholeDay) {
      if (!formData.startTime) {
        newErrors.startTime = 'Start time is required';
      }
      if (!formData.endTime) {
        newErrors.endTime = 'End time is required';
      }
      if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // First, upload any pending images
      const pendingImages = selectedImages.filter(img => img.uploadStatus === 'pending');
      
      if (pendingImages.length > 0) {
        toast({
          title: "Uploading images...",
          description: `Uploading ${pendingImages.length} image(s)`,
        });

        // Simulate upload for each pending image
        await Promise.all(pendingImages.map(image => simulateUpload(image)));
        
        toast({
          title: "Images uploaded successfully",
          variant: "success",
        });
      }

      // Convert ImageFile[] back to File[] for API submission
      const imageFiles = selectedImages
        .filter(img => img.uploadStatus === 'success' || img.uploadStatus === 'pending')
        .map(img => {
          // Create a new File object without the extra properties
          return new File([img], img.name, { type: img.type });
        });

      const submitData = {
        ...formData,
        images: imageFiles.length > 0 ? imageFiles : undefined
      };

      if (event) {
        await updateEvent(event.eventID, submitData);
        toast({
          title: "Event updated successfully",
          variant: "success",
        });
      } else {
        await createEvent(submitData);
        toast({
          title: "Event created successfully",
          variant: "success",
        });
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error submitting event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save event. Please try again.';
      setErrors({ submit: errorMessage });
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    // Clean up preview URLs
    selectedImages.forEach(image => {
      if (image.preview) {
        URL.revokeObjectURL(image.preview);
      }
    });

    setFormData({
      title: '',
      eventDescription: '',
      address: '',
      eventDate: new Date(),
      isWholeDay: true,
      startTime: undefined,
      endTime: undefined,
      images: undefined
    });
    setSelectedImages([]);
    setErrors({});
  };

  const formatTimeForInput = (date: Date) => {
    return format(date, 'HH:mm');
  };

  const parseTimeInput = (timeString: string, baseDate: Date) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const newDate = new Date(baseDate);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-semibold">
            {event ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Event Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter event title"
                className={`rounded-xl border-0 bg-muted/50 focus:bg-background transition-colors ${
                  errors.title ? 'ring-2 ring-destructive' : ''
                }`}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description *
              </Label>
              <Textarea
                id="description"
                value={formData.eventDescription}
                onChange={(e) => handleInputChange('eventDescription', e.target.value)}
                placeholder="Describe your event"
                rows={4}
                className={`rounded-xl border-0 bg-muted/50 focus:bg-background transition-colors resize-none ${
                  errors.eventDescription ? 'ring-2 ring-destructive' : ''
                }`}
              />
              {errors.eventDescription && (
                <p className="text-sm text-destructive">{errors.eventDescription}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter event location"
                className="rounded-xl border-0 bg-muted/50 focus:bg-background transition-colors"
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="eventDate" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </Label>
              <Input
                id="eventDate"
                type="date"
                value={format(formData.eventDate, 'yyyy-MM-dd')}
                onChange={(e) => handleInputChange('eventDate', new Date(e.target.value))}
                className="rounded-xl border-0 bg-muted/50 focus:bg-background transition-colors"
              />
            </div>

            {/* All day toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="space-y-1">
                <Label className="text-sm font-medium">All day event</Label>
                <p className="text-xs text-muted-foreground">
                  Toggle if this event runs all day
                </p>
              </div>
              <Switch
                checked={formData.isWholeDay}
                onCheckedChange={(checked) => handleInputChange('isWholeDay', checked)}
              />
            </div>

            {/* Time fields (shown when not all day) */}
            {!formData.isWholeDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Start Time *
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime ? formatTimeForInput(formData.startTime) : ''}
                    onChange={(e) => 
                      handleInputChange('startTime', parseTimeInput(e.target.value, formData.eventDate))
                    }
                    className={`rounded-xl border-0 bg-muted/50 focus:bg-background transition-colors ${
                      errors.startTime ? 'ring-2 ring-destructive' : ''
                    }`}
                  />
                  {errors.startTime && (
                    <p className="text-sm text-destructive">{errors.startTime}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    End Time *
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime ? formatTimeForInput(formData.endTime) : ''}
                    onChange={(e) => 
                      handleInputChange('endTime', parseTimeInput(e.target.value, formData.eventDate))
                    }
                    className={`rounded-xl border-0 bg-muted/50 focus:bg-background transition-colors ${
                      errors.endTime ? 'ring-2 ring-destructive' : ''
                    }`}
                  />
                  {errors.endTime && (
                    <p className="text-sm text-destructive">{errors.endTime}</p>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Image upload */}
            <ImageUpload
              images={selectedImages}
              onImagesChange={handleImagesChange}
              maxFiles={5}
              maxFileSize={10}
              disabled={loading}
              className="space-y-3"
            />

            {errors.submit && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{errors.submit}</p>
              </div>
            )}
          </div>

          <DialogFooter className="p-6 pt-4 border-t bg-background/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl"
            >
              {loading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 