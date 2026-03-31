import { useState, useEffect, useCallback } from 'react';
import { getAdminReportSummary } from '../services/api';

export default function useAdminReportSummary(intervalMs = 30000) {
  const [data, setData] = useState({
    total_revenue: 0,
    today_revenue: 0,
    total_bills: 0,
    today_bills: 0,
    total_customers: 0,
    low_stock_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await getAdminReportSummary();
      setData(response.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err);
      console.error("Failed to fetch admin report summary:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, intervalMs);
    return () => clearInterval(interval);
  }, [fetchData, intervalMs]);

  return { data, loading, error, lastUpdated, refetch: fetchData };
}
