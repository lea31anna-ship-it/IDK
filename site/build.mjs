// Baut die öffentliche Website (GitHub Pages) nach site/dist:
//   index.html        Startseite für Eltern (SEO, Kontakt, FAQ)
//   app/              die Lerniversum-App (freie Version + Codes)
//   impressum.html, datenschutz.html, sitemap.xml, robots.txt
// Aufruf: node site/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SITE = path.join(ROOT, 'site'), OUT = path.join(SITE, 'dist'), PUB = path.join(ROOT, 'public');
const c = JSON.parse(fs.readFileSync(path.join(SITE, 'config.json'), 'utf8'));
const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const base = (c.eigeneDomain ? `https://${c.eigeneDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')}/` : c.siteUrl.replace(/\/?$/, '/'));
const imp = c.impressum || {};
const impressumOk = !!(imp.nameOderFirma && imp.anschrift && (c.email || c.telefon));
const indexable = c.bereit === true && impressumOk;
const where = c.ort ? ` in ${c.ort}` : c.region ? ` in ${c.region}` : '';
const title = `${c.praxisName} – Lerncoaching bei Legasthenie & Dyskalkulie${where}`;
const desc = `Einfühlsames Lerncoaching bei Legasthenie (LRS) und Dyskalkulie${where}${c.coachName ? ' mit ' + c.coachName : ''}: individuelle Förderung, Lernstandserhebung und die kostenlose Lern-App ${c.praxisName} für Volksschule und Unterstufe.`;
const tel = String(c.telefon || '').replace(/[^\d+]/g, '');
const waNum = (() => { let d = tel.replace('+', ''); if (tel.startsWith('00')) d = tel.slice(2); else if (tel.startsWith('0')) d = '43' + tel.slice(1); return /^\d{8,15}$/.test(d) ? d : ''; })();
const waText = encodeURIComponent(`Hallo${c.coachName ? ' ' + c.coachName : ''}! Ich interessiere mich für ein Lerncoaching für mein Kind.`);

const FAQ = [
  ['Was ist Legasthenie bzw. LRS?', 'Legasthenie ist eine Schwierigkeit beim Lesen und Schreiben, die nichts mit Intelligenz zu tun hat. Typisch sind z. B. das Verwechseln ähnlicher Buchstaben (b/d, d/t), Buchstabendreher oder langsames Lesen. Mit gezielter Förderung machen Kinder große Fortschritte.'],
  ['Was ist Dyskalkulie?', 'Dyskalkulie (Rechenschwäche) zeigt sich zum Beispiel durch Zählen statt Rechnen, Zahlendreher (21/12) oder Probleme mit dem Zehnerübergang. Wichtig ist, ein sicheres Zahl- und Mengenverständnis aufzubauen – zum Beispiel mit der „Kraft der 5“.'],
  ['Wie läuft das Lerncoaching ab?', 'Nach einem unverbindlichen Erstgespräch erhebe ich den Lernstand, wir legen gemeinsam Förderziele fest und arbeiten in regelmäßigen Einheiten. Zwischen den Stunden übt Ihr Kind spielerisch mit der Lerniversum-App – ich sehe dabei, welche Fehler passieren und wie es sich beim Lernen fühlt.'],
  ['Kostet die Lern-App etwas?', `Die freie Version der ${c.praxisName}-App ist kostenlos, ohne Werbung und ohne Anmeldung. Kinder im Coaching bekommen einen persönlichen Zugang mit freigeschalteten Themen und Lernwörtern.`],
  ['Für welches Alter ist das Angebot?', 'Für Kinder in der Volksschule und Unterstufe (ca. 6–14 Jahre) – von den ersten Buchstaben und Mengen bis zu Brüchen, Klapustri und Grammatik.'],
];

const contactButtons = `${waNum ? `<a class="btn primary" href="https://wa.me/${waNum}?text=${waText}" target="_blank" rel="noopener">💬 WhatsApp schreiben</a>` : ''}
  ${c.email ? `<a class="btn" href="mailto:${esc(c.email)}?subject=${encodeURIComponent('Anfrage Lerncoaching')}">✉️ E-Mail schreiben</a>` : ''}
  ${tel ? `<a class="btn" href="tel:${esc(tel)}">📞 ${esc(c.telefon)}</a>` : ''}`;

