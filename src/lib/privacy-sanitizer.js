export function sanitizePosthogEvent(event) {
  const campaign = /^(?:utm_|campaign)|^(?:fbc|fbp|gclid|dclid|fbclid|gbraid|wbraid|msclkid|ttclid|li_fat_id|twclid|gad_source|mc_cid|mc_eid|gclsrc|igshid|rdt_cid|epik|qclid|sccid|irclid|irclickid|_kx|adgroup|ad_id|creative|keyword|matchtype)$/i;
  const acquisitionKey = (key) => key.toLowerCase().replace(/^\$/, '').replace(/^(?:initial|session_entry|session_exit)_/, '');
  const credential = /^(?:password|passwd|client_secret|access_token|refresh_token|secret|authorization|api_key)$/i;
  const clean = (value, key = '', publicTokenPosition = false) => {
    if (campaign.test(acquisitionKey(key))) return undefined;
    if (credential.test(acquisitionKey(key)) || /(?:^|[_$])(token|api_key|authorization)$/i.test(key) && !(key === 'token' && publicTokenPosition && typeof value === 'string' && /^phc_[A-Za-z0-9]+$/.test(value))) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      if (/^(?:https?:)?\/\//i.test(value)) {
        try { const url = new URL(value, 'https://modepot.io'); return url.origin + url.pathname; }
        catch { return undefined; }
      }
      return value;
    }
    if (Array.isArray(value)) return value.map(item => clean(item)).filter(item => item !== undefined);
    if (value && typeof value === 'object') {
      const result = {};
      for (const [childKey, child] of Object.entries(value)) {
        const sanitized = clean(child, childKey, key === 'properties' && childKey === 'token');
        if (sanitized !== undefined) result[childKey] = sanitized;
      }
      return result;
    }
    return value;
  };
  return clean(event);
}
