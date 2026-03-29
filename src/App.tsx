import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera as CameraIcon, 
  Image as ImageIcon, 
  RotateCcw, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  Sun, 
  Contrast, 
  Droplets, 
  Moon,
  Download,
  X,
  ChevronLeft,
  Grid,
  Zap,
  ZapOff,
  Timer,
  RefreshCw,
  Layers,
  Crop,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Plus,
  Minus,
  Hand,
  Pencil,
  Wand2,
  Sparkles,
  Tv,
  Type
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { cn } from './lib/utils';
import { INITIAL_IMAGE_STATE, ImageState, FilterType, getFilterString, Layer } from './lib/filters';

// --- Types ---
type AppMode = 'home' | 'camera' | 'editor' | 'gallery';

interface Photo {
  id: string;
  dataUrl: string;
  timestamp: number;
}

// --- Components ---

export default function App() {
  const [mode, setMode] = useState<AppMode>('home');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [gallery, setGallery] = useState<Photo[]>([]);

  // Load gallery from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('photomaster_gallery');
    if (saved) {
      try {
        setGallery(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load gallery', e);
      }
    }
  }, []);

  const saveToGallery = (dataUrl: string) => {
    const newPhoto: Photo = {
      id: Math.random().toString(36).substring(7),
      dataUrl,
      timestamp: Date.now(),
    };
    const updated = [newPhoto, ...gallery];
    setGallery(updated);
    localStorage.setItem('photomaster_gallery', JSON.stringify(updated));
  };

  const deleteFromGallery = (id: string) => {
    const updated = gallery.filter(p => p.id !== id);
    setGallery(updated);
    localStorage.setItem('photomaster_gallery', JSON.stringify(updated));
  };

  const handleCapture = (dataUrl: string) => {
    setSelectedImage(dataUrl);
    setMode('editor');
  };

  const handleSelectFromGallery = (dataUrl: string) => {
    setSelectedImage(dataUrl);
    setMode('editor');
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500/30">
      <AnimatePresence mode="wait">
        {mode === 'home' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen p-6 space-y-12"
          >
            <div className="text-center space-y-4">
              <motion.h1 
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className="text-6xl font-black tracking-tighter uppercase italic"
              >
                PhotoMaster <span className="text-orange-500">Pro</span>
              </motion.h1>
              <p className="text-zinc-500 max-w-md mx-auto">
                Captura, edita y crea obras maestras con herramientas de nivel profesional.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
              <button 
                onClick={() => setMode('camera')}
                className="group relative h-64 bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 hover:border-orange-500/50 transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative h-full flex flex-col items-center justify-center space-y-4">
                  <div className="p-4 bg-zinc-800 rounded-2xl group-hover:scale-110 transition-transform">
                    <CameraIcon size={48} className="text-orange-500" />
                  </div>
                  <span className="text-xl font-bold uppercase tracking-widest">Cámara</span>
                </div>
              </button>

              <button 
                onClick={() => setMode('gallery')}
                className="group relative h-64 bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 hover:border-orange-500/50 transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative h-full flex flex-col items-center justify-center space-y-4">
                  <div className="p-4 bg-zinc-800 rounded-2xl group-hover:scale-110 transition-transform">
                    <ImageIcon size={48} className="text-orange-500" />
                  </div>
                  <span className="text-xl font-bold uppercase tracking-widest">Galería</span>
                </div>
              </button>
            </div>

            {gallery.length > 0 && (
              <div className="w-full max-w-2xl space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Recientes</h2>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {gallery.slice(0, 5).map((photo) => (
                    <img 
                      key={photo.id}
                      src={photo.dataUrl}
                      alt="Recent"
                      className="h-24 w-24 object-cover rounded-xl border border-zinc-800 hover:border-orange-500 cursor-pointer transition-colors"
                      onClick={() => handleSelectFromGallery(photo.dataUrl)}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {mode === 'camera' && (
          <CameraModule 
            onCapture={handleCapture} 
            onBack={() => setMode('home')} 
          />
        )}

        {mode === 'editor' && selectedImage && (
          <EditorModule 
            image={selectedImage} 
            onSave={(dataUrl) => {
              saveToGallery(dataUrl);
              setMode('gallery');
            }}
            onBack={() => setMode('home')}
          />
        )}

        {mode === 'gallery' && (
          <GalleryModule 
            photos={gallery} 
            onSelect={handleSelectFromGallery}
            onDelete={deleteFromGallery}
            onBack={() => setMode('home')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Camera Module ---
function CameraModule({ onCapture, onBack }: { onCapture: (url: string) => void, onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [showGrid, setShowGrid] = useState(false);
  const [flash, setFlash] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const startCamera = useCallback(async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [facingMode]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0);
        onCapture(canvas.toDataURL('image/jpeg', 0.9));
      }
    }
  };

  const handleCaptureClick = () => {
    if (timer > 0) {
      setIsCountingDown(true);
      setCountdown(timer);
      let count = timer;
      const interval = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count === 0) {
          clearInterval(interval);
          setIsCountingDown(false);
          capture();
        }
      }, 1000);
    } else {
      capture();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black flex flex-col"
    >
      {/* Top Bar */}
      <div className="p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center space-x-6">
          <button onClick={() => setFlash(!flash)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            {flash ? <Zap size={20} className="text-yellow-400" /> : <ZapOff size={20} />}
          </button>
          <button onClick={() => setShowGrid(!showGrid)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Grid size={20} className={showGrid ? "text-orange-500" : ""} />
          </button>
          <button 
            onClick={() => setTimer(timer === 0 ? 3 : timer === 3 ? 10 : 0)} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center space-x-1"
          >
            <Timer size={20} className={timer > 0 ? "text-orange-500" : ""} />
            {timer > 0 && <span className="text-xs font-bold">{timer}s</span>}
          </button>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Viewport */}
      <div className="relative flex-1 bg-zinc-900 overflow-hidden flex items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className={cn(
            "h-full w-full object-cover",
            facingMode === 'user' && "scale-x-[-1]"
          )}
        />
        
        {showGrid && (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="border border-white/10" />
            ))}
          </div>
        )}

        {isCountingDown && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <motion.span 
              key={countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-9xl font-black italic"
            >
              {countdown}
            </motion.span>
          </div>
        )}

        {flash && (
          <div className="absolute inset-0 bg-white opacity-0 animate-flash pointer-events-none" />
        )}
      </div>

      {/* Bottom Bar */}
      <div className="p-8 flex items-center justify-around bg-black">
        <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden">
          {/* Last photo thumbnail could go here */}
        </div>
        
        <button 
          onClick={handleCaptureClick}
          className="relative group"
        >
          <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1">
            <div className="w-full h-full bg-white rounded-full group-active:scale-90 transition-transform" />
          </div>
        </button>

        <button 
          onClick={() => setFacingMode(facingMode === 'user' ? 'environment' : 'user')}
          className="p-4 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"
        >
          <RefreshCw size={24} />
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}

