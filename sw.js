/* Service worker d'Oreille.
   ⚠️ LE NUMÉRO DE VERSION EST LE SEUL PIÈGE DES PWA : sans changement ici, les
   testeurs restent sur l'ancienne version sans comprendre pourquoi. À incrémenter
   à CHAQUE livraison. */
const VERSION = 'earup-v12';
const COQUE = ['./', './index.html', './manifest.webmanifest', './icone.svg'];

self.addEventListener('install', e => {
  // la coque est mise en cache tout de suite ; les sons viendront à l'usage
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(COQUE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  // on efface les caches des versions précédentes, jamais celui-ci
  e.waitUntil(caches.keys()
    .then(l => Promise.all(l.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if(e.request.method !== 'GET' || url.origin !== location.origin) return;

  /* ⭐ Deux stratégies, et c'est ce qui fait tout : les SONS ne changent
     pratiquement jamais et pèsent lourd — on les sert depuis le cache sans même
     interroger le réseau. Le CODE, lui, change souvent : on va le chercher, et le
     cache ne sert que de filet en cas de coupure. */
  const estSon = /\.(mp3|m4a|wav|ogg|opus|flac)$/i.test(url.pathname)
              || url.pathname.endsWith('instruments.json')
              || url.pathname.endsWith('index.json');

  if(estSon){
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(rep => {
      if(rep.ok) { const copie = rep.clone(); caches.open(VERSION).then(c => c.put(e.request, copie)); }
      return rep;
    })));
    return;
  }

  e.respondWith(fetch(e.request).then(rep => {
    if(rep.ok){ const copie = rep.clone(); caches.open(VERSION).then(c => c.put(e.request, copie)); }
    return rep;
  }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
