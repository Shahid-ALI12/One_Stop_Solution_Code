/**
 * Custom React hooks for fetching & mutating backend data.
 *
 * Each hook encapsulates loading/error state and exposes simple
 * mutation functions that automatically refresh the relevant list.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  apiClient,
  ApiService,
  ApiRating,
  ApiResource,
  ApiTeamMember,
  ApiSiteStats,
  ApiEnquiry,
  ApiConsultation,
  getToken,
  setToken,
} from '../api/client';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/* ------------------- useSiteData -------------------
 * Loads ALL public site data (services, ratings, resources,
 * team, stats, faqs, contact platforms) in parallel on mount.
 * Used by the public site. If the backend is unreachable,
 * the consuming component is responsible for falling back
 * to its imported mockData defaults.
 */
export function useSiteData() {
  const [services, setServices] = useState<ApiService[]>([]);
  const [ratings, setRatings] = useState<ApiRating[]>([]);
  const [resources, setResources] = useState<ApiResource[]>([]);
  const [teamMembers, setTeamMembers] = useState<ApiTeamMember[]>([]);
  const [stats, setStats] = useState<ApiSiteStats>({ clients: 0, orders: 0, countries: 0, label: '' });
  const [faqs, setFaqs] = useState<any[]>([]);
  const [contactPlatforms, setContactPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        apiClient.getServices(),
        apiClient.getApprovedRatings(),
        apiClient.getResources(),
        apiClient.getTeamMembers(),
        apiClient.getStats(),
        apiClient.getFaqs(true),
        apiClient.getContactPlatforms(true),
      ]);
      if (results[0].status === 'fulfilled') setServices(results[0].value);
      if (results[1].status === 'fulfilled') setRatings(results[1].value);
      if (results[2].status === 'fulfilled') setResources(results[2].value);
      if (results[3].status === 'fulfilled') setTeamMembers(results[3].value);
      if (results[4].status === 'fulfilled') setStats(results[4].value);
      if (results[5].status === 'fulfilled') setFaqs(results[5].value);
      if (results[6].status === 'fulfilled') setContactPlatforms(results[6].value);
      // Surface an error only if EVERY call failed — otherwise we still
      // have partial data and the user can use the site.
      const allFailed = results.every((r) => r.status === 'rejected');
      if (allFailed) setError('Failed to load site data');
    } catch (e: any) {
      setError(e?.message || 'Failed to load site data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    services,
    ratings,
    resources,
    teamMembers,
    stats,
    faqs,
    contactPlatforms,
    loading,
    error,
    refresh,
    setStats,
    setFaqs,
    setContactPlatforms,
  };
}

/* ------------------- useAdminAuth -------------------
 *
 * DEMO-MODE FALLBACK:
 * When the FastAPI backend at http://localhost:8000 is unreachable
 * (e.g. on a static preview / GitHub Pages / no backend running),
 * the real `/auth/login` endpoint will fail with ERR_CONNECTION_REFUSED.
 *
 * To keep the admin dashboard usable in those environments, we fall
 * back to a local "demo token" that is accepted by this frontend
 * without a backend roundtrip. ANY non-empty username/password
 * combination will then succeed.
 *
 * Demo tokens are prefixed with `demo:` so we can detect them and
 * skip the `/auth/me` verification call (which would otherwise 401
 * against a dead backend and log the user out immediately).
 *
 * ⚠️ This is a temporary convenience for previewing only. Real
 *    authentication is still performed first; demo mode only kicks
 *    in when the network call fails. Remove this fallback once the
 *    backend is deployed to a public host.
 */
const DEMO_TOKEN_PREFIX = 'demo:';

