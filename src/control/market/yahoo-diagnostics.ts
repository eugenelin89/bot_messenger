/** Non-data diagnostics only. Never serialize an exception, address, hostname or TLS certificate. */
export const yahooStages = ['exchange_started', 'request_validated', 'request_reserved', 'dns_started',
  'dns_resolved', 'destination_validated', 'wire_intent', 'request_created', 'socket_assigned',
  'tcp_connected', 'tls_established', 'request_finished', 'response_headers', 'response_complete'] as const;
export type YahooStage = typeof yahooStages[number];
export interface YahooStageConfirmation {
  stage: YahooStage; at: string; elapsedMs: number;
}
export type YahooFailureCategory = 'response' | 'dns_failure' | 'dns_timeout' | 'destination_denied'
  | 'local_configuration' | 'local_permission' | 'tcp_failure' | 'tcp_timeout' | 'tls_failure'
  | 'tls_timeout' | 'connection_reset' | 'request_write_failure' | 'request_write_timeout' | 'response_timeout'
  | 'response_invalid' | 'http_refused' | 'http_rate_limited' | 'http_redirect_denied'
  | 'http_transient' | 'cancelled' | 'transport_timeout' | 'indeterminate' | 'settlement_unknown';
const nodeCodes = ['ENOTFOUND', 'EAI_AGAIN', 'EAI_FAIL', 'EAI_NODATA', 'ETIMEOUT', 'ETIMEDOUT',
  'ECONNREFUSED', 'ENETUNREACH', 'EHOSTUNREACH', 'EADDRNOTAVAIL', 'EACCES', 'EPERM',
  'ECONNRESET', 'EPIPE', 'ERR_STREAM_WRITE_AFTER_END', 'ERR_STREAM_DESTROYED',
  'ERR_INVALID_IP_ADDRESS', 'ERR_INVALID_ARG_TYPE', 'ERR_INVALID_ARG_VALUE', 'ABORT_ERR',
  'ERR_TLS_CERT_ALTNAME_INVALID', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN',
  'CERT_HAS_EXPIRED', 'CERT_NOT_YET_VALID', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'ERR_TLS_CERT_SIGNATURE_ALGORITHM_UNSUPPORTED',
  'ERR_SSL_WRONG_VERSION_NUMBER', 'ERR_SSL_SSLV3_ALERT_HANDSHAKE_FAILURE',
  'ERR_SSL_TLSV1_ALERT_PROTOCOL_VERSION', 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR'] as const;
type NodeCode = typeof nodeCodes[number];
// Exact source-owned validation tokens, not a regex accepting arbitrary exception text.
const validationCodes = ['yahoo_protected_address', 'yahoo_response_limit', 'yahoo_response_size',
  'yahoo_compressed_response', 'yahoo_header_schema', 'yahoo_cookie_limit', 'yahoo_cookie_size',
  'yahoo_cookie_schema', 'yahoo_cookie_domain', 'yahoo_cookie_path', 'yahoo_cookie_age',
  'yahoo_cookie_requires_secure', 'yahoo_bootstrap_barrier', 'yahoo_crumb_schema',
  'yahoo_response_aborted', 'yahoo_response_incomplete', 'yahoo_response_schema',
  'yahoo_request_method', 'yahoo_request_params', 'yahoo_endpoint', 'yahoo_duplicate_parameter',
  'yahoo_crumb_size', 'yahoo_chart_settings', 'yahoo_history_unbounded', 'yahoo_history_range',
  'yahoo_quote_settings', 'yahoo_statement_settings', 'yahoo_statement_fields',
  'yahoo_statement_frequency', 'yahoo_statement_range', 'probe_transient_retry_limit',
  'probe_budget_exhausted', 'probe_wire_busy_or_denied', 'probe_inactive', 'probe_source_changed',
  'probe_expired_or_clock_reversal', 'probe_private_path', 'probe_anchor_changed',
  'probe_accounting_uncertain', 'probe_accounting_size', 'probe_short_write',
  'probe_logical_scope', 'probe_history_epochs', 'probe_statement_epochs', 'probe_helper_epochs',
  'probe_statement_fields', 'probe_wire_interval', 'probe_wire_without_reservation'] as const;

export interface YahooTransportDiagnostic {
  version: 1;
  lastConfirmed: YahooStageConfirmation;
  category: YahooFailureCategory;
  code: string;
  nodeCode: NodeCode | null;
  transmission: 'not_started' | 'indeterminate' | 'http_response';
}
export class YahooTransportError extends Error {
  constructor(readonly diagnostic: YahooTransportDiagnostic) { super(diagnostic.code); this.name = 'YahooTransportError'; }
}
export function yahooDiagnostic(last: YahooStageConfirmation, error: unknown, status: number | null,
  wireIntent: boolean, stop: 'timeout' | 'cancelled' | null = null, settlement = false): YahooTransportDiagnostic {
  const rawCode = (error as NodeJS.ErrnoException | null)?.code;
  const nodeCode = nodeCodes.includes(rawCode as NodeCode) ? rawCode as NodeCode : null;
  const message = error instanceof Error ? error.message : '';
  const validation = (validationCodes as readonly string[]).includes(message) ? message : null;
  let category: YahooFailureCategory = 'indeterminate', code = 'yahoo_transport_unknown';
  const stage = last.stage;
  if (settlement) { category = 'settlement_unknown'; code = 'yahoo_settlement_unknown'; }
  else if (stop === 'cancelled') { category = 'cancelled'; code = 'yahoo_cancelled'; }
  else if (stop === 'timeout' || nodeCode === 'ETIMEDOUT' || nodeCode === 'ETIMEOUT') {
    category = stage === 'dns_started' ? 'dns_timeout'
      : stage === 'tcp_connected' ? 'tls_timeout'
      : stage === 'tls_established' ? 'request_write_timeout'
      : ['request_finished', 'response_headers'].includes(stage) ? 'response_timeout'
      : ['wire_intent', 'request_created', 'socket_assigned'].includes(stage) ? 'tcp_timeout' : 'transport_timeout';
    code = `yahoo_${category}`;
  } else if (['EACCES', 'EPERM'].includes(nodeCode ?? '')) { category = 'local_permission'; code = 'yahoo_local_permission'; }
  else if (['ERR_INVALID_IP_ADDRESS', 'ERR_INVALID_ARG_TYPE', 'ERR_INVALID_ARG_VALUE'].includes(nodeCode ?? '')) {
    category = 'local_configuration'; code = 'yahoo_local_configuration';
  } else if (stage === 'dns_started') { category = 'dns_failure'; code = 'yahoo_dns_failure'; }
  else if (stage === 'exchange_started' || validation === 'yahoo_protected_address') { category = 'destination_denied'; code = validation ?? 'yahoo_destination_denied'; }
  else if (nodeCode && (nodeCode.startsWith('ERR_TLS_') || nodeCode.startsWith('ERR_SSL_') ||
    ['DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN', 'CERT_HAS_EXPIRED', 'CERT_NOT_YET_VALID', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY'].includes(nodeCode))) {
    category = 'tls_failure'; code = 'yahoo_tls_failure';
  } else if (['ECONNREFUSED', 'ENETUNREACH', 'EHOSTUNREACH', 'EADDRNOTAVAIL'].includes(nodeCode ?? '')) { category = 'tcp_failure'; code = 'yahoo_tcp_failure'; }
  else if (nodeCode === 'ECONNRESET' || validation === 'yahoo_response_aborted') { category = 'connection_reset'; code = 'yahoo_connection_reset'; }
  else if (['EPIPE', 'ERR_STREAM_WRITE_AFTER_END', 'ERR_STREAM_DESTROYED'].includes(nodeCode ?? '')) { category = 'request_write_failure'; code = 'yahoo_request_write_failure'; }
  else if (error) { category = stage === 'response_headers' ? 'response_invalid' : 'indeterminate'; code = validation ?? 'yahoo_transport_unknown'; }
  else if (status === 429) { category = 'http_rate_limited'; code = 'yahoo_rate_limited'; }
  else if (status !== null && [502, 503, 504].includes(status)) { category = 'http_transient'; code = 'yahoo_transient'; }
  else if (status !== null && status >= 400) { category = 'http_refused'; code = 'yahoo_http_refused'; }
  else if (status !== null && status >= 300) { category = 'http_redirect_denied'; code = 'yahoo_http_or_redirect_denied'; }
  else { category = 'response'; code = 'response'; }
  return { version: 1, lastConfirmed: { ...last }, category, code, nodeCode,
    transmission: status !== null ? 'http_response' : wireIntent ? 'indeterminate' : 'not_started' };
}
