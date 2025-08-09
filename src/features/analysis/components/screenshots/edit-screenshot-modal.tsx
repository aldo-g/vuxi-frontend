"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Link, Save, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type { Screenshot, ScreenshotData } from '@/types';

interface EditScreenshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (screenshot: Screenshot) => void;
  editingScreenshot?: Screenshot | null; // null for add mode, Screenshot for edit mode
  editingIndex?: number;
  captureJobId: string; // Add this prop
}

export function EditScreenshotModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editingScreenshot, 
  editingIndex,
  captureJobId 
}: EditScreenshotModalProps) {
  const [url, setUrl] = useState('');
  const [customPageName, setCustomPageName] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageData, setUploadedImageData] = useState<any>(null); // Store upload API response
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('url');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isEditMode = !!editingScreenshot;

  // Initialize form when modal opens or editing screenshot changes
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && editingScreenshot) {
        setUrl(editingScreenshot.url);
        setCustomPageName(editingScreenshot.data?.customPageName || '');
        
        // Handle custom screenshots
        if (editingScreenshot.data?.isCustom) {
          setActiveTab('upload');
          
          // If it has a saved path, we don't need to show dataUrl
          if (editingScreenshot.data.path) {
            // This is a properly saved custom screenshot
            setUploadedImageData({
              path: editingScreenshot.data.path,
              filename: editingScreenshot.data.filename || 'custom_screenshot'
            });
            // Show a placeholder image or the actual image URL
            setUploadedImage(editingScreenshot.data.dataUrl || null);
          } else if (editingScreenshot.data.dataUrl) {
            // This is an old-style base64 screenshot
            setUploadedImage(editingScreenshot.data.dataUrl);
            setUploadedImageData(null);
          }
        } else {
          setActiveTab('url');
          setUploadedImage(null);
          setUploadedImageData(null);
        }
      } else {
        // Add mode - reset form
        setUrl('');
        setCustomPageName('');
        setUploadedImage(null);
        setUploadedImageData(null);
        setActiveTab('url');
      }
      setIsLoading(false);
      setIsUploading(false);
    }
  }, [isOpen, isEditMode, editingScreenshot]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPG, WebP, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('captureJobId', captureJobId);

      // Upload file to our API
      const response = await fetch('/api/upload-screenshot', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadResult = await response.json();
      
      // Store upload result for later use
      setUploadedImageData(uploadResult);
      
      // Also create a preview URL (temporary base64 for display only)
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Auto-set page name from file name if empty
      if (!customPageName) {
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        setCustomPageName(fileName);
      }

      toast({
        title: "Upload successful",
        description: "Your screenshot has been uploaded and saved",
        variant: "default"
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = () => {
    if (activeTab === 'url') {
      if (!url.trim()) {
        toast({
          title: "URL required",
          description: "Please enter a valid URL",
          variant: "destructive"
        });
        return false;
      }

      // Basic URL validation
      try {
        new URL(url);
      } catch {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid URL (e.g., https://example.com)",
          variant: "destructive"
        });
        return false;
      }
    } else if (activeTab === 'upload') {
      if (!uploadedImageData) {
        toast({
          title: "Image required",
          description: "Please upload an image file",
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      let newScreenshot: Screenshot;

      if (activeTab === 'upload' && uploadedImageData) {
        // Custom uploaded image - use the upload API response data
        const screenshotData: ScreenshotData = {
          isCustom: true,
          path: uploadedImageData.path, // This will be like "uploads/screenshots/{captureJobId}/{filename}"
          filename: uploadedImageData.filename,
          customPageName: customPageName.trim() || uploadedImageData.filename.replace(/\.[^/.]+$/, ""),
          timestamp: uploadedImageData.timestamp,
          viewport: { width: 1920, height: 1080 }, // Default viewport for custom images
          // Note: We don't store dataUrl in the final data to keep JSON clean
        };

        newScreenshot = {
          url: url.trim() || customPageName.trim() || 'Custom Screenshot',
          success: true,
          data: screenshotData,
          error: null
        };
      } else {
        // URL-based screenshot (placeholder for now - could be enhanced to actually capture)
        const screenshotData: ScreenshotData = {
          isCustom: false,
          customPageName: customPageName.trim() || undefined,
          timestamp: new Date().toISOString(),
          viewport: { width: 1920, height: 1080 }
        };

        newScreenshot = {
          url: url.trim(),
          success: true,
          data: screenshotData,
          error: null
        };
      }

      onSave(newScreenshot);
      onClose();

      toast({
        title: isEditMode ? "Screenshot updated" : "Screenshot added",
        description: isEditMode 
          ? "Your changes have been saved successfully" 
          : "New screenshot has been added to your analysis",
        variant: "default"
      });

    } catch (error) {
      console.error('Error saving screenshot:', error);
      toast({
        title: "Save failed",
        description: "There was an error saving the screenshot. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {isEditMode ? `Edit Screenshot` : 'Add New Screenshot'}
            </CardTitle>
            <Button
              onClick={handleClose}
              variant="ghost"
              size="icon"
              disabled={isLoading}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                URL Screenshot
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Image
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="url">Website URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-500">
                  Enter the URL of the page you want to capture
                </p>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Upload Screenshot</Label>
                  <div 
                    className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors cursor-pointer"
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <div className="space-y-3">
                        <div className="w-12 h-12 mx-auto border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                        <p className="font-medium">Uploading...</p>
                        <p className="text-sm text-slate-500">Please wait while we save your image</p>
                      </div>
                    ) : uploadedImage ? (
                      <div className="space-y-3">
                        <img 
                          src={uploadedImage} 
                          alt="Uploaded screenshot" 
                          className="max-w-full max-h-48 mx-auto rounded border"
                        />
                        <Button variant="outline" size="sm" disabled={isUploading}>
                          <Upload className="w-4 h-4 mr-2" />
                          Change Image
                        </Button>
                        {uploadedImageData && (
                          <p className="text-xs text-green-600">
                            ✅ Saved as {uploadedImageData.filename}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Camera className="w-12 h-12 mx-auto text-slate-400" />
                        <div>
                          <p className="font-medium">Click to upload screenshot</p>
                          <p className="text-sm text-slate-500">PNG, JPG, WebP up to 10MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isLoading}
                  />
                </div>

                {uploadedImage && (
                  <div className="space-y-2">
                    <Label htmlFor="upload-url">Associated URL (optional)</Label>
                    <Input
                      id="upload-url"
                      type="url"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={isLoading}
                    />
                    <p className="text-xs text-slate-500">
                      The URL this screenshot represents
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Custom Page Name - Available for both tabs */}
          <div className="space-y-2">
            <Label htmlFor="pageName">Page Name (optional)</Label>
            <Input
              id="pageName"
              placeholder="e.g., Homepage, About Page, Product Details"
              value={customPageName}
              onChange={(e) => setCustomPageName(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-slate-500">
              Custom name for this page in your analysis
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={handleClose} 
              variant="outline" 
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="flex-1"
              disabled={isLoading || isUploading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditMode ? 'Save Changes' : 'Add Screenshot'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}