"use client";

import { useState } from "react";
import { Download, ExternalLink, MoreVertical, Trash2, Eye, Calendar, User } from "lucide-react";
import { parseDocument, formatFileSize, formatDate, getFallbackIcon } from "@/lib/document-parser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DocumentCardProps {
  document: {
    id?: string;
    name: string;
    folder?: string;
    ext: string;
    url: string;
    size: number;
    modified_at?: string | Date;
    file_description?: string;
    uploader_name?: string;
    created_at?: string | Date;
  };
  onDelete?: (id: string) => void;
  onView?: (url: string) => void;
  className?: string;
}

export function DocumentCard({ document: doc, onDelete, onView, className }: DocumentCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Parse document using NLP
  const parsed = parseDocument(doc.name, doc.file_description);
  
  // Get appropriate icon
  const IconComponent = parsed.subjectIcon || parsed.typeIcon || getFallbackIcon();
  
  // Get display date
  const displayDate = doc.created_at || doc.modified_at;
  
  // Handle download
  const handleDownload = () => {
    const link = window.document.createElement("a");
    link.href = doc.url;
    link.download = doc.name;
    link.click();
  };
  
  // Handle view
  const handleView = () => {
    if (onView) {
      onView(doc.url);
    } else {
      window.open(doc.url, '_blank');
    }
  };
  
  // Handle delete
  const handleDelete = () => {
    if (doc.id && onDelete) {
      onDelete(doc.id);
    }
  };
  
  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1",
        parsed.subjectBorderColor || "border-gray-200",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subject color accent */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        parsed.subjectBgColor ? parsed.subjectColor?.replace('text-', 'bg-') : "bg-gray-300"
      )} />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {/* Subject/Type Icon */}
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-lg transition-colors",
              parsed.subjectBgColor || "bg-gray-50"
            )}>
              <IconComponent className={cn(
                "w-6 h-6",
                parsed.subjectColor || "text-gray-600"
              )} />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-tight">
                {doc.name}
              </h3>
              
              {/* Subject and Type badges */}
              <div className="flex items-center gap-2 mt-2">
                {parsed.subject && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs capitalize",
                      parsed.subjectColor,
                      parsed.subjectBgColor
                    )}
                  >
                    {parsed.subject}
                  </Badge>
                )}
                {parsed.type && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {parsed.type}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 transition-opacity",
                  isHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleView}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(doc.url, '_blank')}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in new tab
              </DropdownMenuItem>
              {doc.id && onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Description */}
        {doc.file_description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {doc.file_description}
          </p>
        )}
        
        {/* Folder */}
        {doc.folder && (
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <span className="font-medium">Folder:</span>
            <span className="ml-1 capitalize">{doc.folder}</span>
          </div>
        )}
        
        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            {/* File size */}
            <span>{formatFileSize(doc.size)}</span>
            
            {/* File type */}
            <span className="uppercase font-medium">{doc.ext}</span>
          </div>
          
          {/* Date and uploader */}
          <div className="flex items-center space-x-2">
            {doc.uploader_name && (
              <div className="flex items-center">
                <User className="w-3 h-3 mr-1" />
                <span>{doc.uploader_name}</span>
              </div>
            )}
            {displayDate && (
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                <span>{formatDate(displayDate)}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Quick action buttons */}
        <div className={cn(
          "flex items-center justify-center gap-2 mt-4 transition-opacity",
          isHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 
 