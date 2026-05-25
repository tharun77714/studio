"use client";

import { useState, type ChangeEvent, type FormEvent, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Keep Input
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Keep Card components
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Keep Alert
import { Loader2, Sparkles, AlertTriangle, UploadCloud, Image as ImageIcon, Lightbulb, SlidersHorizontal, Info, History, RotateCcw as RevertIcon, Eye, Wand2 } from "lucide-react";
import { enhanceJewelryPrompt, type EnhanceJewelryPromptInput } from "@/ai/flows/enhance-jewelry-prompt"; // Import new flow
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Keep Tabs components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, StopCircle as LucideMicOff, Mic as LucideMic } from 'lucide-react'; // Import Mic and StopCircle
import { useAuth } from '@/hooks/useAuth';
import { saveDesignAction } from '@/lib/actions/supabase-actions';

// Utility function to convert File to Data URI
const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const materials = ["Gold", "Silver", "Rose Gold", "Platinum", "Titanium"];
const materialFinishes = ["Polished", "Matte", "Brushed", "Hammered", "Satin"];
const gemstones = ["Diamond", "Sapphire", "Ruby", "Emerald", "Amethyst", "Opal", "Pearl", "Garnet", "Topaz", "None"];
const gemstoneCuts = ["Round", "Princess", "Oval", "Marquise", "Pear", "Emerald", "Baguette", "Cushion", "Asscher", "Radiant"];
const designStyles = ["Vintage", "Modern", "Art Deco", "Minimalist", "Bohemian", "Nature-Inspired", "Geometric", "Classic", "Abstract"];

const NO_CHANGE_VALUE = "no-change";

