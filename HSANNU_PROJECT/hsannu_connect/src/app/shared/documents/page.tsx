"use client";

import { useEffect, useState } from "react";
import { Search, FileText, Download, ExternalLink, RefreshCw, List, Grid3X3, ChevronRight, Home } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { toast } from "sonner";

interface Document {
  id?: string;
  name: string;
  folder?: string;
  ext: string;
  url: string;
  size: number;
  modified_at?: string;
  file_description?: string;
  uploader_name?: string;
  created_at?: string;
}

// Structural types for API responses
type ApiStaticItem = {
  name: string;
  folder?: string;
  ext: string;
  url: string;
  size: number;
  modified_at?: string;
};

type ApiDbDocument = {
  file_name?: string;
  name?: string;
  folder?: string;
  file_type?: string;
  ext?: string;
  file_path?: string;
  url?: string;
  file_size?: number;
  size?: number;
  updated_at?: string;
  modified_at?: string;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  // Fetch documents
  const fetchDocuments = async () => {
      try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/documents/static");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log("API Response:", data); // Debug log
      
      if (data.success) {
        // Handle different response structures
        let items: Array<ApiStaticItem | ApiDbDocument> = [];
        
        if (data.items && Array.isArray(data.items)) {
          // Static documents endpoint structure
          items = data.items as ApiStaticItem[];
        } else if (data.documents && Array.isArray(data.documents)) {
          // Database documents endpoint structure
          items = (data.documents as ApiDbDocument[]).map((doc) => ({
            name: doc.file_name || doc.name || "",
            folder: doc.folder || "",
            ext: (doc.file_type || doc.ext || "").toString(),
            url: (doc.file_path || doc.url || "").toString(),
            size: Number(doc.file_size ?? doc.size ?? 0),
            modified_at: (doc.updated_at || doc.modified_at || "").toString(),
          }));
        } else if (data.all_documents && Array.isArray(data.all_documents)) {
          // Summary endpoint structure
          items = data.all_documents as ApiStaticItem[];
        }
        
        if (items.length > 0) {
          // Transform the data to match our interface
          const transformedDocs: Document[] = (items as ApiStaticItem[]).map((item) => ({
            name: item.name,
            folder: item.folder,
            ext: item.ext,
            url: item.url,
            size: item.size,
            modified_at: item.modified_at,
          }));
          
          setDocuments(transformedDocs);
          } else {
          // Handle empty response
          setDocuments([]);
          setError("No documents found");
        }
      } else {
        setError(data.message || "Failed to fetch documents");
        console.error("Invalid response structure:", data);
      }
    } catch (err) {
      setError(`Failed to connect to server: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
      }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Filter documents based on search query
  const filteredDocuments = documents.filter((doc) => {
    return searchQuery === "" || 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.folder?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.file_description?.toLowerCase().includes(searchQuery.toLowerCase());
  });



  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Download document
  const downloadDocument = (doc: Document) => {
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchDocuments();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <Skeleton className="h-9 w-full max-w-md" />
        </div>

        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-md">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Remove inline error block; rely on toast instead
  if (error) {
    return (
      <div className="p-6">
        <div className="text-sm text-muted-foreground">There was a problem loading documents.</div>
        <div className="mt-3">
          <Button onClick={fetchDocuments} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Breadcrumbs */}
      <div className="mb-4">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/shared" className="hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Documents</span>
          {documents.length > 0 && documents[0].folder && (
            <>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium capitalize">{documents[0].folder}</span>
            </>
          )}
        </nav>
      </div>

      {/* Header */}
      <div className="mb-6">
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Documents</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Course materials and resources
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Documents Count */}
      <div className="text-sm text-muted-foreground mb-4">
        {filteredDocuments.length} documents
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No documents found</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-2">
          {filteredDocuments.map((doc, index) => (
            <div
              key={`${doc.url}-${index}`}
              className="flex items-center justify-between p-3 rounded-md hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-muted rounded-md">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    {doc.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(doc.size)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={() => downloadDocument(doc)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map((doc, index) => (
            <div
              key={`${doc.url}-${index}`}
              className="rounded-lg p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground truncate" title={doc.name}>
                    {doc.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatFileSize(doc.size)}
                  </p>
                  </div>
                <div className="flex items-center space-x-2 w-full">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center p-2 text-muted-foreground hover:text-foreground transition-colors rounded"
                    title="Open document"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => downloadDocument(doc)}
                    className="flex-1 flex items-center justify-center p-2 text-muted-foreground hover:text-foreground transition-colors rounded"
                    title="Download document"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                    </div>
                  </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );
} 