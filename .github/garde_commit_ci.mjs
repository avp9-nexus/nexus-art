#!/usr/bin/env node
// garde_commit_ci.mjs — contrôle EN AVAL des messages de commit poussés sur ce dépôt.
// Sortie 0 = conforme · 1 = un message porte une signature d'agent.
//
// USAGE (Action) : node .github/garde_commit_ci.mjs --plage <sha_avant> <sha_apres>
//        (banc)   : node .github/garde_commit_ci.mjs --message <fichier> [--auteur "Nom <mail>"]
//
// RÈGLE APPLIQUÉE : aucun `Co-Authored-By`, aucune signature d'agent, aucun 🤖 — nulle part.
// Elle est gravée au corpus de gouvernance depuis le 06/07/2026 ; elle a été violée une fois,
// le 06/08/2026, et la violation s'est affichée sur la page publique du commit avant d'être
// réparée. Ce contrôle existe pour que la prochaine soit VUE.
//
// ⚠️ CE QU'IL NE FAIT PAS, ET C'EST ÉCRIT ICI POUR QUE PERSONNE NE L'INFÈRE :
//   il s'exécute APRÈS le push. Il ne bloque rien — le blocage serveur du message de commit
//   n'existe pas sur ce plan GitHub (métadonnées de commit = Enterprise · pre-receive hooks =
//   Enterprise Server · push rulesets = Team). La fenêtre d'exposition publique est donc NON
//   NULLE : quelques minutes entre le push et le rouge. Le gate réel vit dans un hook
//   `commit-msg` local, qui ne couvre que le poste où il est posé.
//   Sur un push FORCÉ, il juge ce que la branche porte de plus que `main` (ou la tête seule, en
//   le disant) : les commits réécrits qui ne sont plus atteignables ne sont PAS rejugés.
//
// ⛔ PARITÉ : le bloc ci-dessous est byte-identique à celui de `outils\motifs_commit.mjs`,
// hors de ce dépôt. La duplication est assumée parce qu'`outils\` n'est pas publié — et
// MESURÉE par `outils\test_parite_commit.mjs`, à rejouer après toute modification de l'un
// des deux. Une parité rompue est un rouge : deux jeux de motifs qui divergent en silence
// sont exactement le défaut que ce fichier prétend fermer.

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// ——— DÉBUT BLOC PARITÉ — byte-identique avec nexus-art\.github\garde_commit_ci.mjs ———
const INTERDITS = [
  { nom: 'trailer Co-Authored-By', re: /^\s*co-authored-by\s*:/im,
    dit: 'GitHub affiche « X and Y committed » — la co-signature devient publique' },
  { nom: 'adresse noreply d’un fournisseur d’IA', re: /noreply@(anthropic|openai)\.com/i,
    dit: 'identifie un agent comme co-auteur, même sans trailer' },
  { nom: 'mention « Generated with »', re: /generated\s+with\b/i,
    dit: 'signature de génération automatique' },
  { nom: 'emoji robot', re: /\u{1F916}/u,
    dit: 'signature visuelle d’agent' },
  { nom: 'trailer Signed-off-by d’un agent', re: /^\s*signed-off-by\s*:.*\b(claude|gpt|copilot|assistant)\b/im,
    dit: 'co-signature déguisée en DCO' },
  { nom: 'signature Claude en fin de message', re: /^\s*(--\s*)?claude(\s+(opus|sonnet|haiku|code)\b.*)?\s*$/im,
    dit: 'signature en pied de message' },
  { nom: 'BOM en tête de message', re: /^﻿/,
    dit: 'caractère invisible en tête de sujet — écrire le fichier en UTF-8 SANS BOM' },
];
const ADRESSE_AVP9 = /^[^<]*<avp9pro@gmail\.com>$/i;
const NOM_AGENT = /\b(claude|gpt|copilot|codex|cursor|devin|bot|assistant)\b/i;
// ⭐ 05/09/2026 — Dependabot (GitHub) signe SES commits à visage découvert, badge « Verified » : ce
// n'est pas un agent qui co-signe les nôtres. Exemption sur l'identité EXACTE (nom ET adresse),
// mesurée sur nexus-art#1 le jour où le garde a rougi dessus. Tout autre nom, toute autre adresse
// reste refusé — et le MESSAGE reste jugé sur les sept motifs comme n'importe quel autre.
const AUTEURS_EXEMPTES = [
  /^dependabot\[bot\] <49699333\+dependabot\[bot\]@users\.noreply\.github\.com>$/,
];
function jugerMessage(message, auteur) {
  const fautes = [];
  for (const m of INTERDITS) {
    const t = message.match(m.re);
    if (t) fautes.push(`${m.nom} — « ${t[0].trim().slice(0, 60)} » : ${m.dit}`);
  }
  if (auteur != null && !AUTEURS_EXEMPTES.some(re => re.test(auteur))) {
    if (!ADRESSE_AVP9.test(auteur)) fautes.push(`adresse d'auteur non conforme — « ${auteur} », attendu <avp9pro@gmail.com>`);
    else if (NOM_AGENT.test(auteur)) fautes.push(`nom d'auteur d'agent — « ${auteur} » : l'adresse est bonne, le nom signe un agent`);
  }
  return fautes;
}
// ——— FIN BLOC PARITÉ ———

