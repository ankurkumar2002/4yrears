
/**
 * Cloudinary Service
 * Uses the window.cloudinary object loaded in index.html for direct browser uploads.
 */

export const cloudinaryService = {
  /**
   * Opens the Cloudinary Upload Widget for browser-side uploads.
   */
  openWidget(cloudName: string, uploadPreset: string, callback: (result: any) => void) {
    if (!(window as any).cloudinary) {
      alert("Cloudinary script not loaded yet. Please check your internet connection.");
      return;
    }

    const myWidget = (window as any).cloudinary.createUploadWidget(
      {
        cloudName: cloudName || 'drtxmi9jm',
        uploadPreset: uploadPreset || 'ml_default',
        sources: ['local', 'url', 'camera'],
        multiple: true,
        // Added audio formats to allowed formats
        clientAllowedFormats: ['png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'webm', 'mp3', 'wav', 'm4a', 'ogg'],
        maxVideoFileSize: 1000000000, // 1GB
        resourceType: 'auto', // Important: Cloudinary handles audio/video automatically
        styles: {
          palette: {
            window: '#FFFFFF',
            windowBorder: '#FFD1DC',
            tabIcon: '#FF69B4',
            menuIcons: '#FF69B4',
            textDark: '#5D4037',
            textLight: '#FFFFFF',
            link: '#FF69B4',
            action: '#FF69B4',
            inactiveTabIcon: '#FFD1DC',
            error: '#F44235',
            inProgress: '#FF69B4',
            complete: '#20B832',
            sourceBg: '#FFF9F9'
          },
          frame: {
            background: "#FFF9F9"
          }
        }
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          callback(result.info);
        } else if (error) {
          console.error("Cloudinary Widget Error:", error);
        }
      }
    );

    myWidget.open();
  }
};
