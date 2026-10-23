'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin,
  List,
  Filter,
  RefreshCw,
  Clock,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { PublicSafeReport, ReportCategory, WorkflowStatus } from '@/lib/schemas/report';
import { UrgencyBadge, StatusBadge } from './Badge';

interface CommunityMapProps {
  initialReports?: PublicSafeReport[];
}

export function CommunityMap({ initialReports = [] }: CommunityMapProps) {
  const [reports, setReports] = useState<PublicSafeReport[]>(initialReports);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedReport, setSelectedReport] = useState<PublicSafeReport | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  // Fetch reports from API with cancellation support
  const fetchReports = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/reports?${params.toString()}`, { signal });
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      setReports(data.reports || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('Map fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter]);

  useEffect(() => {
    const controller = new AbortController();
    fetchReports(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchReports]);

  // Client-side Leaflet initialization with complete resize cleanup
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let resizeHandler: (() => void) | null = null;

    async function initLeaflet() {
      try {
        if (!mapContainerRef.current) return;

        const L = (await import('leaflet')).default;

        // Clean up previous map instance if re-initializing
        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
          leafletMapRef.current = null;
        }

        // Default center: Pune Metropolitan Area (Kalyani Nagar / Shivaji Nagar focus)
        const map = L.map(mapContainerRef.current, {
          center: [18.536, 73.878],
          zoom: 12,
          scrollWheelZoom: false,
        });

        leafletMapRef.current = map;

        // OpenStreetMap standard tile endpoint with strict attribution
        const tileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const attribution = process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

        L.tileLayer(tileUrl, {
          attribution,
          maxZoom: 19,
        }).addTo(map);

        const markersLayer = L.layerGroup().addTo(map);
        markersLayerRef.current = markersLayer;

        // Invalidate map size on window resize
        resizeHandler = () => {
          if (leafletMapRef.current) {
            leafletMapRef.current.invalidateSize();
          }
        };
        window.addEventListener('resize', resizeHandler);

        // Render markers
        renderMarkers(L, markersLayer, map, reports);
      } catch (err: unknown) {
        console.error('Leaflet initialization failed:', err);
        setMapError('Interactive map view could not be rendered. Switched to synchronized list view.');
        setViewMode('list');
      }
    }

    if (viewMode === 'map') {
      initLeaflet();
    }

    return () => {
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
      }
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [viewMode, reports]);

  const renderMarkers = (L: any, markersLayer: any, map: any, reportList: PublicSafeReport[]) => {
    markersLayer.clearLayers();

    const bounds: [number, number][] = [];

    reportList.forEach((rep) => {
      const coords = rep.location?.approximateCoordinates;
      if (!coords || !coords.lat || !coords.lng) return;

      const markerColor =
        rep.urgency === 'critical'
          ? '#dc2626'
          : rep.urgency === 'high'
          ? '#ea580c'
          : rep.urgency === 'medium'
          ? '#d97706'
          : '#0284c7';

      // SVG Pin divIcon avoids external image dependency
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="background-color: ${markerColor}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background-color: white;"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([coords.lat, coords.lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedReport(rep);
      });

      marker.bindTooltip(`<b>${rep.title}</b><br/><span style="color: #64748b;">${rep.location?.locality || ''}</span>`, {
        direction: 'top',
        offset: [0, -10],
      });

      markersLayer.addLayer(marker);
      bounds.push([coords.lat, coords.lng]);
    });

    if (bounds.length > 0 && map) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  };

  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-100">
      {/* Control Bar: Filters, Live Update time, View Toggle */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Filter Reports:</span>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
            aria-label="Filter reports by category"
          >
            <option value="all">All Domains</option>
            <option value="traffic_road_safety">Traffic & Road Safety</option>
            <option value="civic_infrastructure">Civic Infrastructure & Safety</option>
            <option value="weather_environment">Weather & Environment</option>
            <option value="news_public_info">News & Fact-Check</option>
            <option value="photo_document_verification">Document Intelligence</option>
            <option value="medical_health_records">Medical & Health Records</option>
            <option value="document_public_service">Public Service Assistance</option>
            <option value="other">Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
            aria-label="Filter reports by status"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="verified">Verified</option>
            <option value="action_taken">Action Taken</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {/* View mode toggle & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mr-2">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Updated: {lastUpdated}</span>
          </div>

          <button
            onClick={() => { fetchReports(); }}
            disabled={loading}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="Refresh reports"
            aria-label="Refresh reports from server"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg flex items-center text-xs border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              aria-label="Switch to Map view"
            >
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Map View
              </span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              aria-label="Switch to List view"
            >
              <span className="flex items-center gap-1.5">
                <List className="w-3.5 h-3.5" /> List View ({reports.length})
              </span>
            </button>
          </div>
        </div>
      </div>

      {mapError && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-200 p-3 rounded-lg text-xs">
          {mapError}
        </div>
      )}

      {/* Main View Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map Container */}
        <div
          className={`${
            viewMode === 'map' ? 'block' : 'hidden'
          } lg:col-span-2 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative min-h-[450px] sm:min-h-[550px]`}
        >
          <div ref={mapContainerRef} className="w-full h-full min-h-[450px] sm:min-h-[550px] z-0" />

          {/* Privacy approximation overlay badge */}
          <div className="absolute top-3 left-3 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg shadow-xs text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5 pointer-events-none">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Locations are approximated for public privacy.</span>
          </div>
        </div>

        {/* Synchronized List View / Fallback */}
        <div
          className={`${
            viewMode === 'list' ? 'block col-span-3' : 'hidden lg:block lg:col-span-1'
          } bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 overflow-y-auto max-h-[600px] space-y-3`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">
              Community Reports ({reports.length})
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Only approved public records
            </span>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-xs">
              No approved reports match the current filter selection.
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                onClick={() => setSelectedReport(rep)}
                className={`p-3 rounded-lg border cursor-pointer transition text-left ${
                  selectedReport?.id === rep.id
                    ? 'border-sky-500 bg-sky-50/40 dark:bg-sky-950/40 ring-1 ring-sky-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedReport(rep);
                }}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <UrgencyBadge urgency={rep.urgency} />
                    {rep.isDemoData && (
                      <span className="text-[10px] font-bold bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 px-1.5 py-0.5 rounded">
                        DEMO
                      </span>
                    )}
                  </div>
                  <StatusBadge status={rep.status} />
                </div>

                <h3 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1">
                  {rep.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-xs line-clamp-2 mt-1">
                  {rep.summary}
                </p>

                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 truncate max-w-[160px]">
                    <MapPin className="w-3 h-3 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                    {rep.location?.locality || 'Locality unlisted'}
                  </span>
                  <span>{new Date(rep.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selected Report Inspection Modal / Drawer */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[11px] text-sky-300 bg-slate-800 px-2 py-0.5 rounded">
                    {selectedReport.id}
                  </span>
                  <UrgencyBadge urgency={selectedReport.urgency} />
                  {selectedReport.isDemoData && (
                    <span className="text-[10px] font-bold bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded">
                      DEMO DATA
                    </span>
                  )}
                </div>
                <h3 id="report-modal-title" className="font-bold text-base sm:text-lg">
                  {selectedReport.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
                aria-label="Close report detail panel"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm max-h-[70vh] overflow-y-auto">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedReport.summary}
              </p>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                <div className="font-semibold text-slate-800 dark:text-slate-200">Approximate Location:</div>
                <div className="text-slate-600 dark:text-slate-400">
                  {selectedReport.location?.locality}, {selectedReport.location?.city}
                </div>
              </div>

              {/* Provenance Facts */}
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mb-2">Extracted Facts & Provenance:</div>
                <div className="space-y-1.5">
                  {selectedReport.facts.map((fact) => (
                    <div key={fact.id} className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded border border-slate-200 dark:border-slate-700 text-xs">
                      {fact.statement}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Actions */}
              {selectedReport.recommendedActions.length > 0 && (
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mb-2">Action Plan:</div>
                  <div className="space-y-2">
                    {selectedReport.recommendedActions.map((act) => (
                      <div key={act.id} className="p-2.5 bg-sky-50/50 dark:bg-sky-950/40 rounded-lg border border-sky-200 dark:border-sky-800 text-xs">
                        <div className="font-semibold text-sky-950 dark:text-sky-200">{act.title}</div>
                        {act.portalOrDesk && (
                          <div className="text-sky-700 dark:text-sky-400 text-[11px]">{act.portalOrDesk}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