const head = (t, d, canon, extra = '') => `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t)}</title>
<meta name="description" content="${esc(d)}">
<link rel="canonical" href="${esc(canon)}">
${indexable ? '<meta name="robots" content="index, follow">' : '<meta name="robots" content="noindex, nofollow">'}
${c.googleVerifizierung ? `<meta name="google-site-verification" content="${esc(c.googleVerifizierung)}">` : ''}
<meta property="og:type" content="website"><meta property="og:title" content="${esc(t)}"><meta property="og:description" content="${esc(d)}"><meta property="og:url" content="${esc(canon)}"><meta property="og:locale" content="de_AT">
<link rel="icon" href="app/img/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="site.css">
${extra}
</head>`;

const nav = `<header class="top"><a class="brand" href="./">🪐 ${esc(c.praxisName)}</a><nav><a href="./#angebot">Angebot</a><a href="./#app">Lern-App</a><a href="./#faq">Fragen</a><a href="./#kontakt" class="btn small primary">Kontakt</a></nav></header>`;
const footer = `<footer><p>© ${new Date().getFullYear()} ${esc(c.praxisName)}${c.coachName ? ' · ' + esc(c.coachName) : ''}</p><p><a href="impressum.html">Impressum</a> · <a href="datenschutz.html">Datenschutz</a> · <a href="app/">Lern-App</a> · <a href="${esc(c.coachLoginUrl)}" rel="nofollow">Coach-Login</a></p></footer>`;

const jsonld = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': ['EducationalOrganization', 'LocalBusiness'], name: c.praxisName, description: desc, url: base, ...(c.telefon ? { telephone: c.telefon } : {}), ...(c.email ? { email: c.email } : {}), ...(c.ort ? { address: { '@type': 'PostalAddress', addressLocality: c.ort, addressCountry: 'AT' } } : {}), ...(c.region ? { areaServed: c.region } : {}), ...(c.coachName ? { founder: { '@type': 'Person', name: c.coachName, jobTitle: c.berufsbezeichnung } } : {}) },
    { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ],
};

const index = `${head(title, desc, base, `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>`)}
<body>
${nav}
<main>
  <section class="hero">
    <div>
      <p class="eyebrow">${esc(c.berufsbezeichnung)}${where}</p>
      <h1>Lernen mit Leichtigkeit – auch bei Legasthenie & Dyskalkulie</h1>
      <p class="lead">${c.coachName ? `Ich bin ${esc(c.coachName)} und begleite` : 'Ich begleite'} Kinder in der Volksschule und Unterstufe, die sich mit Lesen, Schreiben oder Rechnen schwertun – mit Geduld, einem genauen Blick auf die Ursachen und viel Ermutigung.</p>
      <div class="cta">${contactButtons || '<a class="btn primary" href="#kontakt">Kontakt</a>'}<a class="btn" href="app/">🚀 Lern-App gratis testen</a></div>
    </div>
    <div class="hero-art" aria-hidden="true"><span>🪐</span><span>🚀</span><span>⭐</span><span>🧑‍🚀</span></div>
  </section>

  <section id="angebot" class="band">
    <h2>Mein Angebot</h2>
    <ul class="cards">${(c.angebot || []).map(a => `<li>${esc(a)}</li>`).join('')}</ul>
    ${c.preis ? `<p class="price">${esc(c.einheit)}: <b>${esc(c.preis)}</b></p>` : ''}
  </section>

  <section class="band alt">
    <h2>So arbeite ich</h2>
    <ol class="steps">
      <li><b>Kennenlernen</b><span>Unverbindliches Erstgespräch mit Ihnen und Ihrem Kind.</span></li>
      <li><b>Lernstand erheben</b><span>Wo steht Ihr Kind in Mathe und Deutsch? Ein kurzer, spielerischer Einstufungstest gibt Orientierung.</span></li>
      <li><b>Förderplan</b><span>Gemeinsame Ziele – in kleinen, erreichbaren Schritten.</span></li>
      <li><b>Üben mit Freude</b><span>Regelmäßige Einheiten und die Lern-App für zu Hause, mit Rückmeldungen an Sie.</span></li>
    </ol>
  </section>

  <section id="app" class="band">
    <h2>Die Lerniversum-App</h2>
    <p class="lead">Kinder hüpfen mit ihrer Rakete von Planet zu Planet: von Mengen und der Kraft der 5 bis zu Brüchen, von Lauten wie b/p bis zur Grammatik.</p>
    <ul class="features">
      <li><span>🎯</span><b>Fehler verstehen</b> Jede falsche Antwort zeigt mir ein Fehlermuster – z. B. Zahlendreher oder b/d-Verwechslung.</li>
      <li><span>💛</span><b>Gefühle ernst nehmen</b> Vor und nach jeder Übung fragt die App, wie es dem Kind geht.</li>
      <li><span>🔊</span><b>Barrierearm</b> Vorlesen, farbige Silben, Lesefolien, große Schrift, kein Zeitdruck.</li>
      <li><span>🏆</span><b>Motivation</b> Pokale, Raumstationen, Rätsel – ohne Druck durch Streaks.</li>
    </ul>
    <p><a class="btn primary" href="app/">Jetzt kostenlos ausprobieren</a> <small class="muted">Keine Anmeldung, keine Werbung, keine Daten auf einem Server.</small></p>
  </section>

  ${c.ueberMich ? `<section class="band alt"><h2>Über mich</h2><p class="lead">${esc(c.ueberMich).replace(/\n/g, '<br>')}</p></section>` : ''}

  <section id="faq" class="band">
    <h2>Häufige Fragen</h2>
    ${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
  </section>

  <section id="kontakt" class="band alt">
    <h2>Kontakt</h2>
    <p class="lead">Ich freue mich auf Ihre Nachricht – gerne auch für ein kostenloses Erstgespräch.</p>
    <div class="cta">${contactButtons || '<p class="muted">Kontaktdaten folgen in Kürze.</p>'}</div>
    ${c.ort || c.region ? `<p class="muted">${esc([c.ort, c.region].filter(Boolean).join(' · '))}</p>` : ''}
  </section>
</main>
${footer}
</body></html>`;

