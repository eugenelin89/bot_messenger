// Cosmetic metadata only. Worker IDs and principal records remain identity authority.
const portraits = Object.freeze({
  Atlas: '/images/workers/atlas.webp', Maya: '/images/workers/maya.webp',
  Turing: '/images/workers/turing.webp', Linus: '/images/workers/linus.webp',
  Ada: '/images/workers/ada.webp', Grace: '/images/workers/grace.webp',
  Scout: '/images/workers/scout.webp',
});
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export function portraitForWorker(worker) {
  return worker?.worker_id && worker.role !== 'computer_operator' &&
    Object.hasOwn(portraits, worker.display_name) ? portraits[worker.display_name] : null;
}
function avatar(name, src, {size='normal', className=''}={}) {
  const dimension = size === 'large' ? 48 : size === 'compact' ? 26 : 34;
  const tone = name === 'Owner' ? 'human' : ['Human','System',...Object.keys(portraits)].includes(name) ? name.toLowerCase() : 'worker';
  return `<span class="avatar ${tone} avatar-${escape(size)} ${escape(className)}" aria-hidden="true"><span class="avatar-initials">${escape(name.slice(0,2).toUpperCase())}</span>${src ? `<img class="worker-portrait" src="${src}" alt="" width="${dimension}" height="${dimension}">` : ''}</span>`;
}
export function workerAvatar(worker, options) {
  return avatar(worker?.display_name ?? 'Unknown', portraitForWorker(worker), options);
}
export function fallbackAvatar(name='Unknown', options) { return avatar(name, null, options); }
// Use beside a specific responsible actor. Raw evidence and select options remain text.
export function workerIdentity(worker, options={size:'compact'}) {
  return `<span class="worker-identity">${workerAvatar(worker, options)}<span>${escape(worker?.display_name ?? 'Unknown')}</span></span>`;
}
// Capture image errors before any render. No inline handlers, remote retry or HQ state change.
export function installPortraitFallback(root=document) {
  root.addEventListener('error', event => {
    if (event.target instanceof HTMLImageElement && event.target.classList.contains('worker-portrait')) event.target.remove();
  }, true);
}
