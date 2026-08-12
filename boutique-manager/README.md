# Boutique Manager

Application mobile de gestion de boutiques et de recherche visuelle de produits. Tous les téléphones utilisent la même API Express; MongoDB Atlas contient les utilisateurs, boutiques, produits et fichiers image GridFS, tandis que Gemini extrait les caractéristiques visuelles côté backend uniquement.

```text
Expo / React Native (téléphones)
              │ HTTPS REST
              ▼
       Express sur Vercel
          │           │
          ▼           ▼
 MongoDB + GridFS   Gemini
```

## Fonctionnalités livrées

- trois rôles centralisés : `ADMIN`, `BOUTIQUE` et `USER`;
- un seul ADMIN, créé par seed idempotent et protégé par un index MongoDB unique partiel;
- un premier USER créé par seed idempotent, sans contrainte empêchant d’ajouter plusieurs USER plus tard;
- authentification de démonstration sélectionnant un utilisateur, JWT dans SecureStore et restauration via `/api/auth/me`;
- rechargement de l’utilisateur en base à chaque requête protégée (rôle et boutique du client ignorés);
- création/suppression en cascade des boutiques par l’ADMIN;
- CRUD produit identique côté ADMIN et BOUTIQUE, avec contrôle cross-shop;
- formulaire produit partagé où seuls le nom et une couleur sont obligatoires pendant les tests;
- caméra/galerie, recadrage et compression JPEG (dimension maximale proche de 1600 px, qualité 0,8);
- jusqu’à deux images par produit, avec ajout par caméra, galerie ou glisser-déposer sur le web;
- bouton **Remplir automatiquement avec l’IA** dans le formulaire partagé ADMIN/BOUTIQUE : il complète les champs visuellement observables et laisse prix, stock, tailles, SKU et code-barres vides;
- fichiers image persistants dans MongoDB GridFS, compensation des uploads échoués et remplacement sûr des images;
- analyse Gemini structurée des images catalogue, état visible et relance manuelle sans bloquer le CRUD en cas d’échec IA;
- recherche USER par photo, matching déterministe côté serveur, taille facultative et classement géographique après filtrage des bons candidats;
- image USER conservée uniquement en mémoire pendant la requête et jamais enregistrée dans MongoDB;
- états loading/error/empty, confirmations et rafraîchissement des listes au focus;
- API au format `{ success, data }` ou `{ success: false, message, code }`.

## Arborescence importante

```text
boutique-manager/
├── mobile/
│   ├── app/                     # routes Expo Router ADMIN/BOUTIQUE
│   ├── src/api/                 # client REST centralisé
│   ├── src/components/          # ProductForm, cards et UI partagés
│   ├── src/context/             # AuthContext
│   ├── src/storage/             # JWT SecureStore uniquement
│   └── .env.example
├── server/
│   ├── src/controllers/
│   ├── src/middleware/
│   ├── src/models/
│   ├── src/routes/
│   ├── src/services/
│   ├── src/app.ts               # application Express exportée
│   ├── src/index.ts             # entrée Express Vercel et écoute locale
│   ├── vercel.json
│   └── .env.example
└── .gitignore
```

## 1. Backend local

Prérequis : Node.js 20+ et un cluster MongoDB Atlas. Aucun Vercel Blob ni jeton Blob n'est nécessaire.

```bash
cd boutique-manager/server
npm install
cp .env.example .env
```

Renseigner exactement `boutique-manager/server/.env` :

```dotenv
PORT=4000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=une-longue-valeur-aleatoire-de-32-caracteres-minimum
JWT_EXPIRES_IN=7d
MOCK_AUTH_ENABLED=true
GEMINI_API_KEYS=cle_gemini_1,cle_gemini_2
GEMINI_MODEL=gemini-3.5-flash
GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite
```

Générer `JWT_SECRET` avec une valeur réellement aléatoire, puis copier uniquement le résultat dans `.env` :

```bash
openssl rand -base64 48
```

Ne pas utiliser littéralement les placeholders de cette documentation.

`MONGODB_URI`, `JWT_SECRET` et `GEMINI_API_KEYS` restent exclusivement dans `server/.env` en local et dans les variables Vercel en ligne. Ils ne doivent jamais être copiés dans `mobile/`. Dans un fichier `.env` et dans Vercel, coller les valeurs directement, sans guillemets. Plusieurs clés Gemini sont séparées par des virgules; une clé n’est essayée qu’une fois par analyse.

