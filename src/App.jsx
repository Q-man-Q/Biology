import React, { useState, useEffect } from 'react';
import HeaderBar from './components/HeaderBar';
import Sidebar from './components/Sidebar';
import FooterBar from './components/FooterBar';
import MapView from './components/MapView';
import ObservationsTab from './components/ObservationsTab';
import SpeciesTab from './components/SpeciesTab';
import BiotopesTab from './components/BiotopesTab';
import MapsTab from './components/MapsTab';
import ExportTab from './components/ExportTab';
import ObservationModal from './components/ObservationModal';
import SettingsModal from './components/SettingsModal';

import importedPointsFile from '../ebita_reserve_boundaries.json';
import { INITIAL_OBSERVATIONS, MAMMALS_SPECIES, BIOTOPES_LIST } from './data/ebitaData';
import { computeOuterBoundaryFromQuarters } from './utils/snapping';
import { 
  subscribeToObservations, 
  saveObservationToCloud, 
  deleteObservationFromCloud, 
  batchSaveObservationsToCloud,
  subscribeToReservePoints,
  saveReservePointsToCloud
} from './firebase';

export default function App() {
  // Navigation tab: 'home' | 'observations' | 'species' | 'biotopes' | 'maps' | 'export'
  const [activeTab, setActiveTab] = useState('home');

  // Search filter query
  const [searchQuery, setSearchQuery] = useState('');

  // Reserve Quarters and Outer Boundary state (persisted & synced)
  const [reservePoints, setReservePoints] = useState(() => {
    const saved = localStorage.getItem('ebita_eco_reserve_points');
    let quarters = importedPointsFile.quarters || [];

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.quarters && parsed.quarters.length > 0) {
          quarters = parsed.quarters;
        }
      } catch (e) {
        console.error(e);
      }
    }

    const outerBoundary = computeOuterBoundaryFromQuarters(quarters);
    return {
      outerBoundary,
      quarters
    };
  });

  // Observations state (empty by default, synced via Firestore)
  const [observations, setObservations] = useState(() => {
    const saved = localStorage.getItem('ebita_eco_observations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filter out old fake seed observations EB-000124..128
        return parsed.filter(o => !String(o.id).startsWith('EB-00012'));
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // Cloud Sync Status & Errors
  const [cloudError, setCloudError] = useState(null);

  // Realtime Cloud Synchronization via Firestore
  useEffect(() => {
    const unsubscribeObs = subscribeToObservations(
      (cloudObs) => {
        if (Array.isArray(cloudObs)) {
          setObservations(cloudObs);
          setCloudError(null);
        }
      },
      (err) => {
        console.error("Firestore sync error:", err);
        if (err?.code === 'permission-denied') {
          setCloudError("Внимание: База данных блокирует доступ. Нажмите синюю кнопку «Publish» (Опубликовать) на вкладке Rules в Firebase Console.");
        } else {
          setCloudError("Ошибка синхронизации с облаком Firebase: " + (err?.message || "Нет соединения"));
        }
      }
    );

    const unsubscribePoints = subscribeToReservePoints((cloudPoints) => {
      if (cloudPoints && cloudPoints.quarters && cloudPoints.quarters.length > 0) {
        const outerBoundary = computeOuterBoundaryFromQuarters(cloudPoints.quarters);
        setReservePoints({
          quarters: cloudPoints.quarters,
          outerBoundary
        });
      }
    });

    return () => {
      unsubscribeObs();
      unsubscribePoints();
    };
  }, []);

  // System Settings State (persisted)
  const [appSettings, setAppSettings] = useState(() => {
    const saved = localStorage.getItem('ebita_app_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      debugMode: true,
      showPhotoMapButton: true
    };
  });

  // Map tile layer state
  const [activeMapLayer, setActiveMapLayer] = useState('osm');

  // Observation Modal state
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [editingObservation, setEditingObservation] = useState(null);
  const [isModalReadOnly, setIsModalReadOnly] = useState(false);

  // Focused observation to center map camera on
  const [focusedObservation, setFocusedObservation] = useState(null);

  // Settings Modal state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Callback when picking coords on map
  const [pickLocationCallback, setPickLocationCallback] = useState(null);

  // Save observations to localStorage
  useEffect(() => {
    localStorage.setItem('ebita_eco_observations', JSON.stringify(observations));
  }, [observations]);

  // Save reserve points to localStorage
  useEffect(() => {
    localStorage.setItem('ebita_eco_reserve_points', JSON.stringify(reservePoints));
  }, [reservePoints]);

  // Save system settings to localStorage
  useEffect(() => {
    localStorage.setItem('ebita_app_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  // Add or update observation (Local + Cloud)
  const handleSaveObservation = (obsObj) => {
    const existingIndex = observations.findIndex((o) => o.id === obsObj.id);
    if (existingIndex >= 0) {
      const updated = [...observations];
      updated[existingIndex] = obsObj;
      setObservations(updated);
    } else {
      setObservations([obsObj, ...observations]);
    }
    // Save to Firestore Cloud
    saveObservationToCloud(obsObj);
  };

  // Delete observation (Local + Cloud)
  const handleDeleteObservation = (obsId) => {
    setObservations(observations.filter((o) => o.id !== obsId));
    // Delete from Firestore Cloud
    deleteObservationFromCloud(obsId);
  };

  // Import new payload (e.g. from JSON file upload)
  const handleImportData = (payload) => {
    if (payload.observations && Array.isArray(payload.observations)) {
      setObservations(payload.observations);
      batchSaveObservationsToCloud(payload.observations);
    }
    if (payload.quarters || payload.outerBoundary) {
      const newPoints = {
        quarters: payload.quarters || reservePoints.quarters,
        outerBoundary: payload.outerBoundary || reservePoints.outerBoundary
      };
      setReservePoints(newPoints);
      saveReservePointsToCloud(newPoints);
    }
  };

  // Reset to initial data
  const handleResetData = () => {
    localStorage.removeItem('ebita_eco_observations');
    localStorage.removeItem('ebita_eco_reserve_points');
    setObservations(INITIAL_OBSERVATIONS);
    setReservePoints({
      outerBoundary: importedPointsFile.outerBoundary || [],
      quarters: importedPointsFile.quarters || []
    });
  };

  // Add or update observation at photo map click
  const handleAddObservationAtCoords = (lat, lng, xPct, yPct, defaultNote) => {
    if (pickLocationCallback) {
      pickLocationCallback(lat, lng, xPct, yPct);
      setPickLocationCallback(null);
    } else {
      setEditingObservation({
        lat,
        lng,
        xPct,
        yPct,
        note: defaultNote || '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5)
      });
      setIsObservationModalOpen(true);
    }
  };

  // Calculate statistics for bottom footer
  const uniqueSpeciesCount = new Set(observations.map((o) => o.species)).size;
  const uniqueBiotopesCount = new Set(observations.map((o) => o.biotope)).size;
  const lastObservationDate = observations.length > 0 ? observations[0].date : '—';

  // Filter observations by search query if set
  const filteredObservations = searchQuery.trim()
    ? observations.filter(
        (o) =>
          o.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (o.biotope && o.biotope.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (o.description && o.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : observations;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden select-none">
      {/* Header Bar */}
      <HeaderBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenNewObservation={() => {
          setEditingObservation(null);
          setIsObservationModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {cloudError && (
        <div className="bg-amber-900/60 border-b border-amber-500/40 px-4 py-2 text-xs text-amber-200 flex items-center justify-between shrink-0">
          <span>⚠️ {cloudError}</span>
          <button 
            onClick={() => setCloudError(null)}
            className="text-amber-400 hover:text-amber-100 ml-2 font-bold px-2 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Container (Sidebar + Content View) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          observationsCount={observations.length}
        />

        {/* Tab Content Views */}
        <main className="flex-1 relative overflow-hidden bg-slate-950 flex flex-col">
          {activeTab === 'home' && (
            <MapView
              quarters={reservePoints.quarters}
              outerBoundary={reservePoints.outerBoundary}
              observations={filteredObservations}
              settings={appSettings}
              selectedObservation={focusedObservation}
              onSelectObservation={(obs) => {
                setEditingObservation(obs);
                setIsModalReadOnly(true);
                setIsObservationModalOpen(true);
              }}
              onDeleteObservation={handleDeleteObservation}
              onAddObservationAtCoords={handleAddObservationAtCoords}
              onSaveTransformedBoundaries={(newQuarters) => {
                setReservePoints({
                  quarters: newQuarters,
                  outerBoundary: computeOuterBoundaryFromQuarters(newQuarters)
                });
              }}
            />
          )}

          {activeTab === 'observations' && (
            <ObservationsTab
              observations={filteredObservations}
              onOpenNewObservation={() => {
                setEditingObservation(null);
                setIsModalReadOnly(false);
                setIsObservationModalOpen(true);
              }}
              onViewObservation={(obs) => {
                setEditingObservation(obs);
                setIsModalReadOnly(true);
                setIsObservationModalOpen(true);
              }}
              onEditObservation={(obs) => {
                setEditingObservation(obs);
                setIsModalReadOnly(false);
                setIsObservationModalOpen(true);
              }}
              onDeleteObservation={handleDeleteObservation}
              onSelectObservationOnMap={(obs) => {
                setFocusedObservation(obs);
                setActiveTab('home');
              }}
            />
          )}

          {activeTab === 'species' && (
            <SpeciesTab
              observations={observations}
              onSelectSpeciesFilter={(speciesName) => {
                setSearchQuery(speciesName);
                setActiveTab('observations');
              }}
            />
          )}

          {activeTab === 'biotopes' && (
            <BiotopesTab
              observations={observations}
              onSelectBiotopeFilter={(biotopeName) => {
                setSearchQuery(biotopeName);
                setActiveTab('observations');
              }}
            />
          )}

          {activeTab === 'maps' && (
            <MapsTab
              activeLayer={activeMapLayer}
              onChangeLayer={setActiveMapLayer}
              quartersCount={reservePoints.quarters.length}
            />
          )}

          {activeTab === 'export' && (
            <ExportTab
              observations={observations}
              outerBoundary={reservePoints.outerBoundary}
              quarters={reservePoints.quarters}
              onImportData={handleImportData}
              onResetData={handleResetData}
            />
          )}
        </main>
      </div>

      {/* Footer Bar */}
      <FooterBar
        observationsCount={observations.length}
        speciesCount={uniqueSpeciesCount}
        biotopesCount={uniqueBiotopesCount}
        lastObservationDate={lastObservationDate}
      />

      {/* Observation Modal */}
      <ObservationModal
        isOpen={isObservationModalOpen}
        onClose={() => {
          setIsObservationModalOpen(false);
          setEditingObservation(null);
        }}
        onSave={handleSaveObservation}
        initialData={editingObservation}
        isReadOnly={isModalReadOnly}
        onRequestPickOnMap={(callback) => {
          setIsObservationModalOpen(false);
          setActiveTab('home');
          setPickLocationCallback(() => (lat, lng) => {
            callback(lat, lng);
            setIsObservationModalOpen(true);
          });
        }}
      />

      {/* System Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={appSettings}
        onUpdateSettings={setAppSettings}
        observations={observations}
        outerBoundary={reservePoints.outerBoundary}
        quarters={reservePoints.quarters}
        onImportData={handleImportData}
        onResetData={handleResetData}
      />
    </div>
  );
}
