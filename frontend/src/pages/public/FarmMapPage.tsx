import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  ShieldCheck,
  Star,
  Sprout,
  Navigation,
  ArrowRight,
  Layers,
  ExternalLink,
  Locate,
} from 'lucide-react';
import { farmersApi } from '../../api';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import type { FarmerMapLocation } from '../../types';

// Helper component to center and fly to selected coordinates
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

// Create custom SVG Leaflet pin icon
const createFarmIcon = (isSelected: boolean, farmName: string) => {
  return L.divIcon({
    className: 'custom-farm-pin',
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%);
        cursor: pointer;
      ">
        <div style="
          width: ${isSelected ? '38px' : '32px'};
          height: ${isSelected ? '38px' : '32px'};
          background: ${isSelected ? '#059669' : '#047857'};
          border: 3px solid ${isSelected ? '#f59e0b' : '#ffffff'};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        ">
          <div style="transform: rotate(45deg); color: #ffffff; font-size: ${isSelected ? '16px' : '14px'}; font-weight: bold;">
            🌱
          </div>
        </div>
        <div style="
          margin-top: 4px;
          background: ${isSelected ? '#f59e0b' : 'rgba(24, 24, 27, 0.92)'};
          color: ${isSelected ? '#18181b' : '#ffffff'};
          font-size: 10px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 6px;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          pointer-events: none;
        ">
          ${farmName}
        </div>
      </div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
  });
};