const missing = '<span class="missing">[bitte ergänzen]</span>';
const impressum = `${head(`Impressum – ${c.praxisName}`, `Impressum von ${c.praxisName}`, base + 'impressum.html')}
<body>${nav}<main class="legal">
<h1>Impressum</h1>
<p>Informationspflicht laut § 5 E-Commerce-Gesetz, § 14 Unternehmensgesetzbuch bzw. Offenlegungspflicht laut § 25 Mediengesetz.</p>
<p><b>${esc(imp.nameOderFirma) || missing}</b><br>${esc(imp.anschrift).replace(/\n/g, '<br>') || missing}</p>
<p><b>Unternehmensgegenstand:</b> ${esc(imp.unternehmensgegenstand) || missing}</p>
${imp.uid ? `<p><b>UID-Nummer:</b> ${esc(imp.uid)}</p>` : ''}
${imp.gewerbebehoerde ? `<p><b>Gewerbebehörde:</b> ${esc(imp.gewerbebehoerde)}</p>` : ''}
${imp.kammer ? `<p><b>Mitglied bei:</b> ${esc(imp.kammer)}</p>` : ''}
${imp.berufsrecht ? `<p><b>Berufsrecht:</b> ${esc(imp.berufsrecht)}</p>` : ''}
<p><b>Kontakt:</b> ${[c.telefon && `Tel. ${esc(c.telefon)}`, c.email && `E-Mail: ${esc(c.email)}`].filter(Boolean).join(' · ') || missing}</p>
${impressumOk ? '' : '<p class="missing">Hinweis für die Betreiberin: Bitte die Angaben in site/config.json ergänzen. Solange das Impressum unvollständig ist, wird die Website nicht bei Google angezeigt.</p>'}
</main>${footer}</body></html>`;

