# NEXUS — Guide de déploiement concret
# De zéro à nexus-artx.io en ligne en ~30 minutes
# ═══════════════════════════════════════════════

## ÉTAPE 1 — Télécharger le ZIP du site
Télécharge le fichier `nexus-v2-site.zip` fourni.
Décompresse-le sur ton bureau → tu obtiens le dossier `nexus-v2/`

Structure finale :
```
nexus-v2/
├── index.html          ← LE SITE COMPLET
├── assets/
│   └── crush.webp      ← L'oeuvre de avp9
├── robots.txt
├── sitemap.xml
├── _headers            ← Sécurité Netlify
└── vercel.json         ← Config Vercel
```

---

## ÉTAPE 2 — Mettre en ligne sur Netlify (GRATUIT, 5 minutes)

1. Va sur https://netlify.com
2. Clique "Sign up" → choisis "Email" → crée un compte
3. Une fois connecté, tu vois cette page :
   "Deploy manually — Drag and drop your site folder here"
4. **Glisse le dossier `nexus-v2/` directement sur cette zone**
5. Netlify génère une URL temporaire du type :
   `https://amazing-newton-3d8f7.netlify.app`
   → Le site est en ligne immédiatement.

---

## ÉTAPE 3 — Acheter le domaine (recommandation : Porkbun)

1. Va sur https://porkbun.com
2. Cherche : `nexus-artx.io`
3. Prix estimé : ~$10-18/an pour un .io
4. Crée un compte et achète le domaine
5. Tu recevras un email de confirmation

   Alternatives si nexus-artx.io n'est pas disponible :
   - nexusartx.io
   - nexus-nft.io
   - nexus-artx.com
   - avpix.io

---

## ÉTAPE 4 — Connecter le domaine à Netlify

### Sur Netlify :
1. Va dans ton site → "Domain settings"
2. Clique "Add custom domain"
3. Entre : `nexus-artx.io` → Confirme
4. Netlify te donne 4 nameservers (ex:)
   ```
   dns1.p01.nsone.net
   dns2.p01.nsone.net
   dns3.p01.nsone.net
   dns4.p01.nsone.net
   ```
5. Copie ces 4 valeurs

### Sur Porkbun :
1. Va dans "Domain Management" → `nexus-artx.io`
2. Clique "Edit Nameservers"
3. Supprime les nameservers existants
4. Ajoute les 4 nameservers de Netlify
5. Sauvegarde

### Attente propagation DNS :
- En général : 15 minutes à 4 heures
- Maximum : 24 heures
- Vérifier sur : https://dnschecker.org

---

## ÉTAPE 5 — HTTPS automatique (SSL gratuit)

Netlify active le SSL automatiquement via Let's Encrypt.
Dès que le DNS est propagé :
- `https://nexus-artx.io` → Certificat SSL valide
- `http://` redirige automatiquement vers `https://`
- Cadenas vert dans le navigateur ✓

---

## ÉTAPE 6 — Référencement (Google, Bing, Yandex)

### Google Search Console (15 minutes) :
1. Va sur https://search.google.com/search-console
2. Clique "Add property" → "URL prefix"
3. Entre : `https://nexus-artx.io`
4. Méthode de vérification → "HTML tag"
5. Copie le code meta fourni (ex: `<meta name="google-site-verification" content="XXX">`)
6. Dans ton index.html, dans le <head>, ajoute cette ligne
7. Redéploie le site sur Netlify (reglisse le dossier)
8. Reviens sur Search Console → Vérifie
9. Va dans "Sitemaps" → Soumettre : `https://nexus-artx.io/sitemap.xml`

### Bing Webmaster Tools :
1. https://www.bing.com/webmasters/home
2. "Add your site" → entre l'URL
3. Importe automatiquement depuis Google Search Console (option disponible)

### Indexation accélérée :
- Google : Search Console → URL Inspection → "Request Indexing" sur chaque page
- Bing : Webmaster → URL Submission → Soumettre les URLs

---

## ÉTAPE 7 — Vérifier la sécurité

Teste ces 3 URLs après mise en ligne :

1. **Security Headers** : https://securityheaders.com/?q=nexus-artx.io
   → Cible : Note A ou A+

2. **SSL Test** : https://www.ssllabs.com/ssltest/analyze.html?d=nexus-artx.io
   → Cible : Note A+

3. **Mozilla Observatory** : https://observatory.mozilla.org/analyze/nexus-artx.io
   → Cible : Note A+

---

## RÉCAPITULATIF DES COÛTS

| Service         | Coût         |
|----------------|--------------|
| Hébergement    | GRATUIT (Netlify) |
| SSL/HTTPS      | GRATUIT (Let's Encrypt) |
| CDN mondial    | GRATUIT (Netlify CDN) |
| Domaine .io    | ~$10-18/an   |
| **TOTAL**      | **~$10-18/an** |

---

## EN CAS DE PROBLÈME

- Site ne charge pas → Vérifier la propagation DNS sur dnschecker.org
- Images manquantes → Vérifier que `assets/crush.webp` est bien dans le dossier
- SSL non activé → Attendre 10 minutes après propagation DNS

Pour toute question : demande directement à CLAUDE-∑.

---

NEXUS Protocol v2.0 — AVPIX Token
Co-fondateurs : CLAUDE-∑ & avp9
