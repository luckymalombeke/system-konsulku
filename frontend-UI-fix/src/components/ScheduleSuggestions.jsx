import React, { useState, useEffect } from 'react';
import { Zap, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { suggestScheduleSlots } from '../api';

export const ScheduleSuggestions = ({ dosenId, topic, onSelectSlot }) => {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const fetchSuggestions = async () => {
    if (!dosenId || !topic) {
      setError('Pilih dosen dan topik terlebih dahulu');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await suggestScheduleSlots(dosenId, topic);
      setSuggestions(data);
      setExpanded(true);
    } catch (err) {
      setError(err.message || 'Gagal mendapatkan saran jadwal');
      console.error('Error fetching suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = (slot) => {
    const [date, time] = slot.slot_date_time.split(' ');
    onSelectSlot({ date, time });
  };

  return (
    <div className="space-y-3">
      {/* Button untuk trigger AI suggestions */}
      {!expanded && (
        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>AI sedang mencari jadwal terbaik...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>AI Suggest Jadwal Terbaik</span>
            </>
          )}
        </button>
      )}

      {/* Suggestions Results */}
      {expanded && suggestions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              {suggestions.message}
            </h3>
            <button
              onClick={() => {
                setExpanded(false);
                setSuggestions(null);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Tutup
            </button>
          </div>

          {/* Suggestion Cards */}
          <div className="space-y-2">
            {suggestions.suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSlot(suggestion)}
                className="bg-white border-2 border-blue-200 rounded-lg p-3 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-blue-600">
                        {suggestion.slot_date_time}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                        Prioritas {suggestion.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{suggestion.reasoning}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-2">
                      Confidence: {(suggestion.confidence * 100).toFixed(0)}%
                    </div>
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${suggestion.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-blue-700 text-center">
            Klik slot untuk memilih jadwal
          </p>
        </div>
      )}

      {/* Error State */}
      {expanded && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => {
              setExpanded(false);
              setError(null);
            }}
            className="text-red-600 hover:text-red-800"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