function isDemoToken(t: string | null): boolean {
  return !!t && t.startsWith(DEMO_TOKEN_PREFIX);
}

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!getToken());
  const [checking, setChecking] = useState<boolean>(!!getToken());

  useEffect(() => {
    const t = getToken();
    if (!t) {
      setChecking(false);
      return;
    }
    // Demo tokens are trusted locally — no backend verification.
    if (isDemoToken(t)) {
      setIsAuthenticated(true);
      setChecking(false);
      return;
    }
    apiClient
      .getMe()
      .then(() => setIsAuthenticated(true))
      .catch(() => {
        setToken(null);
        setIsAuthenticated(false);
      })
      .finally(() => setChecking(false));
  }, []);

  // Listen for auth-expired events dispatched by the API client's 401
  // interceptor. Without this, the dashboard would stay mounted showing
  // broken-data UI until the user manually refreshes.
  useEffect(() => {
    const onAuthExpired = () => {
      setIsAuthenticated(false);
    };
    window.addEventListener('oss:auth-expired', onAuthExpired);
    return () => window.removeEventListener('oss:auth-expired', onAuthExpired);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    // 1) Try the real backend first — preserves production behavior.
    try {
      const res = await apiClient.login(username, password);
      setToken(res.token);
      setIsAuthenticated(true);
      return res;
    } catch (err: any) {
      // 2) Network errors only (connection refused / timeout / CORS).
      //    HTTP 4xx from the backend (wrong password, etc.) should NOT
      //    fall through to demo mode — that would let attackers bypass
      //    real auth by just typing wrong creds.
      const isNetworkError =
        err?.message === 'Network Error' ||
        err?.code === 'ERR_NETWORK' ||
        err?.code === 'ECONNABORTED' ||
        err?.code === 'ERR_CONNECTION_REFUSED' ||
        (typeof err?.message === 'string' &&
          /network|fetch|connection|timeout/i.test(err.message));

      if (!isNetworkError) {
        throw err; // re-throw — let the modal show "Invalid credentials"
      }

      // 3) Backend is unreachable → grant a demo session.
      //
      // SECURITY: demo mode is gated behind VITE_ENABLE_DEMO_LOGIN=true OR
      // localhost dev origins. In production deployments (where the backend
      // is reachable), this branch never executes anyway because real auth
      // succeeded above. The gate is a defence-in-depth: if an attacker
      // somehow blocks the backend (DNS poisoning, etc.) on a prod domain,
      // they should NOT be able to log in with arbitrary creds.
      const isDevOrigin =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname === 'preview');
      const demoAllowed =
        isDevOrigin ||
        (import.meta as any).env?.VITE_ENABLE_DEMO_LOGIN === 'true';
      if (!demoAllowed) {
        throw new Error(
          'Backend is unreachable and demo login is disabled. ' +
            'Set VITE_ENABLE_DEMO_LOGIN=true or contact the site administrator.',
        );
      }

      const demoToken = DEMO_TOKEN_PREFIX + btoa(`${username}:${Date.now()}`);
      setToken(demoToken);
      setIsAuthenticated(true);
      return { token: demoToken, username };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, checking, login, logout };
}

/* ------------------- useDashboard -------------------
 * Loads the aggregated dashboard analytics endpoint. Used by
 * the AdminDashboard analytics tab so charts render from real
 * backend data (visits by country, contact method breakdown,
 * per-service rating distribution, totals).
 */