export const FarmMapPage: React.FC = () => {
  const [selectedProvince, setSelectedProvince] = useState<string>('ALL');
  const [selectedFarm, setSelectedFarm] = useState<FarmerMapLocation | null>(null);
  const [mapLayer, setMapLayer] = useState<'osm' | 'topo' | 'satellite'>('osm');
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.5657, 104.9910]); // Center of Cambodia
  const [mapZoom, setMapZoom] = useState<number>(7);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const { data: mapFarms, isLoading } = useQuery({
    queryKey: ['farmer-map'],
    queryFn: () => farmersApi.getMapLocations().then((res) => res.data),
  });

  const provinces = [
    { id: 'ALL', name: 'All Cambodia', center: [12.5657, 104.9910] as [number, number], zoom: 7 },
    { id: 'Siem Reap', name: 'Siem Reap', center: [13.3633, 103.8564] as [number, number], zoom: 10 },
    { id: 'Battambang', name: 'Battambang', center: [13.0957, 103.2022] as [number, number], zoom: 10 },
    { id: 'Kampot', name: 'Kampot', center: [10.6104, 104.1815] as [number, number], zoom: 10 },
    { id: 'Mondulkiri', name: 'Mondulkiri', center: [12.4558, 107.1882] as [number, number], zoom: 9 },
    { id: 'Kandal', name: 'Kandal & Phnom Penh', center: [11.5564, 104.9282] as [number, number], zoom: 10 },
    { id: 'Kratie', name: 'Kratie (Mekong)', center: [12.4881, 106.0188] as [number, number], zoom: 10 },
    { id: 'Pursat', name: 'Pursat', center: [12.5388, 103.9192] as [number, number], zoom: 10 },
  ];

  const filteredFarms = mapFarms?.filter((f) => {
    if (!f.latitude || !f.longitude) return false;
    if (selectedProvince === 'ALL') return true;
    return f.province.toLowerCase().includes(selectedProvince.toLowerCase());
  }) || [];

  const handleProvinceSelect = (p: typeof provinces[0]) => {
    setSelectedProvince(p.id);
    setSelectedFarm(null);
    setMapCenter(p.center);
    setMapZoom(p.zoom);
  };

  const handleFarmSelect = (farm: FarmerMapLocation) => {
    setSelectedFarm(farm);
    if (farm.latitude && farm.longitude) {
      setMapCenter([farm.latitude, farm.longitude]);
      setMapZoom(12);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setMapCenter(coords);
        setMapZoom(11);
        setIsLocating(false);
      },
      (err) => {
        console.error(err);
        setIsLocating(false);
        alert('Could not determine GPS location.');
      }
    );
  };

  // Map Tile Layers
  const tileUrls = {
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    topo: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> Voyager',
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a> World Imagery',
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-bold uppercase tracking-wider mb-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>Live GPS Agricultural Map</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-display">
            Interactive Cambodia Farm Map
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Real satellite & street cartography showing verified farms, organic cultivation sites, and direct dispatch origins.
          </p>
        </div>

        {/* Action Controls & GPS */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLocateMe}
            isLoading={isLocating}
            className="text-xs font-bold text-forest-800 border-forest-300 bg-white hover:bg-forest-50"
            leftIcon={<Locate className="w-3.5 h-3.5 text-forest-600" />}
          >
            Locate Near Me
          </Button>

          {/* Layer Switcher */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold">
            <button
              onClick={() => setMapLayer('osm')}
              className={`px-2.5 py-1 rounded-lg transition-all ${mapLayer === 'osm' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'}`}
            >
              Street
            </button>
            <button
              onClick={() => setMapLayer('topo')}
              className={`px-2.5 py-1 rounded-lg transition-all ${mapLayer === 'topo' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'}`}
            >
              Voyager
            </button>
            <button
              onClick={() => setMapLayer('satellite')}
              className={`px-2.5 py-1 rounded-lg transition-all ${mapLayer === 'satellite' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'}`}
            >
              Satellite
            </button>
          </div>
        </div>
      </div>

      {/* Province Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        {provinces.map((p) => (
          <button
            key={p.id}
            onClick={() => handleProvinceSelect(p)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedProvince === p.id
                ? 'bg-forest-700 text-white shadow-xs scale-105'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Cols: Real Leaflet Map */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-2 border border-stone-200 shadow-soft relative overflow-hidden">
          <div className="w-full h-[540px] rounded-2xl overflow-hidden relative z-0">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                scrollWheelZoom={true}
                className="w-full h-full z-0"
                style={{ background: '#e5e7eb' }}
              >
                <MapController center={mapCenter} zoom={mapZoom} />
                <TileLayer
                  url={tileUrls[mapLayer].url}
                  attribution={tileUrls[mapLayer].attribution}
                />

                {/* User Location Marker */}
                {userLocation && (
                  <Marker
                    position={userLocation}
                    icon={L.divIcon({
                      className: 'user-pin',
                      html: `
                        <div style="width: 20px; height: 20px; background: #2563eb; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 0 10px rgba(37,99,235,0.6); animation: pulse 2s infinite;"></div>
                      `,
                      iconSize: [20, 20],
                      iconAnchor: [10, 10],
                    })}
                  >
                    <Popup>
                      <div className="text-xs font-bold text-stone-900">Your Detected Location</div>
                    </Popup>
                  </Marker>
                )}

                {/* Real Farm Markers */}
                {filteredFarms.map((farm) => {
                  const isSelected = selectedFarm?.id === farm.id;
                  const pos: [number, number] = [farm.latitude!, farm.longitude!];

                  return (
                    <Marker
                      key={farm.id}
                      position={pos}
                      icon={createFarmIcon(isSelected, farm.farm_name)}
                      eventHandlers={{
                        click: () => handleFarmSelect(farm),
                      }}
                    >
                      <Popup className="custom-leaflet-popup">
                        <div className="p-1 space-y-2 max-w-[220px]">
                          <div className="font-bold text-stone-900 text-xs">{farm.farm_name}</div>
                          <p className="text-[11px] text-stone-500 line-clamp-2">{farm.bio}</p>
                          <div className="text-[10px] text-forest-700 font-bold">
                            {farm.active_crop_count} harvest crops listed
                          </div>
                          <button
                            onClick={() => handleFarmSelect(farm)}
                            className="w-full py-1 text-[10px] font-bold bg-forest-700 text-white rounded-lg hover:bg-forest-800"
                          >
                            Inspect Farm Produce
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            )}
          </div>

          {/* Map Footer Bar */}
          <div className="p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-stone-500 border-t border-stone-100">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-forest-700 inline-block" /> {filteredFarms.length} Verified Farms Active
              </span>
              <span className="text-stone-300">•</span>
              <span>Drag to pan • Scroll to zoom</span>
            </div>
            <div className="text-stone-400">
              Cambodia Real Geographic Coordinates
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Selected Farm Card or Farm List */}
        <div className="lg:col-span-4 space-y-4">
          {selectedFarm ? (
            <div className="bg-white rounded-3xl p-6 border-2 border-forest-600 shadow-soft space-y-5 animate-fadeIn">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full">
                    {selectedFarm.farming_practice}
                  </span>
                  <h3 className="text-lg font-bold text-stone-900 mt-1.5">
                    {selectedFarm.farm_name}
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    {selectedFarm.district ? `${selectedFarm.district}, ` : ''}{selectedFarm.province}, Cambodia
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2 py-1 rounded-xl text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>{parseFloat(selectedFarm.rating_avg).toFixed(1)}</span>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                {selectedFarm.bio}
              </p>

              {/* Sample Available Crops */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Fresh Harvest Catalog ({selectedFarm.active_crop_count} crops)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedFarm.sample_crops.map((crop, idx) => (
                    <div key={idx} className="p-2.5 bg-stone-50 rounded-2xl text-xs border border-stone-100">
                      <div className="font-bold text-stone-800 truncate">{crop.name}</div>
                      <div className="text-[11px] text-forest-700 font-bold">${crop.price}/{crop.unit}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link to={`/farmers/${selectedFarm.slug}`} className="block w-full">
                  <Button variant="primary" size="md" className="w-full rounded-xl" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Shop From This Farm
                  </Button>
                </Link>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${
                    selectedFarm.latitude && selectedFarm.longitude
                      ? `${selectedFarm.latitude},${selectedFarm.longitude}`
                      : encodeURIComponent(`${selectedFarm.farm_name}, ${selectedFarm.province}, Cambodia`)
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-800 text-xs font-bold transition-colors border border-forest-200"
                >
                  <Navigation className="w-3.5 h-3.5 text-forest-600" />
                  <span>Turn-by-Turn in Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-stone-400" />
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-soft space-y-4">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center justify-between">
                <span>Verified Farms ({filteredFarms.length})</span>
                <span className="text-[10px] text-forest-700 font-normal">Click to focus</span>
              </h3>
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {filteredFarms.map((farm) => (
                  <div
                    key={farm.id}
                    onClick={() => handleFarmSelect(farm)}
                    className="p-3.5 rounded-2xl border border-stone-200 hover:border-forest-600 hover:bg-forest-50/40 transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-stone-900 text-xs group-hover:text-forest-800 truncate">
                        {farm.farm_name}
                      </h4>
                      <span className="text-[10px] font-bold text-forest-800 bg-forest-100 px-2 py-0.5 rounded-full">
                        {farm.province}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 flex items-center justify-between">
                      <span>{farm.active_crop_count} harvest items</span>
                      <span className="flex items-center gap-1 font-bold text-stone-800">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {parseFloat(farm.rating_avg).toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