```bash
npm run dev
# autre terminal
curl http://localhost:4000/api/health
```

Réponse attendue :

```json
{"success":true,"data":{"status":"ok"}}
```

Scripts de contrôle :

```bash
npm run typecheck
npm run build
npm test
```

Au premier appel d’une route connectée à MongoDB, `ensureInitialUsersExist()` crée `Administrateur` et `Utilisateur` s’ils n’existent pas. Les appels suivants restent sans effet. Un index unique partiel `one_admin_only` garantit l’unicité ADMIN. Une clé système réservée rend uniquement le seed USER idempotent; elle n’impose aucune unicité au rôle USER.

### MongoDB Atlas

Dans Atlas, créer l’utilisateur DB puis autoriser l’accès réseau adapté aux fonctions Vercel dans **Network Access**. Le téléphone n’accède jamais directement au cluster. Les transactions utilisées pour la suppression cohérente d’une boutique nécessitent la configuration replica set fournie par Atlas.

### Fichiers image dans MongoDB GridFS

Les images produit sont enregistrées comme fichiers dans le bucket GridFS `product_images` du même cluster désigné par `MONGODB_URI`. MongoDB crée automatiquement les collections `product_images.files` et `product_images.chunks`. L'API les sert publiquement via `GET /api/images/:imageId`; Expo transforme automatiquement cette URL relative avec `EXPO_PUBLIC_SERVER_URL`.

Aucune variable `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID` ou `VERCEL_OIDC_TOKEN` n'est utilisée. Le disque d'une Function Vercel ne peut pas servir de stockage permanent : il est en lecture seule, à l'exception de `/tmp`, qui est un espace de travail temporaire. GridFS permet donc de garder réellement les fichiers après l'arrêt ou le redémarrage d'une Function.

## 2. Application Expo Go

Le projet utilise Expo SDK 54, Expo Router, `expo-image-picker` et `expo-secure-store` dans leurs versions compatibles avec ce SDK.

```bash
cd boutique-manager/mobile
npm install
cp .env.example .env
```

Avec le backend sur le PC, connecter PC et téléphone à un réseau permettant leur communication, trouver l’IP locale du PC, puis écrire dans `mobile/.env` :

```dotenv
EXPO_PUBLIC_SERVER_URL=http://192.168.1.50:4000
```

Ne pas utiliser `localhost:4000` sur un téléphone physique : cela désignerait le téléphone lui-même.

Avec le backend Vercel :

```dotenv
EXPO_PUBLIC_SERVER_URL=https://votre-backend.vercel.app
```

Cette URL est publique et n’est pas un secret.

Lancer :

```bash
npx expo start
```

Installer Expo Go sur Android/iOS, scanner le QR code affiché, puis attendre le chargement. Si le réseau local bloque la découverte, essayer `npx expo start --tunnel`. Après toute modification de `.env`, relancer Expo.

Contrôles locaux :

```bash
npm run typecheck
npm run lint
```

## 3. Déploiement du backend sur Vercel

1. Pousser le repository dans Git.
2. Dans Vercel, créer un projet et importer ce repository.
3. Définir **Root Directory** sur `boutique-manager/server` (ou `server` si `boutique-manager` est lui-même la racine du repository déployé).
4. Dans **Build and Deployment Settings**, utiliser **Framework Preset: Express** et laisser **Build Command** et **Output Directory** sur leur valeur par défaut (sans override). `vercel.json` impose également ces valeurs afin d’éviter que Vercel cherche un dossier statique `public`.
5. Dans **Settings → Environment Variables**, ajouter :
   - `MONGODB_URI`;
   - `JWT_SECRET` (32 caractères minimum, valeur aléatoire);
   - `JWT_EXPIRES_IN=7d`;
   - `MOCK_AUTH_ENABLED=true` pour le test uniquement.
   - `GEMINI_API_KEYS` avec une ou plusieurs clés séparées par des virgules;
   - `GEMINI_MODEL=gemini-3.5-flash`;
   - `GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite`.

6. Ne créer aucun Blob Store : les images utilisent automatiquement le MongoDB configuré par `MONGODB_URI`.
7. Déployer.
8. Tester `https://votre-backend.vercel.app/api/health`.
9. Placer `https://votre-backend.vercel.app` dans `mobile/.env` comme `EXPO_PUBLIC_SERVER_URL`.
10. Relancer Expo puis scanner de nouveau le QR code.

