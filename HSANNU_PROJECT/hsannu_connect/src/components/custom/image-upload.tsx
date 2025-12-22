"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ImageFile extends File {
  preview?: string;
  id: string;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface ImageUploadProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  images,
  onImagesChange,
  maxFiles = 10,
  maxFileSize = 5, // 5MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  className,
  disabled = false
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported`;
    }
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }
    return null;
  };

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newImages: ImageFile[] = [];

    fileArray.forEach((file) => {
      const error = validateFile(file);
      const imageFile = Object.assign(file, {
        id: generateId(),
        preview: URL.createObjectURL(file),
        uploadStatus: error ? 'error' as const : 'pending' as const,
        error
      });
      newImages.push(imageFile);
    });

    const totalImages = images.length + newImages.length;
    if (totalImages > maxFiles) {
      const allowedNewImages = newImages.slice(0, maxFiles - images.length);
      onImagesChange([...images, ...allowedNewImages]);
    } else {
      onImagesChange([...images, ...newImages]);
    }
  }, [images, maxFiles, onImagesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const removeImage = useCallback((id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove?.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    onImagesChange(images.filter(img => img.id !== id));
  }, [images, onImagesChange]);

  const retryUpload = useCallback((id: string) => {
    const updatedImages = images.map(img => 
      img.id === id 
        ? { ...img, uploadStatus: 'pending' as const, error: undefined }
        : img
    );
    onImagesChange(updatedImages);
  }, [images, onImagesChange]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 cursor-pointer",
          isDragOver && !disabled
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "opacity-50 cursor-not-allowed",
          images.length >= maxFiles && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && images.length < maxFiles && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || images.length >= maxFiles}
        />
        
        <div className="flex flex-col items-center text-center">
          <div className={cn(
            "p-3 rounded-full mb-3 transition-colors",
            isDragOver && !disabled
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}>
            <Upload className="h-6 w-6" />
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {images.length >= maxFiles 
                ? `Maximum ${maxFiles} images reached`
                : isDragOver 
                  ? "Drop images here"
                  : "Click to upload or drag and drop"
              }
            </p>
            <p className="text-xs text-muted-foreground">
              {acceptedTypes.map(type => type.split('/')[1]).join(', ').toUpperCase()} up to {maxFileSize}MB each
            </p>
            {maxFiles > 1 && (
              <p className="text-xs text-muted-foreground">
                {images.length} of {maxFiles} images selected
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Selected Images ({images.length})
          </Label>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
                  {image.preview ? (
                    <img
                      src={image.preview}
                      alt={image.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Overlay with status */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                    {/* Remove button */}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeImage(image.id)}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    
                    {/* Status indicator */}
                    <div className="absolute bottom-1 left-1">
                      {image.uploadStatus === 'success' && (
                        <div className="bg-green-500 text-white p-1 rounded-full">
                          <CheckCircle className="h-3 w-3" />
                        </div>
                      )}
                      {image.uploadStatus === 'error' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => retryUpload(image.id)}
                          className="h-6 px-2 py-0 text-xs bg-red-500 text-white border-red-500 hover:bg-red-600"
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Upload progress */}
                  {image.uploadStatus === 'uploading' && image.uploadProgress !== undefined && (
                    <div className="absolute bottom-0 left-0 right-0 p-1">
                      <Progress value={image.uploadProgress} className="h-1" />
                    </div>
                  )}
                </div>
                
                {/* File info */}
                <div className="mt-1 space-y-1">
                  <p className="text-xs font-medium truncate" title={image.name}>
                    {image.name}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{(image.size / 1024 / 1024).toFixed(1)}MB</span>
                    {image.uploadStatus === 'error' && image.error && (
                      <span className="text-destructive truncate ml-1" title={image.error}>
                        {image.error}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 