export function useDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getDashboard();
      setDashboard(data);
    } catch (e: any) {
      // Likely 401/403 (not admin) or network error — keep silent.
      setError(e?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { dashboard, loading, error, refresh };
}

/* ------------------- useAdminUsers -------------------
 * Admin user management (CRUD). Used by the Admin Users tab.
 */
export function useAdminUsers() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getAdminUsers();
      setAdmins(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (payload: { username: string; password: string; display_name?: string; is_active?: boolean }) => {
    const created = await apiClient.createAdminUser(payload);
    setAdmins((prev) => [...prev, created]);
    return created;
  }, []);

  const update = useCallback(async (id: number, patch: any) => {
    const updated = await apiClient.updateAdminUser(id, patch);
    setAdmins((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  }, []);

  const remove = useCallback(async (id: number) => {
    await apiClient.deleteAdminUser(id);
    setAdmins((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { admins, loading, error, refresh, create, update, remove };
}

/* ------------------- useAdminData -------------------
 * Loads all admin-only data (enquiries, consultations,
 * all ratings including unapproved). Used by AdminDashboard.
 */
export function useAdminData() {
  const [enquiries, setEnquiries] = useState<ApiEnquiry[]>([]);
  const [consultations, setConsultations] = useState<ApiConsultation[]>([]);
  const [allRatings, setAllRatings] = useState<ApiRating[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    // Use allSettled so a single 401/timeout on one endpoint doesn't wipe
    // the other two. Each fulfilled promise sets its own slice of state.
    const results = await Promise.allSettled([
      apiClient.getEnquiries(),
      apiClient.getConsultations(),
      apiClient.getAllRatings(),
    ]);
    if (results[0].status === 'fulfilled') setEnquiries(results[0].value);
    if (results[1].status === 'fulfilled') setConsultations(results[1].value);
    if (results[2].status === 'fulfilled') setAllRatings(results[2].value);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  /* ---- Mutations ---- */
  const toggleEnquiryAnswered = useCallback(async (id: string, isAnswered: boolean) => {
    // Optimistic update
    setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, isAnswered } : e)));
    try {
      const updated = await apiClient.updateEnquiry(id, { isAnswered });
      setEnquiries((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch {
      // Revert on failure
      setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, isAnswered: !isAnswered } : e)));
    }
  }, []);

  const deleteEnquiry = useCallback(async (id: string) => {
    setEnquiries((prev) => prev.filter((e) => e.id !== id));
    try {
      await apiClient.deleteEnquiry(id);
    } catch {
      // Re-fetch on failure
      refreshAll();
    }
  }, [refreshAll]);

  const toggleConsultationAnswered = useCallback(async (id: string, isAnswered: boolean) => {
    setConsultations((prev) => prev.map((c) => (c.id === id ? { ...c, isAnswered } : c)));
    try {
      const updated = await apiClient.updateConsultation(id, { isAnswered });
      setConsultations((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch {
      setConsultations((prev) => prev.map((c) => (c.id === id ? { ...c, isAnswered: !isAnswered } : c)));
    }
  }, []);

  const deleteConsultation = useCallback(async (id: string) => {
    setConsultations((prev) => prev.filter((c) => c.id !== id));
    try {
      await apiClient.deleteConsultation(id);
    } catch {
      refreshAll();
    }
  }, [refreshAll]);

  const toggleRatingApproval = useCallback(async (id: string, isApproved: boolean) => {
    setAllRatings((prev) => prev.map((r) => (r.id === id ? { ...r, isApproved } : r)));
    try {
      const updated = await apiClient.updateRating(id, { isApproved });
      setAllRatings((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      setAllRatings((prev) => prev.map((r) => (r.id === id ? { ...r, isApproved: !isApproved } : r)));
    }
  }, []);

  const deleteRating = useCallback(async (id: string) => {
    setAllRatings((prev) => prev.filter((r) => r.id !== id));
    try {
      await apiClient.deleteRating(id);
    } catch {
      refreshAll();
    }
  }, [refreshAll]);

  const saveStats = useCallback(async (patch: Partial<ApiSiteStats>) => {
    try {
      const updated = await apiClient.updateStats(patch);
      return updated;
    } catch (e) {
      throw e;
    }
  }, []);

  return {
    enquiries,
    consultations,
    allRatings,
    loading,
    refreshAll,
    setEnquiries,
    setConsultations,
    setAllRatings,
    toggleEnquiryAnswered,
    deleteEnquiry,
    toggleConsultationAnswered,
    deleteConsultation,
    toggleRatingApproval,
    deleteRating,
    saveStats,
  };
}

/* ------------------- useResourceDownload ------------------- */
export function useResourceDownload() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const download = useCallback(async (resourceId: string) => {
    setDownloadingId(resourceId);
    try {
      const updated = await apiClient.incrementResourceDownload(resourceId);
      return updated;
    } finally {
      setDownloadingId(null);
    }
  }, []);

  return { download, downloadingId };
}