Le PC n’a ensuite plus besoin d’exécuter l’API : tous les téléphones configurés avec la même URL Vercel partagent les mêmes données et images GridFS dans Atlas.

## 4. Scénarios de test

### ADMIN initial

1. Démarrer le backend sur une base sans ADMIN.
2. Ouvrir l’application et choisir **Administrateur**.
3. Vérifier les tabs **Accueil** et **Users**.
4. Dans Users, choisir **+ Ajouter une boutique** et créer `Nike Alger`, `0550000000`, `Alger Centre`.
5. Vérifier l’apparition de l’ADMIN (non supprimable) et de Nike Alger.
6. Relancer le backend et vérifier qu’il existe toujours exactement un ADMIN.

### BOUTIQUE et produit

1. Se déconnecter puis choisir **Boutique**. Avec une boutique, la connexion est directe; avec plusieurs, une liste est affichée.
2. Ouvrir **Produits**, puis **+ Ajouter un produit**.
3. Renseigner au minimum le nom et une couleur. L’image (moins de 3 Mio), le type, la marque et les autres informations sont facultatifs pendant la phase de test.
   Pour aller plus vite, ajouter une ou deux photos puis utiliser **Remplir automatiquement avec l’IA**. Vérifier les propositions avant l’enregistrement.
4. Créer, modifier le stock/couleurs, puis éventuellement remplacer l’image.
5. Se reconnecter ADMIN, ouvrir Users → Nike Alger → **Gérer les produits** et vérifier qu’il s’agit du même document.
6. Tester avec un token d’une autre boutique : toutes les routes `/api/shops/{AUTRE_SHOP}/products` doivent répondre `403`.

### Plusieurs téléphones

1. Configurer les téléphones A et B avec la même `EXPO_PUBLIC_SERVER_URL` Vercel.
2. Sur A, créer Boutique X puis un produit.
3. Sur B, recharger l’écran de connexion ou la liste Produits.
4. Vérifier que Boutique X et le produit apparaissent. Seul le JWT est local; Users, Shops et Products viennent d’Atlas.

### USER et recherche visuelle

1. Se déconnecter, choisir **Utilisateur**, puis autoriser ou refuser la localisation au premier plan.
2. Prendre une photo ou choisir une image de produit, la recadrer et indiquer éventuellement une taille.
3. Lancer la recherche. Seuls les produits au-dessus du seuil de correspondance sont retenus; la proximité ne peut pas faire remonter un mauvais produit.
4. Vérifier le nom, l’adresse, le téléphone, la distance éventuelle et utiliser **Appeler la boutique**.
5. Confirmer que `stock = 0` n’est pas recommandé et que l’interface demande toujours une confirmation téléphonique.

La recherche est `POST /api/ai/product-search`, protégée par JWT et réservée au rôle USER. L’image envoyée est analysée depuis la mémoire de la Function puis abandonnée. Le catalogue n’est jamais envoyé à Gemini : le service reçoit une seule image et le matching avec MongoDB reste local au backend.

```text
Photo USER → Gemini → VisualProductProfile → matching MongoDB → boutiques → distance
```

`expo-location` demande uniquement l’autorisation au premier plan. Un refus ou un échec de géocodage n’empêche ni la recherche ni l’enregistrement d’une boutique; seule la distance reste alors indisponible.

## Sécurité du mock login

> **ATTENTION :** `MOCK_AUTH_ENABLED=true` permet de sélectionner un compte sans mot de passe. Ce mode sert uniquement au développement et à la démonstration; ce n’est pas une authentification sûre pour une production publique.

Passer `MOCK_AUTH_ENABLED=false` masque complètement `/api/auth/options` et `/api/auth/mock-login`. Une future authentification email/mot de passe ou OAuth pourra remplacer ce module sans modifier les contrôles métier des boutiques et produits.

## Ressources externes nécessaires aux tests réels

Les tests automatisés couvrent le matching, la marque invisible, le filtrage avant distance, la taille, le stock zéro, Haversine, les permissions USER et les pannes/rate limits/réponses invalides du pool Gemini avec des doubles de test. Un test réel de Gemini nécessite vos propres clés et peut consommer du quota; il n’est volontairement pas lancé par `npm test`.

Les tests MongoDB, GridFS, seed concurrent, accès cross-shop et partage entre téléphones nécessitent vos propres valeurs `MONGODB_URI`, `JWT_SECRET` et éventuellement un déploiement Vercel. Aucun Blob Store n'est nécessaire. Ne placez jamais de secrets dans Git ou dans l’application mobile.
