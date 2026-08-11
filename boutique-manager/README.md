# Boutique Manager

MVP mobile complet de gestion de boutiques et de produits. Tous les téléphones utilisent la même API Express; MongoDB Atlas contient les utilisateurs, boutiques et produits, tandis que Vercel Blob contient les images publiques des produits.

```text
Expo / React Native (téléphones)
              │ HTTPS REST
              ▼
       Express sur Vercel
          │           │
          ▼           ▼
   MongoDB Atlas   Vercel Blob
```

## Fonctionnalités livrées

- deux rôles centralisés : `ADMIN` et `BOUTIQUE`;
- un seul ADMIN, créé par seed idempotent et protégé par un index MongoDB unique partiel;
- authentification de démonstration sélectionnant un utilisateur, JWT dans SecureStore et restauration via `/api/auth/me`;
- rechargement de l’utilisateur en base à chaque requête protégée (rôle et boutique du client ignorés);
- création/suppression en cascade des boutiques par l’ADMIN;
- CRUD produit identique côté ADMIN et BOUTIQUE, avec contrôle cross-shop;
- formulaire produit partagé, attributs personnalisés et image JPEG/PNG/WEBP de 3 Mio maximum;
- upload Vercel Blob en mémoire, compensation des uploads échoués et remplacement sûr des images;
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

Prérequis : Node.js 20+, un cluster MongoDB Atlas et un Blob Store Vercel public connecté au projet par OIDC.

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
```

`MONGODB_URI` et `JWT_SECRET` restent exclusivement dans `server/.env` en local et dans les variables Vercel en ligne. Ils ne doivent jamais être copiés dans `mobile/`.

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
```

Au premier appel d’une route connectée à MongoDB, `ensureAdminExists()` crée `Administrateur` s’il n’existe pas. Les appels suivants restent sans effet. Un index unique partiel `one_admin_only` garantit l’unicité même en cas de démarrages simultanés.

### MongoDB Atlas

Dans Atlas, créer l’utilisateur DB puis autoriser l’accès réseau adapté aux fonctions Vercel dans **Network Access**. Le téléphone n’accède jamais directement au cluster. Les transactions utilisées pour la suppression cohérente d’une boutique nécessitent la configuration replica set fournie par Atlas.

### Vercel Blob et OIDC

Dans le projet Vercel backend, ouvrir **Storage**, créer/connecter un Blob Store public puis vérifier dans l’onglet **Projects** du store que le projet utilise OIDC. Pour un ancien store, choisir **Upgrade to OIDC**. Les Functions Vercel reçoivent alors automatiquement un jeton court et renouvelé : aucun secret Blob durable n’est configuré dans ce projet.

Pour tester les opérations Blob depuis le PC, lier le dossier serveur au même projet Vercel et récupérer les variables système temporaires :

```bash
cd boutique-manager/server
npx vercel link
npx vercel env pull
```

Le store reste public pour cette version, car `imageUrl` est affichée directement par React Native. Les appels Blob restent isolés dans `storage.service.ts`, ce qui permettra de remplacer Vercel Blob plus tard.

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

6. Dans **Storage**, créer ou connecter le Vercel Blob Store public au projet backend et activer la connexion OIDC.
7. Déployer.
8. Tester `https://votre-backend.vercel.app/api/health`.
9. Placer `https://votre-backend.vercel.app` dans `mobile/.env` comme `EXPO_PUBLIC_SERVER_URL`.
10. Relancer Expo puis scanner de nouveau le QR code.

Le PC n’a ensuite plus besoin d’exécuter l’API : tous les téléphones configurés avec la même URL Vercel partagent les mêmes données Atlas et les mêmes images Blob.

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
3. Sélectionner une image de moins de 3 Mio et renseigner nom, type, marque, couleurs et les champs souhaités.
4. Créer, modifier le stock/couleurs, puis éventuellement remplacer l’image.
5. Se reconnecter ADMIN, ouvrir Users → Nike Alger → **Gérer les produits** et vérifier qu’il s’agit du même document.
6. Tester avec un token d’une autre boutique : toutes les routes `/api/shops/{AUTRE_SHOP}/products` doivent répondre `403`.

### Plusieurs téléphones

1. Configurer les téléphones A et B avec la même `EXPO_PUBLIC_SERVER_URL` Vercel.
2. Sur A, créer Boutique X puis un produit.
3. Sur B, recharger l’écran de connexion ou la liste Produits.
4. Vérifier que Boutique X et le produit apparaissent. Seul le JWT est local; Users, Shops et Products viennent d’Atlas.

## Sécurité du mock login

> **ATTENTION :** `MOCK_AUTH_ENABLED=true` permet de sélectionner un compte sans mot de passe. Ce mode sert uniquement au développement et à la démonstration; ce n’est pas une authentification sûre pour une production publique.

Passer `MOCK_AUTH_ENABLED=false` masque complètement `/api/auth/options` et `/api/auth/mock-login`. Une future authentification email/mot de passe ou OAuth pourra remplacer ce module sans modifier les contrôles métier des boutiques et produits.

## Ressources externes nécessaires aux tests réels

Les tests MongoDB, seed concurrent, accès cross-shop et partage entre téléphones nécessitent vos propres valeurs `MONGODB_URI`, `JWT_SECRET` et un déploiement Vercel. Les tests upload/remplacement/suppression Blob nécessitent un Blob Store connecté au projet par OIDC. Ne placez jamais de secrets dans Git ou dans l’application mobile.
