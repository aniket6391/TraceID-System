import React from 'react';
import { Map as PigeonMap, ZoomControl } from 'pigeon-maps';
import { osm } from 'pigeon-maps/providers';

export function Map({ center, zoom, children }) {
  return (
    <div style={{ width: '100%', height: '100%', filter: 'invert(90%) hue-rotate(180deg) brightness(85%) contrast(110%) sepia(20%)' }}>
      <PigeonMap provider={osm} defaultCenter={center} defaultZoom={zoom} metaWheelZoom={true}>
        {children}
      </PigeonMap>
    </div>
  );
}

export function MapControls({ position, showZoom }) {
  return (
    <>
      {showZoom && <ZoomControl />}
    </>
  );
}
