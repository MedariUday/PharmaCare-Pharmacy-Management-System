import { useState, useEffect, useCallback, useRef } from 'react';
import { getStaffDashboardSummary } from '../services/api';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

/**
 * Custom hook for polling /api/staff/dashboard-summary.
 * - Fetches immediately on mount, then every 30 seconds.
 * - On error: retains last known good values, sets summaryError.
 * - Cleaned up on unmount (no memory leaks).
 *
 * Returns: { summary, loadingSummary, summaryError, lastUpdated, refetch }
 */
export function useStaffDashboardSummary() {
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  const fetchSummary = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoadingSummary(true);
    try {
      const res = await getStaffDashboardSummary();
      if (!mountedRef.current) return;
      setSummary(res.data);
      setSummaryError(null);
      setLastUpdated(new Date());
    } catch (err) {
      if (!mountedRef.current) return;
      // Keep last known values; just flag the error
      setSummaryError(err.response?.data?.detail || 'Could not refresh data');
    } finally {
      if (mountedRef.current) setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Immediate fetch
    fetchSummary(false);

    // Background polling
    intervalRef.current = setInterval(() => fetchSummary(true), POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
    };
  }, [fetchSummary]);

  return {
    summary,
    loadingSummary,
    summaryError,
    lastUpdated,
    refetch: () => fetchSummary(false),
  };
}
