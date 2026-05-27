/** Base path for report metrics API — authenticated vs public share link. */
export function reportMetricsBase(reportId: string, shareToken?: string): string {
  if (shareToken) return `/reports/shared/${shareToken}/metrics`
  return `/reports/${reportId}/metrics`
}

export function reportMetricsPath(
  reportId: string,
  suffix: string,
  shareToken?: string,
): string {
  return `${reportMetricsBase(reportId, shareToken)}/${suffix}`
}
