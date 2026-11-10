import React from 'react';

export interface InternetBannerProps {
  isOnline: boolean;
  isInitialLaunchOffline?: boolean;
}

export declare const InternetBanner: React.FC<InternetBannerProps>;
export default InternetBanner;
