declare module 'leaflet.heat' {
  import * as L from 'leaflet';
  
  interface HeatLayerOptions {
    radius?: number;
    blur?: number;
    maxZoom?: number;
    max?: number;
    gradient?: Record<number, string>;
  }

  namespace L {
    function heatLayer(
      latlngs: Array<[number, number, number?]>,
      options?: HeatLayerOptions
    ): L.Layer;
  }
}