interface HistoryItem {
  imageUrl: string;
  description: string;
  seed?: number;
}

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export default function CustomizerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [baseImageFile, setBaseImageFile] = useState<File | null>(null);
  const [baseImageDataUri, setBaseImageDataUri] = useState<string | null>(null);
  const [initialUploadedImageDataUri, setInitialUploadedImageDataUri] = useState<string | null>(null);
  
  const [customizationTab, setCustomizationTab] = useState<string>("prompt");
  const [customizationPrompt, setCustomizationPrompt] = useState<string>("");
  
  const [manualMaterial, setManualMaterial] = useState<string>(NO_CHANGE_VALUE);
  const [manualMaterialFinish, setManualMaterialFinish] = useState<string>(NO_CHANGE_VALUE);
  const [manualGemstone, setManualGemstone] = useState<string>(NO_CHANGE_VALUE);
  const [manualGemstoneCut, setManualGemstoneCut] = useState<string>(NO_CHANGE_VALUE);
  const [manualDesignStyle, setManualDesignStyle] = useState<string>(NO_CHANGE_VALUE);
  const [manualEngraving, setManualEngraving] = useState<string>("");

  const [customizedImageDataUri, setCustomizedImageDataUri] = useState<string | null>(null);
  const [currentSeed, setCurrentSeed] = useState<number | null>(null);
  const [imageHistory, setImageHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState<boolean>(false); // New state for prompt enhancement
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false); // State for recording status
  const [recognition, setRecognition] = useState<any>(null); // State for SpeechRecognition instance
  const [isMounted, setIsMounted] = useState(false);
  
  // Custom luxury 3D integration framework hooks
  const [previewMode, setPreviewMode] = useState<"2d" | "3d">("2d");
  const [splineUrl, setSplineUrl] = useState<string>("https://prod.spline.design/k8dpeOOeO1nCXtlG/scene.splinecode"); // Default premium interactive WebGL scene
  const [customSplineInput, setCustomSplineInput] = useState<string>("");

  useEffect(() => {
    setIsMounted(true);
    
    // Load Spline WebGL Script dynamically to avoid bundling issues
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@splinetool/viewer@1.9.0/build/spline-viewer.js";
    script.type = "module";
    document.body.appendChild(script);
    
    return () => {
      // Clean up script on unmount
      const existingScript = document.querySelector('script[src*="spline-viewer"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);


  const clearCustomizationInputs = () => {
    // Stop recording if active when clearing inputs
    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
      toast({
        title: "Recording Stopped",
        description: "Speech recognition was stopped due to input clear.",
      });
    }
    // If recognition instance exists, abort it
    if (recognition) {
      recognition.abort();
    }

    setCustomizationPrompt("");
    setManualMaterial(NO_CHANGE_VALUE);
    setManualMaterialFinish(NO_CHANGE_VALUE);
    setManualGemstone(NO_CHANGE_VALUE);
    setManualGemstoneCut(NO_CHANGE_VALUE);
    setManualDesignStyle(NO_CHANGE_VALUE);
    setManualEngraving("");
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBaseImageFile(file);
      setError(null);
      try {
        const dataUri = await fileToDataUri(file);
        setBaseImageDataUri(dataUri);
        setInitialUploadedImageDataUri(dataUri); 
        setCustomizedImageDataUri(dataUri); 
        setImageHistory([{ imageUrl: dataUri, description: "Initial image" }]);
        clearCustomizationInputs();
      } catch (err) {
        setError("Failed to load image. Please try again.");
        setBaseImageDataUri(null);
        setInitialUploadedImageDataUri(null);
        setCustomizedImageDataUri(null);
      }
    } else {
      setBaseImageFile(null);
    }
  };

  const generateCustomizationDescription = (): string => {
    if (customizationTab === "prompt") {
      return customizationPrompt.trim();
    } else {
      let descriptionParts: string[] = [];
      
      if (manualMaterial !== NO_CHANGE_VALUE) {
        let materialDesc = `Set material to ${manualMaterial}`;
        if (manualMaterialFinish !== NO_CHANGE_VALUE) {
          materialDesc += ` with a ${manualMaterialFinish.toLowerCase()} finish`;
        }
        descriptionParts.push(materialDesc + ".");
      } else if (manualMaterialFinish !== NO_CHANGE_VALUE) {
        descriptionParts.push(`Apply a ${manualMaterialFinish.toLowerCase()} finish.`);
      }

      if (manualGemstone !== NO_CHANGE_VALUE) {
        if (manualGemstone === "None") {
          descriptionParts.push(`Remove any existing gemstones or ensure no gemstones are present.`);
        } else {
          let gemstoneDesc = `Set gemstone to ${manualGemstone}`;
          if (manualGemstoneCut !== NO_CHANGE_VALUE) {
            gemstoneDesc += ` with a ${manualGemstoneCut.toLowerCase()} cut`;
          }
          descriptionParts.push(gemstoneDesc + ".");
        }
      } else if (manualGemstoneCut !== NO_CHANGE_VALUE && String(manualGemstone) !== "None") {
        descriptionParts.push(`Use a ${manualGemstoneCut.toLowerCase()} cut for the gemstone(s).`);
      }
      
      if (manualDesignStyle !== NO_CHANGE_VALUE) {
        descriptionParts.push(`The overall design style should be ${manualDesignStyle.toLowerCase()}.`);
      }

      if (manualEngraving.trim()) {
        descriptionParts.push(`Add engraving: "${manualEngraving.trim()}".`);
      }

      if (descriptionParts.length === 0 && baseImageDataUri) {
        return "Subtly enhance or refine the provided base image.";
      }
      return descriptionParts.join(" ").trim();
    }
  };
  
  const isCustomizationProvided = (): boolean => {
    if (customizationTab === "prompt") {
      return customizationPrompt.trim() !== "";
    } else {
      return (
        manualMaterial !== NO_CHANGE_VALUE ||
        manualMaterialFinish !== NO_CHANGE_VALUE ||
        manualGemstone !== NO_CHANGE_VALUE ||
        (String(manualGemstone) !== "None" && manualGemstoneCut !== NO_CHANGE_VALUE) || 
        manualDesignStyle !== NO_CHANGE_VALUE ||
        manualEngraving.trim() !== ""
      );
    }
  };

  const handleEnhancePrompt = async () => {
    if (!customizationPrompt.trim()) {
      toast({
        title: "Cannot Enhance Empty Prompt",
        description: "Please type your initial idea before enhancing.",
        variant: "default"
      });
      return;
    }
    setIsEnhancingPrompt(true);
    setError(null);
    try {
      const input: EnhanceJewelryPromptInput = { currentPrompt: customizationPrompt };
      const result = await enhanceJewelryPrompt(input);
      setCustomizationPrompt(result.enhancedPrompt);
      toast({
        title: "Prompt Enhanced!",
        description: "The AI has expanded on your idea. You can edit it further or generate your design.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred while enhancing the prompt.";
      setError(errorMessage);
      toast({
        title: "Prompt Enhancement Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // Function to handle speech recognition start/stop
  const handleSpeechInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Speech Input Not Supported",
        description: "Your browser does not support speech recognition. Please use a modern browser like Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    // Use webkitSpeechRecognition for broader browser support, fallback to SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!recognition) {
      const newRecognition = new SpeechRecognition();
      newRecognition.continuous = false; // Stop after a pause
      newRecognition.interimResults = false; // Only return final results
      newRecognition.lang = 'en-US'; // Set language

      newRecognition.onstart = () => {
        setIsRecording(true);
        setError(null); // Clear any previous errors on start
      };

      newRecognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCustomizationPrompt(prev => (prev + " " + transcript).trim());
      };

      newRecognition.onerror = (event: any) => {
        setIsRecording(false);
        setError(`Speech recognition error: ${event.error}`);
        toast({
          title: "Speech Recognition Error",
          description: `Error: ${event.error}. Please check microphone permissions.`,
          variant: "destructive",
          duration: 7000,
        });
      };

      newRecognition.onend = () => {
        setIsRecording(false);
      };
      setRecognition(newRecognition);
    }

    if (isRecording) {
      recognition?.stop(); // Stop recording if already active
    } else {
      // Abort previous recording if it exists before starting a new one
      if (recognition) {
        recognition.abort();
      }
      recognition?.start(); // Start recording
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const finalCustomizationDescription = generateCustomizationDescription();

    if (!finalCustomizationDescription && !baseImageDataUri) {
       setError("Please describe your new design or select manual options.");
       return;
    }
    if (!finalCustomizationDescription && baseImageDataUri && !isCustomizationProvided()) { 
        setError("Please describe your customization or select manual options for the current base image.");
        return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      const promptText = finalCustomizationDescription || "Create a new jewelry design.";

      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          seed: baseImageDataUri && currentSeed ? currentSeed : undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Image generation failed.");
      }

      const imageUrl = result?.image || result?.dataUri;
      if (!imageUrl) {
        throw new Error("Image generation did not return an image.");
      }

      const newHistoryItem: HistoryItem = { 
        imageUrl: imageUrl, 
        description: finalCustomizationDescription || (baseImageDataUri ? "Subtle refinement" : "New design from empty prompt"),
        seed: result?.seed
      };

      setCustomizedImageDataUri(imageUrl);
      setBaseImageDataUri(imageUrl); 
      if (result?.seed) setCurrentSeed(result.seed);
      setBaseImageFile(null); 

      setImageHistory(prevHistory => {
        const updatedHistory = [newHistoryItem, ...prevHistory.filter(item => item.imageUrl !== imageUrl)];
        return updatedHistory.slice(0, 3); 
      });
      clearCustomizationInputs(); 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred during customization.";
      setError(errorMessage);
      toast({
        title: "Customization Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistoryImageSelect = (historyItem: HistoryItem) => {
    setCustomizedImageDataUri(historyItem.imageUrl); 
    setBaseImageDataUri(historyItem.imageUrl); 
    if (historyItem.seed) setCurrentSeed(historyItem.seed);
    setBaseImageFile(null);
    clearCustomizationInputs(); 
  };

  const handleRevertToInitial = () => {
    if (!initialUploadedImageDataUri) return;
    setBaseImageDataUri(initialUploadedImageDataUri);
    setCustomizedImageDataUri(initialUploadedImageDataUri); 
    setBaseImageFile(null);
    const initialHistoryEntry: HistoryItem = { imageUrl: initialUploadedImageDataUri, description: "Initial image" };
    setImageHistory(prev => [initialHistoryEntry, ...prev.filter(item => item.imageUrl !== initialUploadedImageDataUri)].slice(0,3));
    clearCustomizationInputs();
  };

  const handleStartOver = () => {
    setBaseImageFile(null);
    setBaseImageDataUri(null);
    setInitialUploadedImageDataUri(null);
    setCustomizedImageDataUri(null);
    setImageHistory([]);
    clearCustomizationInputs();
    setError(null);
  };

  const handleViewDetails = () => {
    if (!customizedImageDataUri) return;
    
    const currentHistoryItem = imageHistory.find(item => item.imageUrl === customizedImageDataUri);
    const promptForDetails = currentHistoryItem?.description || 
                             (baseImageDataUri === customizedImageDataUri && initialUploadedImageDataUri === customizedImageDataUri ? "Initial image" : "Customized jewelry");

    if (customizedImageDataUri) {
      try {
        sessionStorage.setItem('productDetailsImageUri', customizedImageDataUri);
        sessionStorage.setItem('productDetailsPrompt', promptForDetails);
        router.push('/dashboard/product-details');
      } catch (e) {
        console.error("Error using sessionStorage:", e);
        setError("Could not navigate to details page. Your browser might be blocking session storage or it's full.");
        toast({
          title: "Navigation Error",
          description: "Could not navigate to details page. Your browser might be blocking session storage or it's full.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveModel = async () => {
    if (!customizedImageDataUri) return;
    if (!user) {
      toast({ title: 'Sign In Required', description: 'Please sign in to save your design models.', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await saveDesignAction({
        user_id: user.id,
        image_data_uri: customizedImageDataUri,
        design_prompt: imageHistory.find(item => item.imageUrl === customizedImageDataUri)?.description || '',
      });
      if (error) throw error;
      toast({ title: 'Saved!', description: 'Model saved to your profile.' });
    } catch (err) {
      toast({ title: 'Save failed', description: 'Could not save model.', variant: 'destructive' });
    }
  };
  
  if (!isMounted) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const noChangeText = baseImageDataUri ? "No Change" : "Not Specified";
  const showGemstoneCut = manualGemstone !== NO_CHANGE_VALUE && manualGemstone !== "None";
  const canRevertToInitial = initialUploadedImageDataUri && baseImageDataUri !== initialUploadedImageDataUri;

  const submitButtonText = baseImageDataUri ? "Refine This Design" : "Generate New Design";
  const submitButtonDisabled = isLoading || isEnhancingPrompt ||
                               (!isCustomizationProvided() && !baseImageDataUri) ||
                               (baseImageDataUri && !isCustomizationProvided() && !baseImageFile); 

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto">
      <div className="text-center relative py-12">
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
           <div className="w-64 h-64 bg-primary/20 blur-[100px] rounded-full" />
        </div>
        <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-white mb-4 relative z-10">
          Design Laboratory
        </h1>
        <p className="text-white/50 text-sm md:text-base tracking-wide max-w-2xl mx-auto relative z-10">
          Upload an inspiration piece or describe your vision. Our AI operating system will render your bespoke creation in real-time.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="animate-in fade-in duration-300">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 1, 0.25, 1] }}
        className="rounded-[2rem] border border-white/5 bg-black/40 backdrop-blur-2xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden relative"
      >
        <div className="p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/5">
            <Sparkles className="h-6 w-6 text-primary"/>
            <h2 className="text-2xl font-medium tracking-wide text-white">Configuration Engine</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="baseImage" className="text-sm uppercase tracking-widest text-primary font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">1</span>
                Initial Inspiration Image
              </Label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="baseImage"
                  className="relative flex flex-col items-center justify-center w-full h-56 rounded-[1.5rem] cursor-pointer bg-black/20 border border-white/10 hover:border-primary/50 hover:bg-black/40 transition-all group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {baseImageDataUri && !baseImageFile ? ( 
                     <div className="relative w-40 h-40 z-10">
                        <Image src={baseImageDataUri} alt="Current Base" layout="fill" objectFit="contain" className="rounded-xl shadow-2xl" />
                     </div>
                  ) : baseImageFile && baseImageDataUri ? ( 
                     <div className="relative w-40 h-40 z-10">
                        <Image src={baseImageDataUri} alt="Preview" layout="fill" objectFit="contain" className="rounded-xl shadow-2xl" />
                     </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-white/40 group-hover:text-white/80 transition-colors z-10">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                        <UploadCloud className="w-8 h-8 text-primary" />
                      </div>
                      <p className="mb-2 text-sm tracking-wide"><span className="font-medium text-white">Click to upload</span> or drag and drop</p>
                      <p className="text-xs uppercase tracking-widest opacity-50">PNG, JPG, WEBP</p>
                    </div>
                  )}
                  <Input id="baseImage" type="file" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
               {baseImageDataUri && (
                <>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {canRevertToInitial && (
                       <Button variant="outline" size="sm" onClick={handleRevertToInitial} className="w-full">
                         <RevertIcon className="mr-2 h-4 w-4"/> Use Initial Upload as Base
                       </Button>
                    )}
                  </div>
                  <div className="mt-2 p-3 bg-accent/10 rounded-md border border-accent/30">
                    <div className="flex items-start text-accent">
                      <Info className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                      <p className="text-xs">
                        <strong>Tip:</strong> If your image has multiple items, be specific in your prompt. Example: "Change the earrings to silver". The current image shown in "Current Base Design" below (if any) will be the base for the next AI customization.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-6 mt-10">
              <Label className="text-sm uppercase tracking-widest text-primary font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">2</span>
                Design Parameters
              </Label>
              <Tabs value={customizationTab} onValueChange={setCustomizationTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 p-1 bg-black/40 border border-white/10 rounded-xl h-14">
                  <TabsTrigger value="prompt" className="rounded-lg text-sm tracking-wide data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50"><Lightbulb className="mr-2 h-4 w-4" />Neural Prompt</TabsTrigger>
                  <TabsTrigger value="manual" className="rounded-lg text-sm tracking-wide data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50"><SlidersHorizontal className="mr-2 h-4 w-4" />Manual Parameters</TabsTrigger>
                </TabsList>
                <TabsContent value="prompt" className="pt-6 space-y-4">
                    <Label htmlFor="customizationPrompt" className="text-sm text-white/70 tracking-wide font-normal">
                      {baseImageDataUri ? "Detail modifications to the base model" : "Describe the bespoke vision for your new piece"}
                    </Label>
                    <div className="relative">
                        <Textarea
                            id="customizationPrompt"
                            value={customizationPrompt}
                            onChange={(e) => setCustomizationPrompt(e.target.value)}
                            placeholder={baseImageDataUri 
                                ? "e.g., 'Change the gemstone to a large oval sapphire with a vintage style', 'Add floral engravings with a matte finish'" 
                                : "e.g., 'A silver necklace with a crescent moon pendant, polished finish, and small blue stars', 'Gold ring, ruby gemstone, emerald cut, art deco style'"
                            }
                            rows={6}
                            className="text-base bg-black/20 border-white/10 focus-visible:ring-primary focus-visible:border-primary text-white placeholder:text-white/30 rounded-xl p-4 resize-none shadow-inner" 
                        />
                        <div className="absolute bottom-4 right-4">
                           <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleSpeechInput}
                            disabled={isLoading || isEnhancingPrompt || !('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)}
                            className={`h-10 w-10 rounded-full border border-white/10 bg-black/40 backdrop-blur-md transition-all duration-300 ${isRecording ? 'text-red-500 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse' : 'text-primary hover:bg-primary/20'}`}
                            aria-label={isRecording ? "Stop speech input" : "Start speech input"}
                          >
                            {isRecording ? <LucideMicOff size={18} /> : <LucideMic size={18} />}
                          </Button>
                        </div>
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button
                          type="button"
                          variant="ghost"
                          onClick={handleEnhancePrompt}
                          disabled={isEnhancingPrompt || isLoading || !customizationPrompt.trim()}
                          className="text-xs uppercase tracking-widest text-primary hover:text-primary hover:bg-primary/10"
                      >
                          {isEnhancingPrompt ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Wand2 className="mr-2 h-3 w-3" />}
                          AI Enhance Prompt
                      </Button> 
                    </div>
                </TabsContent>
                 <TabsContent value="manual" className="pt-4 space-y-6">
                   <p className="text-sm text-muted-foreground">
                    {baseImageDataUri 
                        ? "Apply specific changes to the current base image." 
                        : "Define attributes for a new jewelry design."
                    }
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="manualMaterial" className="text-base font-normal">Material</Label>
                      <Select value={manualMaterial} onValueChange={setManualMaterial}>
                        <SelectTrigger id="manualMaterial"><SelectValue placeholder="Select material" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_CHANGE_VALUE}><em>{noChangeText}</em></SelectItem>
                          {materials.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manualMaterialFinish" className="text-base font-normal">Material Finish</Label>
                      <Select value={manualMaterialFinish} onValueChange={setManualMaterialFinish}>
                        <SelectTrigger id="manualMaterialFinish"><SelectValue placeholder="Select finish" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_CHANGE_VALUE}><em>{noChangeText}</em></SelectItem>
                          {materialFinishes.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="manualGemstone" className="text-base font-normal">Gemstone</Label>
                      <Select value={manualGemstone} onValueChange={setManualGemstone}>
                        <SelectTrigger id="manualGemstone"><SelectValue placeholder="Select gemstone" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_CHANGE_VALUE}><em>{noChangeText}</em></SelectItem>
                          {gemstones.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {showGemstoneCut && (
                      <div className="space-y-2">
                        <Label htmlFor="manualGemstoneCut" className="text-base font-normal">Gemstone Cut</Label>
                        <Select value={manualGemstoneCut} onValueChange={setManualGemstoneCut}>
                          <SelectTrigger id="manualGemstoneCut"><SelectValue placeholder="Select cut" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NO_CHANGE_VALUE}><em>{noChangeText}</em></SelectItem>
                            {gemstoneCuts.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manualDesignStyle" className="text-base font-normal">Overall Design Style</Label>
                    <Select value={manualDesignStyle} onValueChange={setManualDesignStyle}>
                      <SelectTrigger id="manualDesignStyle"><SelectValue placeholder="Select style" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_CHANGE_VALUE}><em>{noChangeText}</em></SelectItem>
                        {designStyles.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manualEngraving" className="text-base font-normal">Engraving Text</Label>
                    <Input
                      id="manualEngraving"
                      type="text"
                      value={manualEngraving}
                      onChange={(e) => setManualEngraving(e.target.value)}
                      placeholder="e.g., 'Forever Yours', 'Initials: A&amp;B' (optional)"
                      className="text-base"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="pt-8 mt-8 border-t border-white/5">
              <Button type="submit" disabled={!!submitButtonDisabled} className="w-full h-16 rounded-[1rem] bg-primary text-black hover:bg-primary/90 transition-all font-medium tracking-widest uppercase text-sm shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                {isLoading ? (
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="mr-3 h-5 w-5" />
                )}
                {submitButtonText}
              </Button>
              {baseImageDataUri && (
                <Button variant="ghost" onClick={handleStartOver} className="w-full mt-4 text-xs tracking-widest uppercase text-white/40 hover:text-white hover:bg-white/5">
                  Reset Laboratory
                </Button>
              )}
            </div>
          </form>
        </div>
      </motion.div>

      {(isLoading || customizedImageDataUri || (baseImageDataUri && !baseImageFile) ) && (
         <div className="grid md:grid-cols-2 gap-8 mt-12">
          {baseImageDataUri && !isLoading && !baseImageFile && ( 
            <Card className="animate-in fade-in duration-500">
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><ImageIcon className="mr-2 h-5 w-5 text-muted-foreground"/>Current Base Design</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center items-center p-4 min-h-[300px]">
                <Image src={baseImageDataUri} alt="Base Jewelry for next customization" width={400} height={400} className="rounded-lg object-contain max-h-[400px]" />
              </CardContent>
            </Card>
          )}

          {isLoading && (
            <Card className={`animate-in fade-in duration-500 ${(!baseImageDataUri || baseImageFile) || isLoading ? 'md:col-span-2' : ''}`}>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                    <Sparkles className="mr-2 h-5 w-5 text-primary animate-pulse"/>
                    {baseImageDataUri ? "Refining Design..." : "Generating New Design..."}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col justify-center items-center p-4 min-h-[300px] text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p>AI is working its magic...</p>
                <p>This may take a moment.</p>
              </CardContent>
            </Card>
          )}

          {customizedImageDataUri && !isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 1, 0.25, 1] }}
              className={`rounded-[2rem] border border-primary/20 bg-black/60 backdrop-blur-3xl shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden relative ${(!baseImageDataUri || baseImageFile) && !isLoading ? 'md:col-span-2' : ''}`}
            >
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                 <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" />
              </div>

              <div className="p-8 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                <h3 className="text-2xl font-medium tracking-wide text-white flex items-center">
                  <Sparkles className="mr-3 h-6 w-6 text-primary"/>
                  Output Renderer
                </h3>
                
                {/* Segmented Tab Control */}
                <div className="flex bg-black/60 p-1.5 rounded-full border border-white/10 w-fit backdrop-blur-md">
                  <button 
                    type="button"
                    onClick={() => setPreviewMode("2d")}
                    className={`px-6 py-2 rounded-full text-xs font-semibold tracking-widest uppercase transition-all duration-500 ${previewMode === "2d" ? "bg-primary text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]" : "text-white/50 hover:text-white"}`}
                  >
                    2D Render
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPreviewMode("3d")}
                    className={`px-6 py-2 rounded-full text-xs font-semibold tracking-widest uppercase transition-all duration-500 ${previewMode === "3d" ? "bg-primary text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]" : "text-white/50 hover:text-white"}`}
                  >
                    Interactive 3D
                  </button>
                </div>
              </div>
              
              <div className="p-8 pt-4 relative z-10">
                {previewMode === "2d" ? (
                  <div className="flex flex-col items-center">
                    {/* 2D Mode with Champagne Gold Glare Sweep */}
                    <div className="relative group rounded-lg overflow-hidden border border-white/15 bg-black/40 luxury-glare-container flex justify-center items-center w-full max-w-[400px] aspect-square p-4">
                      <Image 
                        src={customizedImageDataUri} 
                        alt="Customized or Generated Jewelry" 
                        width={400} 
                        height={400} 
                        className="rounded-lg object-contain max-h-[350px] transition-transform duration-700 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
                        <span className="text-xs text-primary tracking-widest uppercase font-light">Hover for sweep glint reflection</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full max-w-[400px]">
                      <Button onClick={handleViewDetails} variant="outline" className="flex-1 border-primary/30 text-primary hover:bg-primary/10 transition-colors" disabled={!customizedImageDataUri || isLoading}>
                        <Eye className="mr-2 h-4 w-4" /> Editorial Details
                      </Button>
                      <Button onClick={handleSaveModel} variant="default" className="flex-grow bg-primary text-black hover:bg-primary/90 transition-shadow hover:shadow-lg hover:shadow-primary/10">
                        Save Model
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {/* 3D Mode with Spline Interactive Embed */}
                    <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] min-h-[350px] max-h-[450px] rounded-lg border border-primary/20 bg-black/60 overflow-hidden shadow-inner flex items-center justify-center">
                      {/* Premium shimmering background skeleton loader */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse pointer-events-none" />
                      
                      {/* @ts-ignore */}
                      <spline-viewer 
                        url={splineUrl} 
                        style={{ display: "block", width: "100%", height: "100%", minHeight: "350px" }} 
                      />
                      
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded border border-white/10 flex items-center gap-1.5 text-[10px] text-primary uppercase tracking-widest pointer-events-none">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                        WebGL Active
                      </div>
                    </div>
                    
                    {/* Instructions and Custom spline code input */}
                    <div className="mt-6 p-5 rounded-lg bg-black/35 border border-primary/15 backdrop-blur-md text-left">
                      <h4 className="text-primary text-xs font-semibold tracking-widest uppercase mb-2 flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" /> Showcase Custom 3D Design
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed mb-4">
                        Bring your bespoke creations to life! Create a ring model in **Spline** (Torus shape gold band, Glass/Refraction gem with Index 2.42), export it via the <strong>Viewer</strong> tab, and paste the <code>scene.splinecode</code> link below to render it instantly.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-2 mt-4">
                        <Input 
                          value={customSplineInput}
                          onChange={(e) => setCustomSplineInput(e.target.value)}
                          placeholder="e.g., https://prod.spline.design/.../scene.splinecode"
                          className="bg-black/60 border border-primary/20 focus-visible:ring-primary text-xs flex-grow h-10"
                        />
                        <Button 
                          type="button"
                          onClick={() => {
                            if (customSplineInput.trim()) {
                              setSplineUrl(customSplineInput.trim());
                              toast({
                                title: "3D Scene Updated",
                                description: "Your custom interactive jewelry model has been loaded successfully!",
                              });
                            } else {
                              toast({
                                title: "Empty URL",
                                description: "Please paste a valid Spline scene URL first.",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="bg-primary text-black hover:bg-primary/95 text-xs px-6 h-10 shrink-0 font-medium tracking-wider uppercase"
                        >
                          Embed 3D
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {imageHistory.length > 0 && !isLoading && (customizedImageDataUri || (baseImageDataUri && !baseImageFile)) && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 1, 0.25, 1] }}
          className="mt-8 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl overflow-hidden"
        >
          <div className="p-6 border-b border-white/5">
            <h3 className="text-lg font-medium tracking-wide text-white flex items-center">
              <History className="mr-3 h-5 w-5 text-white/50" /> Iteration Archive
            </h3>
            <p className="text-sm text-white/40 mt-1 tracking-wide">Select an iteration to restore it to the laboratory.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 p-6">
            {imageHistory.map((historyItem, index) => (
              <button
                key={index}
                title={historyItem.description}
                onClick={() => handleHistoryImageSelect(historyItem)}
                className={`relative group rounded-xl overflow-hidden transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${baseImageDataUri === historyItem.imageUrl ? 'ring-2 ring-primary shadow-[0_0_20px_rgba(212,175,55,0.2)] scale-[1.02]' : 'hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]'}`}
                aria-label={`View design version ${imageHistory.length - index}. Prompt: ${historyItem.description.substring(0, 50)}...`}
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                <Image
                  src={historyItem.imageUrl}
                  alt={`History image ${imageHistory.length - index} - ${historyItem.description.substring(0,30)}...`}
                  width={200}
                  height={200}
                  className="object-contain w-full h-full aspect-square bg-black/40"
                />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
