/**
 * Universal Webcam Hardware Release Utility
 * Ensures that laptop camera hardware LED turns off immediately
 * when a QR scanner is stopped or unmounted.
 */
export const stopAllWebcamTracks = async (scannerInstance) => {
  // 1. Gracefully stop and clear Html5QrcodeScanner or Html5Qrcode instance
  if (scannerInstance) {
    try {
      if (scannerInstance.html5Qrcode && typeof scannerInstance.html5Qrcode.stop === 'function') {
        if (scannerInstance.html5Qrcode.isScanning) {
          await scannerInstance.html5Qrcode.stop().catch(() => {});
        }
      } else if (typeof scannerInstance.stop === 'function' && scannerInstance.isScanning) {
        await scannerInstance.stop().catch(() => {});
      }

      if (typeof scannerInstance.clear === 'function') {
        await scannerInstance.clear().catch(() => {});
      }
    } catch (err) {
      console.warn('[CameraUtils] Error during scanner instance teardown:', err);
    }
  }

  // 2. Explicitly stop every MediaStreamTrack on all <video> elements in the DOM
  try {
    const videoElements = document.querySelectorAll('video');
    videoElements.forEach((video) => {
      if (video.srcObject && typeof video.srcObject.getTracks === 'function') {
        video.srcObject.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            console.warn('[CameraUtils] Error stopping track:', e);
          }
        });
        video.srcObject = null;
      }
    });
  } catch (err) {
    console.warn('[CameraUtils] Error stopping DOM video tracks:', err);
  }
};

