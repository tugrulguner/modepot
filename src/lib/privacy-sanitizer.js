export function sanitizePosthogEvent(event) {
  const campaign = /campaign|utm_|(?:^|[_$])(fbc|fbp|gclid|dclid|fbclid|gbraid|wbraid|msclkid|ttclid|li_fat_id|twclid|gad_source|mc_cid|mc_eid|gclsrc|igshid|rdt_cid|epik|qclid|sccid|irclid|irclickid|_kx)/i;
  const clean = (value, key = '') => {
    if (campaign.test(key)) return undefined;
    if (/(?:^|[_$])(token|api_key|authorization)$/i.test(key) && !(key === 'token' && typeof value === 'string' && /^phc_[A-Za-z0-9]+$/.test(value))) return undefined;
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
        const sanitized = clean(child, childKey);
        if (sanitized !== undefined) result[childKey] = sanitized;
      }
      return result;
    }
    return value;
  };
  return clean(event);
}
