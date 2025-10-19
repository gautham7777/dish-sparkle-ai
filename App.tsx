import React, { useState, useCallback, ChangeEvent, useMemo, useEffect } from 'react';
import { fileToDataUrl } from './utils/fileUtils';
import { generateCleanedImage, isImageOfDirtyDishes } from './services/geminiService';
import { ZoomableImage } from './components/ZoomableImage';

// --- Icon Components ---
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
  </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
  </svg>
);

const ErrorIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
);

const MagicWandIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l2.158-9.026H4.02a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clipRule="evenodd" />
    </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const ResetIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0 8.25 8.25 0 0 0 0-11.667l-3.182-3.182m0 0-3.182 3.182m3.182-3.182L6.34 6.34m11.667 11.667-3.182-3.182" />
    </svg>
);

const ClearIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);


// --- New Confetti Component ---
const Confetti: React.FC = () => {
    const confettiCount = 100;
    const colors = ['#fde047', '#fb923c', '#4dd0e1', '#80deea'];
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
        {[...Array(confettiCount)].map((_, i) => {
          const style = {
            left: `${Math.random() * 100}%`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            animation: `fall ${Math.random() * 2 + 3}s linear ${Math.random() * 2}s forwards`,
          };
          return <div key={i} className="absolute w-3 h-3 rounded-full opacity-0" style={style} />;
        })}
        <style>{`
            @keyframes fall {
                0% { transform: translateY(-20vh) rotate(0deg); opacity: 1; }
                100% { transform: translateY(120vh) rotate(720deg); opacity: 0; }
            }
        `}</style>
      </div>
    );
  };

// --- Loader Component ---
const Loader: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="loader-container">
        <div className="loader-dot"></div>
        <div className="loader-dot"></div>
        <div className="loader-dot"></div>
      </div>
      <p className="text-cyan-800 text-lg font-semibold">{message}</p>
    </div>
);

// --- Placeholder Component ---
const BubblePlaceholder: React.FC = () => (
  <div className="w-full h-full relative overflow-hidden bg-white/20 rounded-2xl">
    {[...Array(10)].map((_, i) => (
      <div key={i} className="absolute rounded-full bg-white/30" style={{ width: `${Math.random()*60+20}px`, height: `${Math.random()*60+20}px`, left: `${Math.random()*100}%`, bottom: '-80px', animation: `rise ${Math.random()*10+5}s linear infinite`, animationDelay: `${Math.random()*5}s`}}/>
    ))}
    <style>{`@keyframes rise { to { transform: translateY(-500px) rotate(360deg); opacity: 0; }}`}</style>
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-cyan-800/80 z-10 p-4">
        <SparklesIcon className="w-20 h-20 mb-2 opacity-50" />
        <span className="font-semibold text-lg">Your sparkling clean dishes will appear here</span>
    </div>
  </div>
);

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
  imageUrl: string | null;
  onClear: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileSelect, imageUrl, onClear }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) { 
            onFileSelect(file);
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 300); // Duration of the pop animation
        }
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Necessary to allow drop
        e.stopPropagation();
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            onFileSelect(file);
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 300);
        }
    };
    
    const animationClass = isAnimating ? 'animate-pop' : '';
    const dragClass = isDraggingOver ? 'drag-over-pulse' : '';

    return (
        <div 
          className={`bg-white/30 backdrop-blur-lg rounded-3xl p-4 h-full flex flex-col items-center justify-center border border-white/40 shadow-lg animate-fade-in transition-shadow duration-300 ${animationClass} ${dragClass}`} 
          style={{ animationDelay: '0.2s' }}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
        <h2 className="text-3xl font-bold text-cyan-900 mb-4">Before</h2>
        <div className="w-full h-full aspect-square relative flex items-center justify-center rounded-2xl overflow-hidden bg-white/20">
            <input type="file" id="file-upload" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
            {imageUrl ? (
            <>
                <ZoomableImage src={imageUrl} alt="Dirty dishes" />
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onClear();
                    }}
                    className="absolute top-3 right-3 z-20 p-2 bg-white/50 backdrop-blur-sm rounded-full text-cyan-900 hover:bg-white/75 hover:text-red-500 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400"
                    aria-label="Remove image"
                >
                    <ClearIcon className="w-5 h-5" />
                </button>
            </>
            ) : (
            <label htmlFor="file-upload" className="flex flex-col items-center justify-center text-center cursor-pointer text-cyan-800/80 hover:text-cyan-900 transition-colors duration-300 transform hover:scale-105 p-4 w-full h-full">
                <UploadIcon className="w-20 h-20 mb-2" />
                <span className="font-semibold text-lg">Click or drag & drop</span>
                <span className="text-sm">PNG, JPG, WEBP</span>
            </label>
            )}
        </div>
        </div>
    );
};

interface ResultDisplayProps {
    imageUrl: string | null;
    isLoading: boolean;
    loadingMessage: string;
    onDownload: () => void;
    showConfetti: boolean;
  }
  