const arg = n => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const ZERO = /^0{40}$/;
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 3e7 });
const US = String.fromCharCode(0x1f), RS = String.fromCharCode(0x1e);

let aJuger = [];   // { etiquette, message, auteur }

if (process.argv.includes('--message')) {
  const f = arg('--message');
  const brut = readFileSync(f, 'utf8').split(/\r?\n/).filter(l => !l.startsWith('#')).join('\n');
  aJuger = [{ etiquette: `message (${f})`, message: brut, auteur: arg('--auteur') }];
} else if (process.argv.includes('--plage')) {
  const i = process.argv.indexOf('--plage');
  const avant = process.argv[i + 1], apres = process.argv[i + 2];
  // Une création de branche donne `avant` = 40 zéros : il n'y a pas de plage, on juge la tête.
  // ⚠️ 05/09/2026 — un push FORCÉ (rebase de Dependabot, `--force-with-lease` de réparation) donne
  // un `avant` qui n'est plus un ancêtre de `apres`, parfois plus un objet du tout : `git log
  // avant..après` lève « Invalid revision range » et ce garde rougissait SANS AVOIR JUGÉ — un rouge
  // pour une non-faute, mesuré sur nexus-art#1 (run 33985262839). On juge alors ce que la branche
  // porte de plus que `main` ; si c'est vide (push forcé sur main même), la tête seule — et on le DIT,
  // parce qu'un garde qui juge moins qu'il n'en a l'air est pire qu'un garde rouge.
  const existe = ref => { try { git('cat-file', '-e', `${ref}^{commit}`); return true; } catch { return false; } };
  const ancetre = (a, b) => { try { git('merge-base', '--is-ancestor', a, b); return true; } catch { return false; } };
  let spec, note = '';
  if (!avant || ZERO.test(avant)) spec = ['-1', apres];
  else if (existe(avant) && ancetre(avant, apres)) spec = [`${avant}..${apres}`];
  else if (existe('origin/main') && git('rev-list', `origin/main..${apres}`).trim()) {
    spec = [`origin/main..${apres}`];
    note = `push forcé : ${avant.slice(0, 7)} n'est plus un ancêtre de ${apres.slice(0, 7)} — jugé : ce que la branche porte de plus que main`;
  } else {
    spec = ['-1', apres];
    note = `push forcé sans écart avec main : seule la TÊTE ${apres.slice(0, 7)} est jugée, pas les commits réécrits en dessous`;
  }
  if (note) console.log(`::warning title=garde_commit_ci — plage recalculée::${note}`);
  const brut = git('log', ...spec, '--format=%H' + US + '%an <%ae>' + US + '%B' + RS);
  aJuger = brut.split(RS).map(s => s.replace(/^\s+/, '')).filter(Boolean).map(bloc => {
    const [sha, auteur, msg] = bloc.split(US);
    return { etiquette: `${(sha ?? '').slice(0, 7)} — ${(msg ?? '').split('\n')[0].slice(0, 60)}`, message: msg ?? '', auteur };
  });
} else {
  console.error('USAGE: --plage <avant> <apres> | --message <fichier> [--auteur "Nom <mail>"]');
  process.exit(1);
}

console.log(`garde_commit_ci — ${aJuger.length} message(s) · ${INTERDITS.length} motifs interdits`);
const sales = aJuger.map(c => ({ ...c, fautes: jugerMessage(c.message, c.auteur) })).filter(c => c.fautes.length);
for (const c of sales) {
  console.log(`\n::error title=Signature d'agent dans un message de commit::${c.etiquette}`);
  for (const f of c.fautes) console.log(`   ${f}`);
}
if (sales.length) {
  console.log(`\n⛔ ${sales.length} message(s) en faute.`);
  console.log(`   Règle : aucun Co-Authored-By, aucune signature d'agent, aucun 🤖 — nulle part.`);
  console.log(`   ⚠️ Ce contrôle est EN AVAL : le message est déjà public. Réparer avec`);
  console.log(`      git commit --amend -F <fichier>  puis  git push --force-with-lease`);
  console.log(`      (l'arbre reste byte-identique ; seul le message change).`);
  process.exit(1);
}
console.log('✓ aucun message en faute');
