import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import React, { useState, useRef } from 'react';

type Mode = 'gallery' | 'camera';

export default function MediaPermissionSheet({
  mode,
  onImagePicked,
  onClose,
}: {
  mode: Mode;
  onImagePicked: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePick = async () => {
    setLoading(true);
    setBlockedMessage(null);
    try {
      try {
        // Ask for permissions if supported by native Capacitor
        const perm = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });

        if (mode === 'camera' && perm.camera === 'denied') {
          setBlockedMessage("Camera access blocked. Please enable Camera permissions in your browser or device settings.");
          return;
        }
        if (mode === 'gallery' && perm.photos === 'denied') {
          setBlockedMessage("Photo gallery access blocked. Please enable Photos permissions in your browser or device settings.");
          return;
        }
      } catch {
        // Fallback gracefully if platform does not implement requestPermissions (e.g. web browser)
      }

      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: mode === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        quality: 80,
        allowEditing: false,
      });

      if (photo.dataUrl) {
        onImagePicked(photo.dataUrl);
        onClose();
      }
    } catch (e: any) {
      // If camera/gallery fails or is blocked in web iframe, open native HTML file picker
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onImagePicked(dataUrl);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  const isCamera = mode === 'camera';

  return (
    <div className="fixed inset-0 bg-black/60 z-[999] flex items-end justify-center">
      {/* Hidden file input fallback for browsers / iframes */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture={isCamera ? 'environment' : undefined}
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div className="bg-white w-full max-w-md rounded-t-[24px] p-6 animate-in slide-in-from-bottom duration-200">
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>

        <div className="text-center">
          <div className="text-5xl mb-3">{isCamera ? '📷' : '🖼️'}</div>
          <h2 className="text-xl font-bold">
            {isCamera ? 'Allow Camera?' : 'Allow Gallery Access?'}
          </h2>
          <p className="text-gray-500 mt-2 text-sm leading-5">
            {isCamera
              ? 'Take a clear photo of your product to sell faster. PinIn only uses camera when you tap take photo.'
              : 'Choose photos from your gallery. PinIn will only see the photos you select, not your whole gallery.'}
          </p>
        </div>

        {blockedMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 text-center font-medium">
            {blockedMessage}
          </div>
        )}

        <button
          onClick={handlePick}
          disabled={loading}
          className="w-full bg-black text-white rounded-full py-4 mt-6 font-semibold active:scale-95 transition-transform cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Opening...' : isCamera ? 'Open Camera' : 'Open Gallery'}
        </button>

        <button
          onClick={onClose}
          type="button"
          className="w-full text-gray-500 py-3 mt-1 text-sm cursor-pointer hover:text-gray-700"
        >
          Not now
        </button>

        <p className="text-[10px] text-gray-400 text-center mt-2">
          You can change this anytime in App Settings
        </p>
      </div>
    </div>
  );
}