const ResultDisplay: React.FC<ResultDisplayProps> = ({ imageUrl, isLoading, loadingMessage, onDownload, showConfetti }) => {
    const [isNewImage, setIsNewImage] = useState(false);

    useEffect(() => {
        if (imageUrl && !isLoading) {
            setIsNewImage(true);
        } else {
            setIsNewImage(false); // Reset when image is cleared or loading starts
        }
    }, [imageUrl, isLoading]);

    return (
      <div className="bg-white/30 backdrop-blur-lg rounded-3xl p-4 h-full flex flex-col items-center justify-center border border-white/40 shadow-lg animate-fade-in relative" style={{ animationDelay: '0.4s' }}>
        {showConfetti && <Confetti />}
        <div className="w-full flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-cyan-900">After</h2>
            {imageUrl && !isLoading && (
            <button
                onClick={onDownload}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-full font-semibold hover:bg-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-md"
                aria-label="Download cleaned image"
            >
                <DownloadIcon className="w-5 h-5" />
                Download
            </button>
            )}
        </div>
        <div className="w-full h-full aspect-square relative flex items-center justify-center">
          {isLoading ? ( <Loader message={loadingMessage} /> ) 
           : imageUrl ? (
                <div className={`w-full h-full relative ${isNewImage ? 'shimmer-reveal-container' : ''}`}>
                    <ZoomableImage src={imageUrl} alt="Cleaned dishes" />
                </div>
            ) 
           : ( <BubblePlaceholder/> )}
        </div>
      </div>
    );
  };

// --- Main App Component ---
export default function App() {
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [cleanedImageUrl, setCleanedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState(false);

  const handleFileSelect = useCallback(async (file: File) => {
    setCleanedImageUrl(null);
    setError(null);
    setShowConfetti(false);
    try {
      const dataUrl = await fileToDataUrl(file);
      setOriginalImageUrl(dataUrl);
    } catch (err) {
      setError('Failed to read the selected file.');
      console.error(err);
    }
  }, []);
  
  useEffect(() => {
    if (cleanedImageUrl) {
        setShowConfetti(true);
        const timer = setTimeout(() => setShowConfetti(false), 5000); // Show confetti for 5 seconds
        return () => clearTimeout(timer);
    }
  }, [cleanedImageUrl])

  const handleCleanClick = useCallback(async () => {
    if (!originalImageUrl) {
      setError("Please upload an image first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCleanedImageUrl(null);
    setShowConfetti(false);

    try {
      setLoadingMessage("Checking for smudges...");
      const isCorrectImage = await isImageOfDirtyDishes(originalImageUrl);

      if (!isCorrectImage) {
        setError("This doesn't look like a picture of dirty dishes. Please upload a correct image.");
        setIsLoading(false);
        return;
      }

      setLoadingMessage("Making it sparkle...");
      const resultUrl = await generateCleanedImage(originalImageUrl);
      setCleanedImageUrl(resultUrl);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImageUrl]);

  const handleDownload = useCallback(() => {
    if (!cleanedImageUrl) return;
    const link = document.createElement('a');
    link.href = cleanedImageUrl;
    link.download = 'sparkling-dishes.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [cleanedImageUrl]);

  const handleReset = useCallback(() => {
    setOriginalImageUrl(null);
    setCleanedImageUrl(null);
    setError(null);
    setIsLoading(false);
    setShowConfetti(false);
    setLoadingMessage('');
  }, []);
  
  const buttonText = useMemo(() => {
    if (isLoading) return "Working...";
    return "Make it Sparkle";
  }, [isLoading]);

  const isDone = cleanedImageUrl && !isLoading;

  const buttonClasses = [
    'relative overflow-hidden flex items-center justify-center gap-3 w-full max-w-md px-8 py-4 rounded-full text-xl text-white font-bold',
    'focus:outline-none focus:ring-4',
    'transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 disabled:scale-100 shadow-xl hover:shadow-2xl',
    'animate-fade-in shimmer-button',
    'disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed'
  ];

  if (isDone) {
    buttonClasses.push('bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 focus:ring-cyan-300/50');
  } else {
    buttonClasses.push('bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 focus:ring-amber-300/50');
  }

  const title = "Dish Sparkle AI";

  return (
    <div className="min-h-screen text-gray-800 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8 animate-fade-in">
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white" style={{ textShadow: '2px 2px 8px rgba(0, 139, 139, 0.5)' }}>
          {title.split('').map((char, index) => (
            <span key={index} className="title-char" style={{ animationDelay: `${index * 0.05}s` }}>
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
          <span className="text-amber-300 title-char" style={{ animationDelay: `${title.length * 0.05}s` }}>!</span>
        </h1>
        <p className="text-cyan-900/80 mt-2 text-lg">Upload dirty dishes, get back a sparkling clean image instantly.</p>
      </header>

      <main className="w-full max-w-6xl flex-grow flex flex-col items-center">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <ImageUploader onFileSelect={handleFileSelect} imageUrl={originalImageUrl} onClear={handleReset} />
          <ResultDisplay imageUrl={cleanedImageUrl} isLoading={isLoading} loadingMessage={loadingMessage} onDownload={handleDownload} showConfetti={showConfetti} />
        </div>

        {error && (
            <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-xl relative mb-6 w-full max-w-md flex items-center gap-3 animate-shake shadow-lg" role="alert">
                <ErrorIcon className="w-6 h-6"/>
                <span className="block sm:inline font-medium">{error}</span>
            </div>
        )}

        <button
          onClick={isDone ? handleReset : handleCleanClick}
          disabled={!isDone && (!originalImageUrl || isLoading)}
          className={buttonClasses.join(' ')}
           style={{ animationDelay: '0.6s' }}
        >
          {isDone ? (
                <ResetIcon className="w-7 h-7" />
            ) : (
                <MagicWandIcon className="w-7 h-7 magic-wand-icon" />
            )}
            {isDone ? "Clean Another Dish" : buttonText}
        </button>
      </main>
    </div>
  );
}