// --- Editor Module ---
function EditorModule({ image, onSave, onBack }: { image: string, onSave: (url: string) => void, onBack: () => void }) {
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: 'base',
      name: 'Base',
      type: 'image',
      image: image,
      state: INITIAL_IMAGE_STATE,
      zIndex: 0
    },
    {
      id: 'drawing-1',
      name: 'Dibujo 1',
      type: 'drawing',
      state: {
        ...INITIAL_IMAGE_STATE,
        paths: [],
        fontSize: 5,
        fontColor: '#ffffff',
        brushMode: 'normal'
      },
      zIndex: 1
    }
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string>('drawing-1');
  const [activeTab, setActiveTab] = useState<'adjust' | 'filters' | 'tools' | 'layers' | 'draw' | 'text'>('draw');
  const [isDragging, setIsDragging] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentPath, setCurrentPath] = useState<{ x: number, y: number }[]>([]);
  const [viewScale, setViewScale] = useState(1);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const baseImageDataRef = useRef<ImageData | null>(null);

  const activeLayer = layers.find(l => l.id === activeLayerId) || layers[0];

  const updateActiveLayer = (updates: Partial<ImageState>) => {
    setLayers(prev => prev.map(l => 
      l.id === activeLayerId ? { ...l, state: { ...l.state, ...updates } } : l
    ));
  };

  const render = useCallback(async () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load all images first
    const imagesToLoad = layers.map(l => l.image).filter((src): src is string => !!src);
    for (const src of imagesToLoad) {
      if (!imageCache.current.has(src)) {
        const img = new Image();
        img.src = src;
        await new Promise(resolve => img.onload = resolve);
        imageCache.current.set(src, img);
      }
    }

    // Set canvas size based on first image layer
    const firstImageLayer = layers.find(l => l.type === 'image' && l.image);
    const baseImg = firstImageLayer ? imageCache.current.get(firstImageLayer.image!) : null;
    if (baseImg) {
      const isVertical = firstImageLayer!.state.rotation % 180 !== 0;
      canvas.width = isVertical ? baseImg.height : baseImg.width;
      canvas.height = isVertical ? baseImg.width : baseImg.height;
    } else {
      // Fallback size if no image layers exist
      canvas.width = 1080;
      canvas.height = 1080;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw layers in order
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
    
    for (const layer of sortedLayers) {
      if (!layer.state.visible) continue;
      
      ctx.save();
      ctx.globalAlpha = layer.state.opacity / 100;
      
      if (layer.type === 'effect') {
        // Effect layers apply to what's already on the canvas globally
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(canvas, 0, 0);
          
          // Clear entire canvas for global effect
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          
          // Apply Blur
          if (layer.state.blur && layer.state.blur > 0) {
            ctx.filter = `blur(${layer.state.blur}px)`;
          }
          
          // Apply Chromatic Aberration (simple offset draw)
          if (layer.state.chromaticAberration && layer.state.chromaticAberration > 0) {
            const offset = layer.state.chromaticAberration;
            ctx.globalAlpha = 0.5;
            ctx.drawImage(tempCanvas, -offset, 0);
            ctx.drawImage(tempCanvas, offset, 0);
            ctx.globalAlpha = 1.0;
          } else {
            ctx.drawImage(tempCanvas, 0, 0);
          }

          // Apply Distortion Effects (Ripple/Swirl)
          if ((layer.state.ripple && layer.state.ripple > 0) || (layer.state.swirl && layer.state.swirl !== 0)) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const sourceData = new Uint8ClampedArray(imageData.data);
            const width = canvas.width;
            const height = canvas.height;
            const ripple = layer.state.ripple || 0;
            const swirl = (layer.state.swirl || 0) / 100; // intensity
            const centerX = width / 2;
            const centerY = height / 2;
            const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                let sx = x;
                let sy = y;

                // Apply Ripple
                if (ripple > 0) {
                  sx += Math.sin(y / 20) * ripple;
                  sy += Math.cos(x / 20) * ripple;
                }

                // Apply Swirl
                if (swirl !== 0) {
                  const dx = sx - centerX;
                  const dy = sy - centerY;
                  const distance = Math.sqrt(dx * dx + dy * dy);
                  if (distance < maxRadius) {
                    const angle = Math.atan2(dy, dx) + swirl * (1 - distance / maxRadius);
                    sx = centerX + distance * Math.cos(angle);
                    sy = centerY + distance * Math.sin(angle);
                  }
                }

                if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
                  const si = (Math.floor(sy) * width + Math.floor(sx)) * 4;
                  const di = (y * width + x) * 4;
                  imageData.data[di] = sourceData[si];
                  imageData.data[di+1] = sourceData[si+1];
                  imageData.data[di+2] = sourceData[si+2];
                  imageData.data[di+3] = sourceData[si+3];
                }
              }
            }
            ctx.putImageData(imageData, 0, 0);
          }

          // Apply Pixelate
          if (layer.state.pixelate && layer.state.pixelate > 0) {
            const size = layer.state.pixelate;
            const w = canvas.width;
            const h = canvas.height;
            const imageData = ctx.getImageData(0, 0, w, h);
            const data = imageData.data;

            for (let y = 0; y < h; y += size) {
              for (let x = 0; x < w; x += size) {
                const i = (y * w + x) * 4;
                const r = data[i];
                const g = data[i+1];
                const b = data[i+2];
                const a = data[i+3];

                for (let py = 0; py < size && y + py < h; py++) {
                  for (let px = 0; px < size && x + px < w; px++) {
                    const pi = ((y + py) * w + (x + px)) * 4;
                    data[pi] = r;
                    data[pi+1] = g;
                    data[pi+2] = b;
                    data[pi+3] = a;
                  }
                }
              }
            }
            ctx.putImageData(imageData, 0, 0);
          }

          // Apply Fisheye
          if (layer.state.fisheye && layer.state.fisheye !== 0) {
            const strength = layer.state.fisheye / 100;
            const w = canvas.width;
            const h = canvas.height;
            const imageData = ctx.getImageData(0, 0, w, h);
            const sourceData = new Uint8ClampedArray(imageData.data);
            const centerX = w / 2;
            const centerY = h / 2;

            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
                
                if (distance < maxRadius) {
                  const normDist = distance / maxRadius;
                  const factor = strength > 0 
                    ? Math.pow(normDist, 1 + strength) / normDist
                    : Math.pow(normDist, 1 / (1 - strength)) / normDist;
                  
                  const sx = centerX + dx * factor;
                  const sy = centerY + dy * factor;

                  if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
                    const si = (Math.floor(sy) * w + Math.floor(sx)) * 4;
                    const di = (y * w + x) * 4;
                    imageData.data[di] = sourceData[si];
                    imageData.data[di+1] = sourceData[si+1];
                    imageData.data[di+2] = sourceData[si+2];
                    imageData.data[di+3] = sourceData[si+3];
                  }
                }
              }
            }
            ctx.putImageData(imageData, 0, 0);
          }

          // Apply Glitch
          if (layer.state.glitch && layer.state.glitch > 0) {
            const strength = layer.state.glitch;
            const w = canvas.width;
            const h = canvas.height;
            const imageData = ctx.getImageData(0, 0, w, h);
            
            for (let i = 0; i < strength / 5; i++) {
              const x = Math.random() * w;
              const y = Math.random() * h;
              const sliceW = Math.random() * w * (strength / 100);
              const sliceH = Math.random() * 20;
              const offset = (Math.random() - 0.5) * strength;
              
              const sliceData = ctx.getImageData(x, y, sliceW, sliceH);
              ctx.putImageData(sliceData, x + offset, y);
            }
          }

          // Apply Vignette
          if (layer.state.vignette && layer.state.vignette > 0) {
            const gradient = ctx.createRadialGradient(
              canvas.width / 2, canvas.height / 2, 0,
              canvas.width / 2, canvas.height / 2, Math.sqrt(Math.pow(canvas.width / 2, 2) + Math.pow(canvas.height / 2, 2))
            );
            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(1, `rgba(0,0,0,${layer.state.vignette / 100})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // Apply Noise (optimized tiling)
          if (layer.state.noise && layer.state.noise > 0) {
            const noiseSize = 128;
            const noiseCanvas = document.createElement('canvas');
            noiseCanvas.width = noiseSize;
            noiseCanvas.height = noiseSize;
            const noiseCtx = noiseCanvas.getContext('2d');
            if (noiseCtx) {
              const noiseData = noiseCtx.createImageData(noiseSize, noiseSize);
              for (let i = 0; i < noiseData.data.length; i += 4) {
                const val = Math.random() * 255;
                noiseData.data[i] = val;
                noiseData.data[i+1] = val;
                noiseData.data[i+2] = val;
                noiseData.data[i+3] = 255;
              }
              noiseCtx.putImageData(noiseData, 0, 0);
              
              ctx.save();
              ctx.globalAlpha = layer.state.noise / 100;
              ctx.globalCompositeOperation = 'overlay';
              const pattern = ctx.createPattern(noiseCanvas, 'repeat');
              if (pattern) {
                ctx.fillStyle = pattern;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
              ctx.restore();
            }
          }
          
          ctx.restore();
        }
      } else {
        // Transform for normal layers
        ctx.translate(canvas.width / 2 + layer.state.x, canvas.height / 2 + layer.state.y);
        ctx.rotate((layer.state.rotation * Math.PI) / 180);
        ctx.scale(
          (layer.state.flipX ? -1 : 1) * layer.state.scale, 
          (layer.state.flipY ? -1 : 1) * layer.state.scale
        );

        if (layer.type === 'image' && layer.image) {
        const img = imageCache.current.get(layer.image);
        if (img) {
          // Filters
          let filterString = getFilterString(layer.state);
          
          // Apply Shadows/Highlights via SVG filter if needed
          if ((layer.state.shadows && layer.state.shadows !== 0) || (layer.state.highlights && layer.state.highlights !== 0)) {
            const shadows = layer.state.shadows || 0;
            const highlights = layer.state.highlights || 0;
            
            // Update SVG filter elements directly for this layer
            const shadowFunc = document.getElementById('shadowFuncR');
            const highlightFunc = document.getElementById('highlightFuncR');
            
            if (shadowFunc && highlightFunc) {
              // Shadows: boost low values
              // Highlights: boost high values
              // We use gamma for simplicity
              // Shadows: exponent < 1 boosts shadows, > 1 dims them
              const sExp = 1 - (shadows / 200);
              // Highlights: exponent < 1 boosts highlights, > 1 dims them
              const hExp = 1 - (highlights / 200);
              
              // Update all channels
              ['shadowFuncR', 'shadowFuncG', 'shadowFuncB'].forEach(id => {
                document.getElementById(id)?.setAttribute('exponent', sExp.toString());
              });
              ['highlightFuncR', 'highlightFuncG', 'highlightFuncB'].forEach(id => {
                document.getElementById(id)?.setAttribute('exponent', hExp.toString());
              });
              
              filterString += ' url(#shadowsHighlights)';
            }
          }

          // Apply Sharpness
          if (layer.state.sharpness && layer.state.sharpness > 0) {
            const sharpness = layer.state.sharpness / 100;
            const matrix = `0 -${sharpness} 0 -${sharpness} ${1 + 4 * sharpness} -${sharpness} 0 -${sharpness} 0`;
            document.getElementById('sharpnessMatrix')?.setAttribute('kernelMatrix', matrix);
            filterString += ' url(#sharpness)';
          }

          // Apply Clarity (Local Contrast)
          if (layer.state.clarity && layer.state.clarity > 0) {
            const clarity = layer.state.clarity / 100;
            document.getElementById('clarityBlur')?.setAttribute('stdDeviation', (clarity * 5).toString());
            document.getElementById('clarityMerge')?.setAttribute('slope', (1 + clarity).toString());
            filterString += ' url(#clarity)';
          }
          
          ctx.filter = filterString;
          // Draw
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
          
          // Draw border for active layer
          if (layer.id === activeLayerId) {
            ctx.strokeStyle = '#f97316'; // orange-500
            ctx.lineWidth = 2 / layer.state.scale;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(-img.width / 2, -img.height / 2, img.width, img.height);
          }
        }
        } else if (layer.type === 'text' && layer.state.text) {
        ctx.font = `${layer.state.fontStyle || 'normal'} ${layer.state.fontWeight || 'normal'} ${layer.state.fontSize || 48}px ${layer.state.fontFamily || 'Inter'}`;
        ctx.fillStyle = layer.state.fontColor || '#ffffff';
        ctx.textAlign = layer.state.textAlign || 'center';
        ctx.textBaseline = 'middle';
        
        // Filters also apply to text
        ctx.filter = getFilterString(layer.state);
        
        ctx.fillText(layer.state.text, 0, 0);

        // Draw border for active layer
        if (layer.id === activeLayerId) {
          const metrics = ctx.measureText(layer.state.text);
          const height = layer.state.fontSize || 48;
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 2 / layer.state.scale;
          ctx.setLineDash([5, 5]);
          
          let xOffset = 0;
          if (ctx.textAlign === 'left') xOffset = metrics.width / 2;
          if (ctx.textAlign === 'right') xOffset = -metrics.width / 2;
          
          ctx.strokeRect(-metrics.width / 2 - 10 + xOffset, -height / 2 - 10, metrics.width + 20, height + 20);
        }
        } else if (layer.type === 'drawing' && layer.state.paths) {
        // Filters also apply to drawing
        ctx.filter = getFilterString(layer.state);
        
        for (const path of layer.state.paths) {
          if (path.points.length < 2) continue;
          ctx.beginPath();
          ctx.strokeStyle = path.color;
          ctx.lineWidth = path.width;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.moveTo(path.points[0].x, path.points[0].y);
          for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x, path.points[i].y);
          }
          ctx.stroke();
        }

        // Draw current path if drawing on this layer
        if (isDrawing && layer.id === activeLayerId && currentPath.length > 1) {
          ctx.beginPath();
          ctx.strokeStyle = activeLayer.state.brushColor || '#ffffff';
          ctx.lineWidth = activeLayer.state.brushWidth || 5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.moveTo(currentPath[0].x, currentPath[0].y);
          for (let i = 1; i < currentPath.length; i++) {
            ctx.lineTo(currentPath[i].x, currentPath[i].y);
          }
          ctx.stroke();
        }

        // Draw border for active layer
        if (layer.id === activeLayerId) {
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 2 / layer.state.scale;
          ctx.setLineDash([5, 5]);
          // For drawing we just draw a box around the canvas area for now
          ctx.strokeRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
        }
      }
      
      ctx.restore();
    }
  }
}, [layers, activeLayerId, isDrawing, currentPath]);

  useEffect(() => {
    render();
  }, [render]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `photomaster-${Date.now()}.jpg`;
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.9);
    link.click();
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    onSave(canvasRef.current.toDataURL('image/jpeg', 0.9));
  };

  const addLayer = (imgUrl: string) => {
    const newLayer: Layer = {
      id: Math.random().toString(36).substring(7),
      name: `Capa ${layers.length + 1}`,
      type: 'image',
      image: imgUrl,
      state: INITIAL_IMAGE_STATE,
      zIndex: layers.length
    };
    setLayers([...layers, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  const addTextLayer = () => {
    const id = Math.random().toString(36).substring(7);
    const newLayer: Layer = {
      id,
      name: `Texto ${layers.length + 1}`,
      type: 'text',
      state: {
        ...INITIAL_IMAGE_STATE,
        text: 'Nuevo Texto',
        fontSize: 120,
        fontColor: '#ffffff',
        fontFamily: 'Inter',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center'
      },
      zIndex: layers.length
    };
    setLayers([...layers, newLayer]);
    setActiveLayerId(id);
    setActiveTab('text');
  };

  const addDrawingLayer = () => {
    const id = Math.random().toString(36).substring(7);
    const newLayer: Layer = {
      id,
      name: `Dibujo ${layers.length + 1}`,
      type: 'drawing',
      state: {
        ...INITIAL_IMAGE_STATE,
        paths: [],
        brushWidth: 5,
        brushColor: '#ffffff',
        brushMode: 'normal'
      },
      zIndex: layers.length
    };
    setLayers([...layers, newLayer]);
    setActiveLayerId(id);
    setActiveTab('draw');
  };

  const addEffectLayer = () => {
    const newLayer: Layer = {
      id: Math.random().toString(36).substring(7),
      name: `Efecto ${layers.length + 1}`,
      type: 'effect',
      state: {
        ...INITIAL_IMAGE_STATE,
        vignette: 0,
        chromaticAberration: 0,
        blur: 0,
        noise: 0
      },
      zIndex: layers.length
    };
    setLayers([...layers, newLayer]);
    setActiveLayerId(newLayer.id);
    setActiveTab('adjust');
  };

  const addPixelateLayer = () => {
    const id = Math.random().toString(36).substring(7);
    const newLayer: Layer = {
      id,
      name: `Pixelar ${layers.length + 1}`,
      type: 'effect',
      state: {
        ...INITIAL_IMAGE_STATE,
        pixelate: 10
      },
      zIndex: layers.length
    };
    setLayers([...layers, newLayer]);
    setActiveLayerId(id);
    setActiveTab('adjust');
  };

  const moveLayer = (id: string, direction: 'up' | 'down') => {
    const index = layers.findIndex(l => l.id === id);
    if (direction === 'up' && index < layers.length - 1) {
      const newLayers = [...layers];
      const temp = newLayers[index].zIndex;
      newLayers[index].zIndex = newLayers[index + 1].zIndex;
      newLayers[index + 1].zIndex = temp;
      setLayers(newLayers.sort((a, b) => a.zIndex - b.zIndex));
    } else if (direction === 'down' && index > 0) {
      const newLayers = [...layers];
      const temp = newLayers[index].zIndex;
      newLayers[index].zIndex = newLayers[index - 1].zIndex;
      newLayers[index - 1].zIndex = temp;
      setLayers(newLayers.sort((a, b) => a.zIndex - b.zIndex));
    }
  };

  const deleteLayer = (id: string) => {
    if (layers.length <= 1) return;
    const updated = layers.filter(l => l.id !== id);
    setLayers(updated);
    if (activeLayerId === id) {
      setActiveLayerId(updated[0].id);
    }
  };

  const duplicateLayer = (id: string) => {
    const layerToDuplicate = layers.find(l => l.id === id);
    if (!layerToDuplicate) return;
    const newLayer: Layer = {
      ...layerToDuplicate,
      id: Math.random().toString(36).substring(7),
      name: `${layerToDuplicate.name} (Copia)`,
      zIndex: layers.length
    };
    setLayers([...layers, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  const centerLayer = () => {
    updateActiveLayer({ x: 0, y: 0 });
  };

  const handleTabChange = (tab: 'adjust' | 'filters' | 'tools' | 'layers' | 'draw' | 'text') => {
    setActiveTab(tab);
    if (tab === 'draw') {
      const drawingLayer = layers.find(l => l.type === 'drawing');
      if (drawingLayer) {
        setActiveLayerId(drawingLayer.id);
      } else {
        addDrawingLayer();
      }
    } else if (tab === 'text') {
      const textLayer = layers.find(l => l.type === 'text');
      if (textLayer) {
        setActiveLayerId(textLayer.id);
      } else {
        addTextLayer();
      }
    }
  };

  const toggleVisibility = (id: string) => {
    setLayers(prev => prev.map(l => 
      l.id === id ? { ...l, state: { ...l.state, visible: !l.state.visible } } : l
    ));
  };

  const resetTransform = () => {
    updateActiveLayer({
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      flipX: false,
      flipY: false
    });
  };

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // 1. Canvas relative coordinates (internal resolution)
    let x = (clientX - rect.left) * (canvas.width / rect.width);
    let y = (clientY - rect.top) * (canvas.height / rect.height);
    
    // 2. Center relative coordinates
    x -= canvas.width / 2;
    y -= canvas.height / 2;
    
    return { x, y };
  };

  const getLocalCoords = (clientX: number, clientY: number) => {
    let { x, y } = getCanvasCoords(clientX, clientY);
    
    // 3. Layer relative coordinates (Inverse transform)
    // Translate
    x -= activeLayer.state.x;
    y -= activeLayer.state.y;
    
    // Rotate (Inverse)
    const angle = (-activeLayer.state.rotation * Math.PI) / 180;
    const rx = x * Math.cos(angle) - y * Math.sin(angle);
    const ry = x * Math.sin(angle) + y * Math.cos(angle);
    
    // Scale (Inverse)
    const sx = rx / (activeLayer.state.scale * (activeLayer.state.flipX ? -1 : 1));
    const sy = ry / (activeLayer.state.scale * (activeLayer.state.flipY ? -1 : 1));
    
    return { x: sx, y: sy };
  };

  const getSmartCoords = (x: number, y: number) => {
    if (!baseImageDataRef.current || activeLayer.state.brushMode !== 'rotoscopia') return { x, y };

    const data = baseImageDataRef.current.data;
    const width = baseImageDataRef.current.width;
    const height = baseImageDataRef.current.height;
    const radius = activeLayer.state.brushRadius || 15;
    const invert = activeLayer.state.brushInvert;
    
    // Map local layer coords to canvas coords (center-relative)
    // Since we want to snap to the BASE image edges, we should ideally map to base local coords.
    // But for simplicity, let's assume the base image defines the canvas size and is roughly centered.
    
    const px = Math.floor(x + width / 2);
    const py = Math.floor(y + height / 2);

    let bestX = x;
    let bestY = y;
    let bestGrad = invert ? Infinity : -1;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const cx = px + dx;
        const cy = py + dy;

        if (cx >= 1 && cx < width - 1 && cy >= 1 && cy < height - 1) {
          const idx = (cy * width + cx) * 4;
          
          // Simple luminance
          const l = (data[idx] * 299 + data[idx+1] * 587 + data[idx+2] * 114) / 1000;
          
          // Gradient magnitude (Sobel-ish)
          const idxR = (cy * width + (cx + 1)) * 4;
          const idxL = (cy * width + (cx - 1)) * 4;
          const idxD = ((cy + 1) * width + cx) * 4;
          const idxU = ((cy - 1) * width + cx) * 4;
          
          const lR = (data[idxR] * 299 + data[idxR+1] * 587 + data[idxR+2] * 114) / 1000;
          const lL = (data[idxL] * 299 + data[idxL+1] * 587 + data[idxL+2] * 114) / 1000;
          const lD = (data[idxD] * 299 + data[idxD+1] * 587 + data[idxD+2] * 114) / 1000;
          const lU = (data[idxU] * 299 + data[idxU+1] * 587 + data[idxU+2] * 114) / 1000;
          
          const gradX = lR - lL;
          const gradY = lD - lU;
          const grad = Math.sqrt(gradX * gradX + gradY * gradY);

          if (invert) {
            if (grad < bestGrad) {
              bestGrad = grad;
              bestX = cx - width / 2;
              bestY = cy - height / 2;
            }
          } else {
            if (grad > bestGrad) {
              bestGrad = grad;
              bestX = cx - width / 2;
              bestY = cy - height / 2;
            }
          }
        }
      }
    }

    // Blend to avoid extreme jumps
    return {
      x: x * 0.6 + bestX * 0.4,
      y: y * 0.6 + bestY * 0.4
    };
  };

  const captureBaseImageData = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const baseLayer = layers.find(l => l.type === 'image');
    if (!baseLayer || !baseLayer.image) return;

    const img = imageCache.current.get(baseLayer.image);
    if (!img) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tctx = tempCanvas.getContext('2d');
    if (!tctx) return;

    tctx.save();
    tctx.translate(tempCanvas.width / 2 + baseLayer.state.x, tempCanvas.height / 2 + baseLayer.state.y);
    tctx.rotate((baseLayer.state.rotation * Math.PI) / 180);
    tctx.scale(
      (baseLayer.state.flipX ? -1 : 1) * baseLayer.state.scale, 
      (baseLayer.state.flipY ? -1 : 1) * baseLayer.state.scale
    );
    tctx.drawImage(img, -img.width / 2, -img.height / 2);
    tctx.restore();

    baseImageDataRef.current = tctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    setMousePos({ x: clientX, y: clientY });

    if (isPanning || (e as React.MouseEvent).button === 1) {
      setIsDragging(true);
      setPanStart({
        x: clientX - viewOffset.x,
        y: clientY - viewOffset.y
      });
      return;
    }

    if (activeLayer.type === 'drawing') {
      if (activeLayer.state.brushMode === 'rotoscopia') {
        captureBaseImageData();
      }
      setIsDrawing(true);
      const { x, y } = getLocalCoords(clientX, clientY);
      const smart = getSmartCoords(x, y);
      setCurrentPath([smart]);
    } else {
      setIsDragging(true);
      const { x, y } = getCanvasCoords(clientX, clientY);
      setDragStart({
        x: x - activeLayer.state.x,
        y: y - activeLayer.state.y
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    setMousePos({ x: clientX, y: clientY });

    if (isDragging && (isPanning || (e as React.MouseEvent).button === 1)) {
      setViewOffset({
        x: clientX - panStart.x,
        y: clientY - panStart.y
      });
      return;
    }

    if (isDrawing) {
      const { x, y } = getLocalCoords(clientX, clientY);
      const smart = getSmartCoords(x, y);
      setCurrentPath(prev => [...prev, smart]);
    } else if (isDragging) {
      const { x, y } = getCanvasCoords(clientX, clientY);
      updateActiveLayer({
        x: x - dragStart.x,
        y: y - dragStart.y
      });
    }
  };

  const handleCanvasMouseUp = () => {
    if (isDrawing) {
      const newPath = {
        points: currentPath,
        color: activeLayer.state.brushColor || '#ffffff',
        width: activeLayer.state.brushWidth || 5,
        mode: activeLayer.state.brushMode || 'normal'
      };
      setLayers(prev => prev.map(l => 
        l.id === activeLayerId ? { ...l, state: { ...l.state, paths: [...(l.state.paths || []), newPath] } } : l
      ));
      setIsDrawing(false);
      setCurrentPath([]);
      baseImageDataRef.current = null;
    }
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      const delta = -e.deltaY;
      const factor = delta > 0 ? 1.1 : 0.9;
      const newScale = Math.min(Math.max(viewScale * factor, 0.1), 10);
      
      // Zoom towards cursor
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;
        
        const dx = (mouseX - viewOffset.x) * (factor - 1);
        const dy = (mouseY - viewOffset.y) * (factor - 1);
        
        setViewOffset(prev => ({
          x: prev.x - dx,
          y: prev.y - dy
        }));
      }
      
      setViewScale(newScale);
    } else {
      setViewOffset(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsPanning(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const handleWindowMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        setMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    };

    if (activeTab === 'draw') {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('touchmove', handleWindowTouchMove);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('touchmove', handleWindowTouchMove);
    };
  }, [activeTab]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black flex flex-col"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-800">
        <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
          <X size={24} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-xs font-black uppercase tracking-[0.3em]">Editor</span>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{activeLayer.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={addTextLayer} 
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-orange-500"
            title="Añadir Capa de Texto"
          >
            <Type size={20} />
          </button>
          <button 
            onClick={addDrawingLayer} 
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-orange-500"
            title="Añadir Capa de Dibujo"
          >
            <Pencil size={20} />
          </button>
          <button onClick={handleDownload} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <Download size={20} />
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-orange-500 rounded-full text-sm font-bold hover:bg-orange-600 transition-colors">
            Guardar
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={containerRef}
        onWheel={handleWheel}
        className="flex-1 relative bg-zinc-950 flex items-center justify-center p-4 overflow-hidden"
      >
        <canvas 
          ref={canvasRef} 
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onTouchStart={handleCanvasMouseDown}
          onTouchMove={handleCanvasMouseMove}
          onTouchEnd={handleCanvasMouseUp}
          style={{
            transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${viewScale})`,
            transformOrigin: 'center center',
          }}
          className={cn(
            "max-w-full max-h-full object-contain shadow-2xl shadow-black transition-transform duration-75",
            isPanning ? "cursor-grab active:cursor-grabbing" : (activeLayer.state.brushMode === 'rotoscopia' ? "cursor-crosshair" : "cursor-move")
          )}
        />

        {/* Brush Preview */}
        {activeTab === 'draw' && !isPanning && (
          <div 
            className="pointer-events-none fixed z-[100] border-2 border-white/50 rounded-full mix-blend-difference"
            style={{
              left: mousePos.x,
              top: mousePos.y,
              width: (activeLayer.state.brushMode === 'rotoscopia' ? (activeLayer.state.brushRadius || 15) * 2 : (activeLayer.state.brushWidth || 5)) * viewScale,
              height: (activeLayer.state.brushMode === 'rotoscopia' ? (activeLayer.state.brushRadius || 15) * 2 : (activeLayer.state.brushWidth || 5)) * viewScale,
              transform: 'translate(-50%, -50%)',
              boxShadow: activeLayer.state.brushMode === 'rotoscopia' ? '0 0 10px rgba(249, 115, 22, 0.5)' : 'none',
              borderColor: activeLayer.state.brushMode === 'rotoscopia' ? '#f97316' : 'white'
            }}
          />
        )}

        {/* Zoom & Pan Controls */}
        <div className="absolute bottom-6 right-6 flex flex-col items-center space-y-3 z-50">
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-full p-1 flex flex-col items-center shadow-2xl">
            <button 
              onClick={() => setViewScale(prev => Math.min(prev * 1.2, 10))}
              className="p-3 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
              title="Zoom In"
            >
              <Plus size={20} />
            </button>
            <div className="h-px w-6 bg-zinc-800 my-1" />
            <button 
              onClick={() => { setViewScale(1); setViewOffset({ x: 0, y: 0 }); }}
              className="px-3 py-2 hover:bg-zinc-800 rounded-lg transition-colors text-[10px] font-black text-zinc-500 hover:text-white"
              title="Reset Zoom"
            >
              {Math.round(viewScale * 100)}%
            </button>
            <div className="h-px w-6 bg-zinc-800 my-1" />
            <button 
              onClick={() => setViewScale(prev => Math.max(prev * 0.8, 0.1))}
              className="p-3 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
              title="Zoom Out"
            >
              <Minus size={20} />
            </button>
          </div>
          
          <button 
            onClick={() => setIsPanning(!isPanning)}
            className={cn(
              "p-4 rounded-full transition-all shadow-xl border",
              isPanning 
                ? "bg-orange-500 border-orange-400 text-white" 
                : "bg-zinc-900/80 backdrop-blur-xl border-zinc-800 text-zinc-400 hover:text-white"
            )}
            title="Hand Tool (Space)"
          >
            <Hand size={24} />
          </button>
        </div>

        {/* Status Bar */}
        <div className="absolute bottom-6 left-6 flex items-center space-x-3">
          <div className="px-4 py-2 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-400 shadow-xl flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>Zoom: {Math.round(viewScale * 100)}%</span>
          </div>
          {isPanning && (
            <div className="px-4 py-2 bg-orange-500/20 backdrop-blur-xl border border-orange-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-orange-400 shadow-xl">
              Modo Paneo Activo
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-zinc-900 border-t border-zinc-800">
        {/* Tab Content */}
        <div className="p-6 h-48 overflow-y-auto">
          {activeTab === 'draw' && (
            <div className="space-y-6">
              {activeLayer.type !== 'drawing' ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-8 bg-zinc-800/50 rounded-2xl border border-dashed border-zinc-700">
                  <Pencil size={32} className="text-zinc-600" />
                  <div className="text-center">
                    <p className="text-sm font-bold uppercase tracking-widest text-zinc-400">No hay capa de dibujo activa</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Crea una nueva capa para empezar a dibujar</p>
                  </div>
                  <button 
                    onClick={addDrawingLayer}
                    className="px-6 py-2 bg-orange-500 hover:bg-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    Añadir Capa de Dibujo
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Herramientas de Dibujo</span>
                    <button 
                      onClick={() => updateActiveLayer({ paths: [] })}
                      className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-colors"
                    >
                      Limpiar Capa
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Modo de Pincel</label>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => updateActiveLayer({ brushMode: 'normal' })}
                            className={cn(
                              "flex-1 py-2 rounded-xl border flex items-center justify-center space-x-2 transition-all",
                              activeLayer.state.brushMode !== 'rotoscopia' ? "bg-orange-500 border-orange-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400"
                            )}
                          >
                            <Pencil size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Normal</span>
                          </button>
                          <button 
                            onClick={() => updateActiveLayer({ brushMode: 'rotoscopia' })}
                            className={cn(
                              "flex-1 py-2 rounded-xl border flex items-center justify-center space-x-2 transition-all",
                              activeLayer.state.brushMode === 'rotoscopia' ? "bg-orange-500 border-orange-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400"
                            )}
                          >
                            <Wand2 size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Rotoscopia</span>
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Color del Pincel</label>
                        <div className="flex flex-wrap gap-2">
                          {['#ffffff', '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'].map(color => (
                            <button
                              key={color}
                              onClick={() => updateActiveLayer({ brushColor: color })}
                              className={cn(
                                "w-8 h-8 rounded-full border-2 transition-transform",
                                activeLayer.state.brushColor === color ? "border-orange-500 scale-110" : "border-zinc-700"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                          <input 
                            type="color"
                            value={activeLayer.state.brushColor}
                            onChange={(e) => updateActiveLayer({ brushColor: e.target.value })}
                            className="w-8 h-8 bg-zinc-800 border-2 border-zinc-700 rounded-full p-0 cursor-pointer overflow-hidden"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <ControlSlider 
                        icon={<Pencil size={16} />} 
                        label="Grosor" 
                        value={activeLayer.state.brushWidth || 5} 
                        min={1} max={50} 
                        onChange={(v: number) => updateActiveLayer({ brushWidth: v })} 
                      />
                      <ControlSlider 
                        icon={<Layers size={16} />} 
                        label="Opacidad Trazo" 
                        value={activeLayer.state.opacity} 
                        min={0} max={100} 
                        onChange={(v: number) => updateActiveLayer({ opacity: v })} 
                      />
                      {activeLayer.state.brushMode === 'rotoscopia' && (
                        <>
                          <ControlSlider 
                            icon={<Wand2 size={16} />} 
                            label="Radio Detección" 
                            value={activeLayer.state.brushRadius || 15} 
                            min={5} max={50} 
                            onChange={(v: number) => updateActiveLayer({ brushRadius: v })} 
                          />
                          <div className="flex items-center justify-between pt-2 p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Invertir Detección</span>
                              <span className="text-[8px] text-zinc-600 uppercase font-bold">
                                {activeLayer.state.brushInvert ? "Ajustar a zonas suaves" : "Ajustar a bordes"}
                              </span>
                            </div>
                            <button 
                              onClick={() => updateActiveLayer({ brushInvert: !activeLayer.state.brushInvert })}
                              className={cn(
                                "w-10 h-5 rounded-full transition-all relative shadow-inner",
                                activeLayer.state.brushInvert ? "bg-orange-500" : "bg-zinc-700"
                              )}
                            >
                              <div className={cn(
                                "absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-md",
                                activeLayer.state.brushInvert ? "left-6" : "left-1"
                              )} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-6">
              {activeLayer.type !== 'text' ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-8 bg-zinc-800/50 rounded-2xl border border-dashed border-zinc-700">
                  <Type size={32} className="text-zinc-600" />
                  <div className="text-center">
                    <p className="text-sm font-bold uppercase tracking-widest text-zinc-400">No hay capa de texto activa</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Crea una nueva capa de texto para añadir tipografía</p>
                  </div>
                  <button 
                    onClick={addTextLayer}
                    className="px-6 py-2 bg-orange-500 hover:bg-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    Añadir Capa de Texto
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Contenido del Texto</label>
                    <input 
                      type="text"
                      value={activeLayer.state.text}
                      onChange={(e) => updateActiveLayer({ text: e.target.value })}
                      className="w-full bg-zinc-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Color</label>
                      <input 
                        type="color"
                        value={activeLayer.state.fontColor}
                        onChange={(e) => updateActiveLayer({ fontColor: e.target.value })}
                        className="w-full h-10 bg-zinc-800 border-none rounded-xl p-1 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Tamaño</label>
                      <input 
                        type="number"
                        value={activeLayer.state.fontSize}
                        onChange={(e) => updateActiveLayer({ fontSize: Number(e.target.value) })}
                        className="w-full h-10 bg-zinc-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Fuente</label>
                    <select 
                      value={activeLayer.state.fontFamily}
                      onChange={(e) => updateActiveLayer({ fontFamily: e.target.value })}
                      className="w-full bg-zinc-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="Inter">Inter</option>
                      <option value="'Space Grotesk'">Space Grotesk</option>
                      <option value="'Playfair Display'">Playfair Display</option>
                      <option value="'JetBrains Mono'">JetBrains Mono</option>
                      <option value="serif">Serif</option>
                      <option value="monospace">Monospace</option>
                      <option value="cursive">Cursive</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Grosor</label>
                      <select 
                        value={activeLayer.state.fontWeight}
                        onChange={(e) => updateActiveLayer({ fontWeight: e.target.value })}
                        className="w-full bg-zinc-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Negrita</option>
                        <option value="100">Fino</option>
                        <option value="900">Black</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Estilo</label>
                      <select 
                        value={activeLayer.state.fontStyle}
                        onChange={(e) => updateActiveLayer({ fontStyle: e.target.value })}
                        className="w-full bg-zinc-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="normal">Normal</option>
                        <option value="italic">Cursiva</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Alineación</label>
                    <div className="flex space-x-2">
                      {['left', 'center', 'right'].map((align) => (
                        <button
                          key={align}
                          onClick={() => updateActiveLayer({ textAlign: align as any })}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeLayer.state.textAlign === align 
                              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                          }`}
                        >
                          {align === 'left' ? 'Izquierda' : align === 'center' ? 'Centro' : 'Derecha'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'adjust' && (
            <div className="space-y-6">
              {activeLayer.type === 'effect' && (
                <div className="space-y-4">
                  <ControlSlider 
                    icon={<Sparkles size={16} />} 
                    label="Viñeta" 
                    value={activeLayer.state.vignette || 0} 
                    min={0} max={100} 
                    onChange={(v: number) => updateActiveLayer({ vignette: v })} 
                  />
                  <ControlSlider 
                    icon={<Tv size={16} />} 
                    label="Aberración Cromática" 
                    value={activeLayer.state.chromaticAberration || 0} 
                    min={0} max={50} 
                    onChange={(v: number) => updateActiveLayer({ chromaticAberration: v })} 
                  />
                  <ControlSlider 
                    icon={<Layers size={16} />} 
                    label="Desenfoque" 
                    value={activeLayer.state.blur || 0} 
                    min={0} max={20} 
                    onChange={(v: number) => updateActiveLayer({ blur: v })} 
                  />
                  <ControlSlider 
                    icon={<Sparkles size={16} />} 
                    label="Ruido" 
                    value={activeLayer.state.noise || 0} 
                    min={0} max={100} 
                    onChange={(v: number) => updateActiveLayer({ noise: v })} 
                  />
                  <div className="pt-4 border-t border-zinc-800 space-y-4">
                    <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Distorsión</label>
                    <ControlSlider 
                      icon={<RefreshCw size={16} />} 
                      label="Ondulación" 
                      value={activeLayer.state.ripple || 0} 
                      min={0} max={50} 
                      onChange={(v: number) => updateActiveLayer({ ripple: v })} 
                    />
                    <ControlSlider 
                      icon={<RotateCw size={16} />} 
                      label="Remolino" 
                      value={activeLayer.state.swirl || 0} 
                      min={-100} max={100} 
                      onChange={(v: number) => updateActiveLayer({ swirl: v })} 
                    />
                    <ControlSlider 
                      icon={<Grid size={16} />} 
                      label="Pixelar" 
                      value={activeLayer.state.pixelate || 0} 
                      min={0} max={50} 
                      onChange={(v: number) => updateActiveLayer({ pixelate: v })} 
                    />
                    <ControlSlider 
                      icon={<Eye size={16} />} 
                      label="Ojo de Pez" 
                      value={activeLayer.state.fisheye || 0} 
                      min={-100} max={100} 
                      onChange={(v: number) => updateActiveLayer({ fisheye: v })} 
                    />
                    <ControlSlider 
                      icon={<Zap size={16} />} 
                      label="Glitch" 
                      value={activeLayer.state.glitch || 0} 
                      min={0} max={100} 
                      onChange={(v: number) => updateActiveLayer({ glitch: v })} 
                    />
                    <button 
                      onClick={() => updateActiveLayer({
                        vignette: 0,
                        chromaticAberration: 0,
                        blur: 0,
                        noise: 0,
                        ripple: 0,
                        swirl: 0,
                        pixelate: 0,
                        fisheye: 0,
                        glitch: 0
                      })}
                      className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors mt-4"
                    >
                      Restablecer Efectos
                    </button>
                  </div>
                </div>
              )}
              {activeLayer.type === 'drawing' && (
                <div className="space-y-4 pb-4 border-b border-zinc-800">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Color Pincel</label>
                      <input 
                        type="color"
                        value={activeLayer.state.fontColor}
                        onChange={(e) => updateActiveLayer({ fontColor: e.target.value })}
                        className="w-full h-10 bg-zinc-800 border-none rounded-xl p-1 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Grosor</label>
                      <input 
                        type="number"
                        value={activeLayer.state.fontSize}
                        onChange={(e) => updateActiveLayer({ fontSize: Number(e.target.value) })}
                        className="w-full h-10 bg-zinc-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => updateActiveLayer({ paths: [] })}
                    className="w-full py-2 bg-red-500/10 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-colors"
                  >
                    Borrar Dibujo
                  </button>
                </div>
              )}
              <ControlSlider 
                icon={<Sun size={16} />} 
                label="Brillo" 
                value={activeLayer.state.brightness} 
                min={0} max={200} 
                onChange={(v: number) => updateActiveLayer({ brightness: v })} 
              />
              <ControlSlider 
                icon={<Zap size={16} />} 
                label="Exposición" 
                value={activeLayer.state.exposure} 
                min={0} max={200} 
                onChange={(v: number) => updateActiveLayer({ exposure: v })} 
              />
              <ControlSlider 
                icon={<Contrast size={16} />} 
                label="Contraste" 
                value={activeLayer.state.contrast} 
                min={0} max={200} 
                onChange={(v: number) => updateActiveLayer({ contrast: v })} 
              />
              <ControlSlider 
                icon={<Droplets size={16} />} 
                label="Saturación" 
                value={activeLayer.state.saturation} 
                min={0} max={200} 
                onChange={(v: number) => updateActiveLayer({ saturation: v })} 
              />
              <div className="grid grid-cols-2 gap-4">
                <ControlSlider 
                  icon={<Sun size={16} />} 
                  label="Calidez" 
                  value={activeLayer.state.warmth} 
                  min={-100} max={100} 
                  onChange={(v: number) => updateActiveLayer({ warmth: v })} 
                />
                <ControlSlider 
                  icon={<Droplets size={16} />} 
                  label="Tinte" 
                  value={activeLayer.state.tint} 
                  min={-100} max={100} 
                  onChange={(v: number) => updateActiveLayer({ tint: v })} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ControlSlider 
                  icon={<Zap size={16} />} 
                  label="Nitidez" 
                  value={activeLayer.state.sharpness} 
                  min={0} max={100} 
                  onChange={(v: number) => updateActiveLayer({ sharpness: v })} 
                />
                <ControlSlider 
                  icon={<Sparkles size={16} />} 
                  label="Claridad" 
                  value={activeLayer.state.clarity} 
                  min={0} max={100} 
                  onChange={(v: number) => updateActiveLayer({ clarity: v })} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ControlSlider 
                  icon={<Moon size={16} />} 
                  label="Sombras" 
                  value={activeLayer.state.shadows} 
                  min={-100} max={100} 
                  onChange={(v: number) => updateActiveLayer({ shadows: v })} 
                />
                <ControlSlider 
                  icon={<Sparkles size={16} />} 
                  label="Altas Luces" 
                  value={activeLayer.state.highlights} 
                  min={-100} max={100} 
                  onChange={(v: number) => updateActiveLayer({ highlights: v })} 
                />
              </div>
              <ControlSlider 
                icon={<Layers size={16} />} 
                label="Opacidad" 
                value={activeLayer.state.opacity} 
                min={0} max={100} 
                onChange={(v: number) => updateActiveLayer({ opacity: v })} 
              />
              <div className="pt-4 border-t border-zinc-800 space-y-6">
                <ControlSlider 
                  icon={<Plus size={16} />} 
                  label="Escala" 
                  value={activeLayer.state.scale} 
                  min={0.1} max={5} step={0.1}
                  onChange={(v: number) => updateActiveLayer({ scale: v })} 
                />
                <div className="grid grid-cols-2 gap-4">
                  <ControlSlider 
                    icon={<Plus size={16} />} 
                    label="Pos X" 
                    value={activeLayer.state.x} 
                    min={-1000} max={1000} 
                    onChange={(v: number) => updateActiveLayer({ x: v })} 
                  />
                  <ControlSlider 
                    icon={<Plus size={16} />} 
                    label="Pos Y" 
                    value={activeLayer.state.y} 
                    min={-1000} max={1000} 
                    onChange={(v: number) => updateActiveLayer({ y: v })} 
                  />
                </div>
                <button 
                  onClick={() => updateActiveLayer({
                    brightness: 100,
                    contrast: 100,
                    saturation: 100,
                    exposure: 100,
                    shadows: 0,
                    highlights: 0,
                    warmth: 0,
                    tint: 0,
                    sharpness: 0,
                    clarity: 0,
                    opacity: 100,
                    scale: 1,
                    rotation: 0,
                    flipX: false,
                    flipY: false
                  })}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors mt-4"
                >
                  Restablecer Ajustes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'filters' && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {(['none', 'vintage', 'bw', 'cinematic', 'warm', 'cool', 'dramatic'] as FilterType[]).map((f) => (
                <button 
                  key={f}
                  onClick={() => updateActiveLayer({ filter: f })}
                  className={cn(
                    "flex-shrink-0 w-20 flex flex-col items-center space-y-2",
                    activeLayer.state.filter === f ? "text-orange-500" : "text-zinc-500"
                  )}
                >
                  <div className={cn(
                    "w-16 h-16 rounded-xl border-2 transition-all overflow-hidden",
                    activeLayer.state.filter === f ? "border-orange-500 scale-105" : "border-transparent"
                  )}>
                    <img src={activeLayer.image} className={cn("w-full h-full object-cover", f)} alt={f} />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest">{f}</span>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="grid grid-cols-4 gap-4">
              <ToolButton 
                icon={<RotateCcw />} 
                label="-90°" 
                onClick={() => updateActiveLayer({ rotation: (activeLayer.state.rotation - 90) % 360 })} 
              />
              <ToolButton 
                icon={<RotateCw />} 
                label="+90°" 
                onClick={() => updateActiveLayer({ rotation: (activeLayer.state.rotation + 90) % 360 })} 
              />
              <ToolButton 
                icon={<FlipHorizontal />} 
                label="Espejo H" 
                onClick={() => updateActiveLayer({ flipX: !activeLayer.state.flipX })} 
              />
              <ToolButton 
                icon={<FlipVertical />} 
                label="Espejo V" 
                onClick={() => updateActiveLayer({ flipY: !activeLayer.state.flipY })} 
              />
              <ToolButton 
                icon={<RotateCcw />} 
                label="Reset" 
                onClick={resetTransform} 
              />
              <ToolButton 
                icon={<RefreshCw />} 
                label="Centrar" 
                onClick={centerLayer} 
              />
              <div className="col-span-4 mt-4">
                <ControlSlider 
                  icon={<Plus size={16} />} 
                  label="Escala Rápida" 
                  value={activeLayer.state.scale} 
                  min={0.1} max={3} step={0.1}
                  onChange={(v: number) => updateActiveLayer({ scale: v })} 
                />
              </div>
            </div>
          )}

          {activeTab === 'layers' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Capas ({layers.length})</span>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      const id = Math.random().toString(36).substring(7);
                      const newLayer: Layer = {
                        id,
                        name: `Desenfoque ${layers.length + 1}`,
                        type: 'effect',
                        state: {
                          ...INITIAL_IMAGE_STATE,
                          blur: 5
                        },
                        zIndex: layers.length
                      };
                      setLayers([...layers, newLayer]);
                      setActiveLayerId(id);
                      setActiveTab('adjust');
                    }}
                    className="flex items-center space-x-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
                  >
                    <Layers size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Desenfoque</span>
                  </button>
                  <button 
                    onClick={addPixelateLayer}
                    className="flex items-center space-x-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
                  >
                    <Grid size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Pixelar</span>
                  </button>
                  <button 
                    onClick={addEffectLayer}
                    className="flex items-center space-x-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
                  >
                    <Sparkles size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Efecto</span>
                  </button>
                  <button 
                    onClick={addDrawingLayer}
                    className="flex items-center space-x-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
                  >
                    <Pencil size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Dibujo</span>
                  </button>
                  <button 
                    onClick={addTextLayer}
                    className="flex items-center space-x-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
                  >
                    <Plus size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Texto</span>
                  </button>
                  <LayerUpload onUpload={addLayer} />
                </div>
              </div>
              {[...layers].reverse().map((layer) => (
                <div 
                  key={layer.id}
                  onClick={() => setActiveLayerId(layer.id)}
                  className={cn(
                    "flex items-center p-3 rounded-xl border transition-all cursor-pointer",
                    activeLayerId === layer.id ? "bg-orange-500/10 border-orange-500/50" : "bg-zinc-800/50 border-transparent hover:bg-zinc-800"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-black mr-3 flex items-center justify-center">
                    {layer.type === 'image' ? (
                      <img src={layer.image} className="w-full h-full object-cover" alt={layer.name} />
                    ) : layer.type === 'text' ? (
                      <span className="text-xl font-black">T</span>
                    ) : layer.type === 'effect' ? (
                      <Sparkles size={20} />
                    ) : (
                      <Pencil size={20} />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <input 
                      type="text"
                      value={layer.name}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, name: newName } : l));
                      }}
                      className="bg-transparent border-none text-xs font-bold uppercase tracking-widest focus:ring-0 w-full p-0"
                    />
                    <div className="flex items-center space-x-2 mt-1 pr-4" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={layer.state.opacity}
                        onChange={(e) => {
                          const opacity = Number(e.target.value);
                          setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, state: { ...l.state, opacity } } : l));
                        }}
                        className="w-full h-0.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id); }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {layer.state.visible ? <Eye size={16} /> : <EyeOff size={16} className="text-zinc-600" />}
                    </button>
                    <div className="flex flex-col">
                      <button 
                        onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'up'); }}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'down'); }}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Duplicar"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                      className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tab Bar */}
        <div className="flex border-t border-zinc-800">
          <TabButton 
            active={activeTab === 'adjust'} 
            onClick={() => handleTabChange('adjust')} 
            icon={<Sun size={20} />} 
            label="Ajustes" 
          />
          <TabButton 
            active={activeTab === 'filters'} 
            onClick={() => handleTabChange('filters')} 
            icon={<Layers size={20} />} 
            label="Filtros" 
          />
          <TabButton 
            active={activeTab === 'tools'} 
            onClick={() => handleTabChange('tools')} 
            icon={<Crop size={20} />} 
            label="Herramientas" 
          />
          <TabButton 
            active={activeTab === 'draw'} 
            onClick={() => handleTabChange('draw')} 
            icon={<Pencil size={20} />} 
            label="Dibujar" 
          />
          <TabButton 
            active={activeTab === 'text'} 
            onClick={() => handleTabChange('text')} 
            icon={<Type size={20} />} 
            label="Texto" 
          />
          <TabButton 
            active={activeTab === 'layers'} 
            onClick={() => handleTabChange('layers')} 
            icon={<Layers size={20} />} 
            label="Capas" 
          />
        </div>
      </div>

      {/* SVG Filters for Shadows/Highlights */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="shadowsHighlights">
          <feComponentTransfer>
            {/* Shadow adjustment (low values) */}
            <feFuncR id="shadowFuncR" type="gamma" exponent="1" amplitude="1" offset="0" />
            <feFuncG id="shadowFuncG" type="gamma" exponent="1" amplitude="1" offset="0" />
            <feFuncB id="shadowFuncB" type="gamma" exponent="1" amplitude="1" offset="0" />
          </feComponentTransfer>
          <feComponentTransfer>
            {/* Highlight adjustment (high values) */}
            <feFuncR id="highlightFuncR" type="gamma" exponent="1" amplitude="1" offset="0" />
            <feFuncG id="highlightFuncG" type="gamma" exponent="1" amplitude="1" offset="0" />
            <feFuncB id="highlightFuncB" type="gamma" exponent="1" amplitude="1" offset="0" />
          </feComponentTransfer>
        </filter>
        <filter id="sharpness">
          <feConvolveMatrix id="sharpnessMatrix" order="3" preserveAlpha="true" kernelMatrix="0 -0 0 -0 1 -0 0 -0 0" />
        </filter>
        <filter id="clarity">
          <feGaussianBlur id="clarityBlur" stdDeviation="0" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="arithmetic" k2="1" k3="-1" result="highpass" />
          <feComponentTransfer in="highpass" result="highpassContrast">
            <feFuncR id="clarityMerge" type="linear" slope="1" intercept="0" />
            <feFuncG type="linear" slope="1" intercept="0" />
            <feFuncB type="linear" slope="1" intercept="0" />
          </feComponentTransfer>
          <feComposite in="SourceGraphic" in2="highpassContrast" operator="arithmetic" k2="1" k3="1" />
        </filter>
      </svg>
    </motion.div>
  );
}

// --- Gallery Module ---
function GalleryModule({ photos, onSelect, onDelete, onBack }: { photos: Photo[], onSelect: (url: string) => void, onDelete: (id: string) => void, onBack: () => void }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onSelect(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  } as any);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black flex flex-col"
    >
      <div className="p-4 flex items-center justify-between border-b border-zinc-800">
        <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <span className="text-xs font-black uppercase tracking-[0.3em]">Galería</span>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div {...getRootProps()} className={cn(
          "mb-6 h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-colors cursor-pointer",
          isDragActive ? "border-orange-500 bg-orange-500/10" : "border-zinc-800 hover:border-zinc-700"
        )}>
          <input {...getInputProps()} />
          <ImageIcon className="text-zinc-500 mb-2" />
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Subir Imagen</p>
        </div>

        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
            <ImageIcon size={48} className="mb-4 opacity-20" />
            <p className="text-sm italic">No hay fotos guardadas</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="relative aspect-square group">
                <img 
                  src={photo.dataUrl} 
                  className="w-full h-full object-cover rounded-lg cursor-pointer"
                  onClick={() => onSelect(photo.dataUrl)}
                  alt="Gallery"
                />
                <button 
                  onClick={() => onDelete(photo.id)}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// --- Helper Components ---

function ControlSlider({ icon, label, value, min, max, step = 1, onChange }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-zinc-500">
        <div className="flex items-center space-x-2">
          {icon}
          <span>{label}</span>
        </div>
        <span>{typeof value === 'number' ? value.toFixed(step < 1 ? 1 : 0) : value}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step}
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
      />
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 py-4 flex flex-col items-center space-y-1 transition-colors",
        active ? "text-orange-500" : "text-zinc-500 hover:text-zinc-300"
      )}
    >
      {icon}
      <span className="text-[9px] uppercase font-black tracking-widest">{label}</span>
    </button>
  );
}

function ToolButton({ icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-zinc-800 rounded-2xl hover:bg-zinc-700 transition-colors space-y-2"
    >
      {React.cloneElement(icon, { size: 20 })}
      <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-400">{label}</span>
    </button>
  );
}

function LayerUpload({ onUpload }: { onUpload: (url: string) => void }) {
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onUpload(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  } as any);

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <button className="flex items-center space-x-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors">
        <Plus size={14} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Añadir</span>
      </button>
    </div>
  );
}