const datenschutz = `${head(`Datenschutz – ${c.praxisName}`, `Datenschutzerklärung von ${c.praxisName}`, base + 'datenschutz.html')}
<body>${nav}<main class="legal">
<h1>Datenschutzerklärung</h1>
<p class="missing">Vorlage – bitte vor der Veröffentlichung prüfen bzw. prüfen lassen und an Ihre Situation anpassen.</p>
<h2>Verantwortliche</h2><p>${esc(imp.nameOderFirma) || missing}, ${esc(imp.anschrift).replace(/\n/g, ', ') || missing}${c.email ? `, ${esc(c.email)}` : ''}</p>
<h2>Website</h2><p>Diese Website wird über GitHub Pages (GitHub Inc., USA) bereitgestellt. Beim Aufruf verarbeitet der Hosting-Anbieter technisch notwendige Daten (z. B. IP-Adresse, Zeitpunkt, aufgerufene Seite), um die Seite auszuliefern und abzusichern. Es werden keine Cookies, keine Analyse- oder Werbedienste und keine externen Schriftarten verwendet.</p>
<h2>Lern-App (freie Version)</h2><p>Die freie Version der Lern-App speichert Lernfortschritt und Einstellungen ausschließlich lokal im Browser Ihres Geräts (localStorage). Diese Daten werden nicht an uns oder Dritte übertragen. Sie können sie jederzeit über die Browser-Einstellungen löschen.</p>
<h2>Lern-App mit persönlichem Zugang (Coaching)</h2><p>Kinder im Coaching erhalten einen persönlichen Link bzw. Code. Lernergebnisse verbleiben auf dem Gerät des Kindes und werden nur dann an die Coachin übermittelt, wenn Eltern den „Bericht“ aktiv per WhatsApp oder E-Mail senden. Rechtsgrundlage ist die Einwilligung der Erziehungsberechtigten bzw. der Coaching-Vertrag (Art. 6 Abs. 1 lit. a/b DSGVO).</p>
<h2>Kontaktaufnahme</h2><p>Wenn Sie uns per E-Mail oder WhatsApp kontaktieren, verarbeiten wir Ihre Angaben zur Bearbeitung der Anfrage. Für WhatsApp gelten zusätzlich die Datenschutzbestimmungen von WhatsApp (Meta).</p>
<h2>Vorlesefunktion</h2><p>Die Vorlesefunktion nutzt die Sprachausgabe Ihres Geräts bzw. Browsers. Je nach Gerät kann dabei ein Online-Sprachdienst des Geräteherstellers verwendet werden.</p>
<h2>Ihre Rechte</h2><p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch sowie das Recht auf Beschwerde bei der Österreichischen Datenschutzbehörde (dsb.gv.at).</p>
</main>${footer}</body></html>`;

// ---------- Ausgabe ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'app'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), index);
fs.writeFileSync(path.join(OUT, 'impressum.html'), impressum);
fs.writeFileSync(path.join(OUT, 'datenschutz.html'), datenschutz);
fs.copyFileSync(path.join(SITE, 'site.css'), path.join(OUT, 'site.css'));
for (const dir of ['js', 'css', 'img']) fs.cpSync(path.join(PUB, dir), path.join(OUT, 'app', dir), { recursive: true });
const appMeta = [
  `<meta name="sh-kid-app" content="${esc(base + 'app/')}">`,
  `<meta name="sh-coach-url" content="${esc(c.coachLoginUrl)}">`,
  c.coachName && `<meta name="sh-contact-name" content="${esc(c.coachName)}">`,
  c.telefon && `<meta name="sh-contact-phone" content="${esc(c.telefon)}">`,
  c.email && `<meta name="sh-contact-email" content="${esc(c.email)}">`,
  `<meta name="description" content="${esc(`Kostenlose Lern-App für Kinder mit Legasthenie und Dyskalkulie: Mengen, Kraft der 5, Einmaleins, Brüche, Laute, Rechtschreibung – von ${c.praxisName}.`)}">`,
  `<link rel="canonical" href="${esc(base + 'app/')}">`,
  indexable ? '' : '<meta name="robots" content="noindex, nofollow">',
].filter(Boolean).join('\n  ');
const appHtml = fs.readFileSync(path.join(PUB, 'index.html'), 'utf8')
  .replace('<title>Lerniversum</title>', `<title>${esc(c.praxisName)} – Lern-App</title>\n  ${appMeta}`);
fs.writeFileSync(path.join(OUT, 'app', 'index.html'), appHtml);
fs.copyFileSync(path.join(PUB, 'manifest.webmanifest'), path.join(OUT, 'app', 'manifest.webmanifest'));
fs.writeFileSync(path.join(OUT, 'robots.txt'), indexable ? `User-agent: *\nAllow: /\nSitemap: ${base}sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['', 'app/', 'impressum.html', 'datenschutz.html'].map(u => `  <url><loc>${base}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
if (c.eigeneDomain) fs.writeFileSync(path.join(OUT, 'CNAME'), c.eigeneDomain.replace(/^https?:\/\//, '').replace(/\/$/, '') + '\n');
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
console.log(`Website gebaut: ${OUT}`);
console.log(indexable ? '✓ Für Google freigegeben.' : `⚠ Noch NICHT für Google freigegeben (${c.bereit !== true ? '"bereit" ist nicht true' : ''}${!impressumOk ? (c.bereit !== true ? ' und ' : '') + 'Impressum unvollständig' : ''}).`);
