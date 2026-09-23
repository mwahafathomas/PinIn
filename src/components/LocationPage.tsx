import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  Search,
  MessageSquare,
  Bell,
  MapPin,
  Check,
  X,
} from 'lucide-react';
import {
  DEFAULT_GAUTENG_LOCATIONS,
  fetchLocationsFromSupabase,
} from '../services/locationsService';

interface LocationPageProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: string;
  onSelectLocation: (location: string) => void;
  fromSell?: boolean;
  onOpenMessages?: () => void;
  onOpenNotifications?: () => void;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
}

export const LocationPage: React.FC<LocationPageProps> = ({
  isOpen,
  onClose,
  selectedLocation,
  onSelectLocation,
  fromSell = false,
  onOpenMessages,
  onOpenNotifications,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
}) => {
  const [locationsList, setLocationsList] = useState<string[]>(DEFAULT_GAUTENG_LOCATIONS);
  const [searchQuery, setSearchQuery] = useState('');

  // Support multiple chosen locations (or single for sell)
  const [selectedLocations, setSelectedLocations] = useState<string[]>(() => {
    if (!selectedLocation) return [];
    return selectedLocation
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  });

  useEffect(() => {
    if (isOpen) {
      fetchLocationsFromSupabase().then((data) => {
        if (data && data.length > 0) {
          setLocationsList(data);
        }
      });
      if (selectedLocation) {
        setSelectedLocations(
          selectedLocation
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        );
      }
    }
  }, [isOpen, selectedLocation]);

  // Filter locations dynamically as user types
  const filteredLocations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return locationsList;
    return locationsList.filter((loc) =>
      loc.toLowerCase().includes(query)
    );
  }, [searchQuery, locationsList]);

  if (!isOpen) return null;

  const handleToggleLocation = (locName: string) => {
    const formatted = `${locName} (Gauteng)`;
    if (fromSell) {
      // Single selection for Sell listing
      setSelectedLocations([formatted]);
      return;
    }

    setSelectedLocations((prev) => {
      if (prev.includes(formatted) || prev.includes(locName)) {
        return prev.filter((l) => l !== formatted && l !== locName);
      } else {
        return [...prev, formatted];
      }
    });
  };

  const handleRemoveSingle = (locItem: string) => {
    setSelectedLocations((prev) => prev.filter((l) => l !== locItem));
  };

  const handleContinue = () => {
    onSelectLocation(selectedLocations.join(', '));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* Top Header Bar (White) */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          {/* Go back option ( < ) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* App Name (PinIn) right in the middle */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#2D8EDE]">In</span>
            </span>
          </div>

          <div className="w-8" aria-hidden="true" />
        </div>
      </header>

      {/* Main Content Area (Scrollable middle) */}
      <main className="flex-1 w-full max-w-md md:max-w-4xl lg:max-w-5xl mx-auto overflow-y-auto px-4 md:px-6 lg:px-8 pt-4 pb-6 flex flex-col min-h-0">
        {/* Search location input box */}
        <div className="mb-3 shrink-0">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Gauteng areas (e.g. Sandton, Midrand, Pretoria)..."
              aria-label="Search location"
              className="w-full bg-white text-gray-900 placeholder:text-gray-400 text-sm font-semibold pl-11 pr-10 py-3 rounded-2xl border-2 border-gray-300 focus:border-[#2D8EDE] shadow-xs focus:outline-none transition-all"
            />
            <div className="absolute left-3.5 pointer-events-none text-[#2D8EDE]">
              <Search className="w-5 h-5 stroke-[2.5]" />
            </div>

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                aria-label="Clear location search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Selected Locations Chips */}
        {selectedLocations.length > 0 && (
          <div className="mb-3 shrink-0">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Selected Locations ({selectedLocations.length})
              </span>
              <button
                type="button"
                onClick={() => setSelectedLocations([])}
                className="text-[11px] font-semibold text-[#2D8EDE] hover:underline cursor-pointer"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 p-2 bg-blue-50/60 rounded-xl border border-blue-200">
              {selectedLocations.map((loc) => (
                <span
                  key={loc}
                  className="inline-flex items-center gap-1 bg-white text-[#2D8EDE] text-xs font-bold px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs"
                >
                  <MapPin className="w-3 h-3 text-[#2D8EDE]" />
                  <span className="truncate max-w-[150px]">{loc.replace(' (Gauteng)', '')}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSingle(loc)}
                    className="hover:text-red-500 p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Results heading & container with multi-select */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 px-1 shrink-0">
            <span className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>Gauteng Locations</span>
              <span className="text-gray-400 font-medium text-[11px]">
                ({filteredLocations.length})
              </span>
            </span>
            <span className="text-[11px] text-gray-500 font-medium">
              {fromSell ? 'Select listing location' : 'Select one or multiple'}
            </span>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-3xl overflow-hidden shadow-xs flex-1 overflow-y-auto divide-y divide-gray-100">
            {filteredLocations.length > 0 ? (
              filteredLocations.map((loc) => {
                const formattedLocation = `${loc} (Gauteng)`;
                const isSelected =
                  selectedLocations.includes(formattedLocation) ||
                  selectedLocations.includes(loc);

                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => handleToggleLocation(loc)}
                    className={`w-full py-3 px-4 text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/90 text-[#2D8EDE] font-bold'
                        : 'hover:bg-gray-50 text-gray-800 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MapPin
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-[#2D8EDE]' : 'text-gray-400'
                        }`}
                      />
                      <span className="text-xs sm:text-sm truncate">
                        {loc}{' '}
                        <span
                          className={
                            isSelected
                              ? 'text-[#2D8EDE] font-extrabold'
                              : 'text-gray-400 font-normal'
                          }
                        >
                          (Gauteng)
                        </span>
                      </span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ml-2 transition-all ${
                        isSelected
                          ? 'bg-[#2D8EDE] border-[#2D8EDE] text-white shadow-2xs'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-500">
                <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-700">
                  No locations found matching "{searchQuery}"
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Try searching for another Gauteng town or suburb
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Continue Button */}
        <div className="mt-4 shrink-0 flex justify-center">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full max-w-[280px] py-3 px-6 bg-[#2D8EDE] hover:bg-[#2579BE] active:scale-95 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
          >
            <span>
              {fromSell
                ? selectedLocations.length > 0
                  ? `Set as Listing Location`
                  : 'Select Location'
                : selectedLocations.length > 1
                ? `Apply ${selectedLocations.length} Locations`
                : selectedLocations.length === 1
                ? 'Apply Selected Location'
                : 'View All Gauteng Locations'}
            </span>
          </button>
        </div>
      </main>
    </div>
  );
};
