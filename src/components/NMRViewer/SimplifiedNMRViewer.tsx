/**
 * SimplifiedNMRViewer - Real NMRium interface
 */

import React from 'react';
import { NMRium } from 'nmrium';

const SimplifiedNMRViewer: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <NMRium workspace="default" />
    </div>
  );
};

export default SimplifiedNMRViewer;