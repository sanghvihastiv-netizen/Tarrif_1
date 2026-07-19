'use client';

import { useState } from 'react';
import { Globe3D } from '@/app/components/Globe3D';
import { Calendar, Ship, Package, Search, MapPin, Clock } from 'lucide-react';

export default function SchedulesPage() {
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [date, setDate] = useState('2026-07-20');
  const [containerType, setContainerType] = useState('40dry');
  const [vesselFlag, setVesselFlag] = useState('');
  const [temperatureControlled, setTemperatureControlled] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search logic
    console.log('Searching schedules...', { fromLocation, toLocation, date, containerType, vesselFlag, temperatureControlled });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Left Panel - Search Form */}
        <div className="lg:w-1/2 p-8 overflow-y-auto bg-gradient-to-b from-black to-zinc-900">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold mb-2">Schedules</h1>
            <p className="text-gray-400 text-sm mb-8">
              Search our extensive routes to find the schedule which fits your supply chain.
            </p>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 bg-white/5 rounded-lg p-1">
              <button className="flex-1 px-4 py-2 rounded-md bg-amber-500 text-black font-medium text-sm">
                Point-to-Point
              </button>
              <button className="flex-1 px-4 py-2 rounded-md text-gray-400 hover:text-white transition text-sm">
                Port Calls
              </button>
              <button className="flex-1 px-4 py-2 rounded-md text-gray-400 hover:text-white transition text-sm">
                Vessel Schedules
              </button>
            </div>

            {/* Container Type Selector */}
            <div className="flex gap-2 mb-6 bg-white/5 rounded-lg p-1 w-fit">
              <button className="px-4 py-2 rounded-md bg-amber-500 text-black font-medium text-sm flex items-center gap-2">
                <Package className="w-4 h-4" />
                Containers
              </button>
              <button className="px-4 py-2 rounded-md text-gray-400 hover:text-white transition text-sm flex items-center gap-2">
                <Package className="w-4 h-4" />
                Boxes & Pallets
              </button>
            </div>

            <form onSubmit={handleSearch} className="space-y-6">
              {/* Locations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    From (City, Country/Region)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type="text"
                      value={fromLocation}
                      onChange={(e) => setFromLocation(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
                      placeholder="Shanghai, China"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    To (City, Country/Region)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type="text"
                      value={toLocation}
                      onChange={(e) => setToLocation(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
                      placeholder="Rotterdam, Netherlands"
                    />
                  </div>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Container Type */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Container type
                </label>
                <select
                  value={containerType}
                  onChange={(e) => setContainerType(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition appearance-none"
                >
                  <option value="20dry">20' Dry</option>
                  <option value="40dry">40' Dry High</option>
                  <option value="40reefer">40' Reefer</option>
                  <option value="45dry">45' Dry High</option>
                  <option value="20reefer">20' Reefer</option>
                  <option value="open-top">Open Top</option>
                  <option value="flat-rack">Flat Rack</option>
                </select>
              </div>

              {/* Temperature Control */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={temperatureControlled}
                  onChange={(e) => setTemperatureControlled(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                />
                <label className="text-sm text-gray-400">
                  Cargo requires temperature control
                </label>
              </div>

              {/* Vessel Flag */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Vessel flag (optional)
                </label>
                <select
                  value={vesselFlag}
                  onChange={(e) => setVesselFlag(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition appearance-none"
                >
                  <option value="">Please select</option>
                  <option value="panama">Panama</option>
                  <option value="liberia">Liberia</option>
                  <option value="marshall">Marshall Islands</option>
                  <option value="hongkong">Hong Kong</option>
                  <option value="singapore">Singapore</option>
                  <option value="bahamas">Bahamas</option>
                </select>
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                Search Schedules
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel - 3D Globe */}
        <div className="lg:w-1/2 h-[50vh] lg:h-screen bg-black/90 relative">
          <Globe3D />
          
          {/* Overlay stats */}
          <div className="absolute bottom-6 left-6 right-6 flex gap-4 text-xs text-gray-400 bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-2">
              <Ship className="w-4 h-4 text-amber-400" />
              <span>1,247 active vessels</span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Live tracking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}