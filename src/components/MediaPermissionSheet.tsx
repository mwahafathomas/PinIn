import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useState } from 'react';

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

  const handlePick = async () => {
    setLoading(true);
    try {
      try {
        // Ask for permissions
        const perm = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });

        if (mode === 'camera' && perm.camera === 'denied') {
          alert("Camera blocked. Go to Settings > Apps > PinIn > Permissions > Allow Camera");
          return;
        }
        if (mode === 'gallery' && perm.photos === 'denied') {
          alert("Gallery blocked. Go to Settings > Apps > PinIn > Permissions > Allow Photos");
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
    } catch (e) {
      console.log("Cancelled", e);
    } finally {
      setLoading(false);
    }
  };

  const isCamera = mode === 'camera';

  return (
    <div className="fixed inset-0 bg-black/60 z-[999] flex items-end justify-center">
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
