# Shop API — TP NestJS

API REST d'une boutique en ligne, construite avec **NestJS**, **TypeORM** et **MySQL**, entièrement conteneurisée avec **Docker**.

---

## Fonctionnalités

- CRUD complet sur **4 ressources** : Catégories, Produits, Clients, Commandes
- Calcul automatique du **total** d'une commande à la création
- Validation des données d'entrée via `class-validator` (pipes globaux)
- Documentation interactive **Swagger UI** disponible sur `/api`
- Configuration par variables d'environnement (`@nestjs/config`)
- Stack **Docker** prête à l'emploi (multi-stage build + healthcheck MySQL)

---

## Structure du projet

```
src/
├── categories/     # Catégories de produits
├── products/       # Produits (liés à une catégorie)
├── clients/        # Clients
└── orders/         # Commandes + lignes de commande (OrderItem)
```

### Modèle de données

```
Category ──< Product ──< OrderItem >── CustomerOrder >── Client
```

| Entité          | Table              | Relations                               |
|-----------------|--------------------|-----------------------------------------|
| `Category`      | `categories`       | 1 → N `Product`                         |
| `Product`       | `products`         | N → 1 `Category`, 1 → N `OrderItem`    |
| `Client`        | `clients`          | 1 → N `CustomerOrder`                   |
| `CustomerOrder` | `customer_orders`  | N → 1 `Client`, 1 → N `OrderItem`      |
| `OrderItem`     | `order_items`      | N → 1 `CustomerOrder`, N → 1 `Product` |

---

## Démarrage rapide avec Docker

### Pré-requis

- [Docker Desktop](https://www.docker.com/products/docker-desktop) >= 24

### Lancer la stack complète

```bash
docker compose up --build
```

Compose démarre deux services :

| Service | Image        | Port exposé   | Rôle                  |
|---------|--------------|---------------|-----------------------|
| `db`    | `mysql:8.4`  | `3307 → 3306` | Base de données MySQL |
| `api`   | build local  | `3000 → 3000` | API NestJS            |

> L'API attend que MySQL soit **healthy** avant de démarrer (healthcheck toutes les 10 s, 10 tentatives max).

### Arrêter et nettoyer

```bash
# Arrêter sans supprimer les données
docker compose down

# Arrêter ET supprimer le volume MySQL (reset complet)
docker compose down -v
```

---

## Détails Docker

### Dockerfile — multi-stage build

```
Stage 1 (builder) : node:22-alpine
  → npm ci + npm run build  →  dist/

Stage 2 (runtime) : node:22-alpine
  → npm ci --omit=dev  (dépendances prod uniquement)
  → COPY dist/
  → EXPOSE 3000
  → CMD node dist/main.js
```

L'image finale ne contient **aucun outil de build**, ce qui réduit sa taille et sa surface d'attaque.

### Volume persistant

```yaml
volumes:
  mysql_data:   # monté sur /var/lib/mysql du conteneur db
```

Les données MySQL survivent aux redémarrages et aux `docker compose down`. Seul `docker compose down -v` les supprime.

### Variables d'environnement

Les valeurs de connexion sont injectées par Compose au moment du démarrage. Créer un fichier `.env` à la racine (voir section suivante) pour le développement local — **ne jamais commiter ce fichier**.

| Variable      | Description                        |
|---------------|------------------------------------|
| `DB_HOST`     | Hôte MySQL (`db` dans Compose)     |
| `DB_PORT`     | Port MySQL                         |
| `DB_USERNAME` | Utilisateur de la base             |
| `DB_PASSWORD` | Mot de passe de la base            |
| `DB_DATABASE` | Nom de la base de données          |
| `PORT`        | Port d'écoute de l'API             |

---

## Développement local (sans Docker)

### Pré-requis

- Node.js >= 22
- MySQL accessible (ex. via `docker compose up db`)

### Installation

```bash
npm install
```

### Fichier `.env`

Copier et adapter l'exemple ci-dessous — **ce fichier est dans `.gitignore`, ne pas le commiter** :

```env
DB_HOST=localhost
DB_PORT=<port>
DB_USERNAME=<utilisateur>
DB_PASSWORD=<mot_de_passe>
DB_DATABASE=<nom_base>
PORT=3000
```

### Démarrer en mode watch

```bash
npm run start:dev
```

---

## Endpoints API

### Catégories `/categories`

| Méthode  | Route             | Description                 |
|----------|-------------------|-----------------------------|
| `GET`    | `/categories`     | Liste toutes les catégories |
| `GET`    | `/categories/:id` | Détail d'une catégorie      |
| `POST`   | `/categories`     | Créer une catégorie         |
| `PATCH`  | `/categories/:id` | Modifier une catégorie      |
| `DELETE` | `/categories/:id` | Supprimer une catégorie     |

### Produits `/products`

| Méthode  | Route            | Description              |
|----------|------------------|--------------------------|
| `GET`    | `/products`      | Liste tous les produits  |
| `GET`    | `/products/:id`  | Détail d'un produit      |
| `POST`   | `/products`      | Créer un produit         |
| `PATCH`  | `/products/:id`  | Modifier un produit      |
| `DELETE` | `/products/:id`  | Supprimer un produit     |

### Clients `/clients`

| Méthode  | Route           | Description              |
|----------|-----------------|--------------------------|
| `GET`    | `/clients`      | Liste tous les clients   |
| `GET`    | `/clients/:id`  | Détail d'un client       |
| `POST`   | `/clients`      | Créer un client          |
| `PATCH`  | `/clients/:id`  | Modifier un client       |
| `DELETE` | `/clients/:id`  | Supprimer un client      |

### Commandes `/orders`

| Méthode  | Route          | Description                  |
|----------|----------------|------------------------------|
| `GET`    | `/orders`      | Liste toutes les commandes   |
| `GET`    | `/orders/:id`  | Détail d'une commande        |
| `POST`   | `/orders`      | Créer une commande           |
| `DELETE` | `/orders/:id`  | Supprimer une commande       |

**Exemple de création de commande :**

```json
POST /orders
{
  "clientId": 1,
  "items": [
    { "productId": 2, "quantity": 3 },
    { "productId": 5, "quantity": 1 }
  ]
}
```

---

## Documentation Swagger

Une fois l'API démarrée, ouvrir :

```
http://localhost:3000/api
```

Tous les endpoints sont documentés et testables directement depuis l'interface.

---

## Tests

```bash
# Tests unitaires (run unique)
npm run test

# Tests unitaires avec couverture
npm run test:cov

# Tests e2e
npm run test:e2e
```

---

## Architecture NestJS

Le projet suit l'architecture modulaire de NestJS : chaque ressource vit dans son propre module isolé qui regroupe son contrôleur, son service et ses entités.

```
AppModule
├── CategoriesModule  (categories.controller → categories.service)
├── ProductsModule    (products.controller   → products.service)
├── ClientsModule     (clients.controller    → clients.service)
└── OrdersModule      (orders.controller     → orders.service)
```

### Modules et injection de dépendances

Chaque module déclare ses propres providers et importe uniquement ce dont il a besoin via `TypeOrmModule.forFeature([...])`. L'`AppModule` orchestre la configuration globale :

- **`ConfigModule.forRoot({ isGlobal: true })`** — rend les variables d'environnement accessibles partout sans ré-import
- **`TypeOrmModule.forRootAsync`** — initialise la connexion MySQL de façon asynchrone en injectant `ConfigService`, ce qui garantit que les variables d'env sont disponibles avant la connexion

### Validation globale (Pipes)

Un `ValidationPipe` global est appliqué dans `main.ts` avec trois options :

| Option                 | Effet                                                        |
|------------------------|--------------------------------------------------------------|
| `whitelist: true`      | Supprime automatiquement les champs non déclarés dans le DTO |
| `forbidNonWhitelisted` | Renvoie une erreur 400 si un champ inconnu est présent       |
| `transform: true`      | Convertit les payloads JSON vers les types TypeScript du DTO |

Les DTOs utilisent les décorateurs `class-validator` (`@IsInt`, `@Min`, `@IsArray`, `@ValidateNested`...) et `@ApiProperty` de Swagger pour la documentation automatique.

---

## TypeORM — Entités & relations

### Mapping objet-relationnel

Les entités sont des classes TypeScript décorées, TypeORM se charge de créer et synchroniser les tables (`synchronize: true` en mode TP).

```typescript
// Exemple : un produit appartient à une catégorie (N → 1)
@ManyToOne(() => Category, (c) => c.products, { onDelete: 'RESTRICT' })
@JoinColumn({ name: 'categoryId' })
category: Relation<Category>;
```

### Stratégie `onDelete`

| Relation                      | Comportement                                                 |
|-------------------------------|--------------------------------------------------------------|
| `Product` → `Category`        | `RESTRICT` — impossible de supprimer une catégorie utilisée  |
| `OrderItem` → `CustomerOrder` | `CASCADE` — les items sont supprimés avec la commande        |
| `OrderItem` → `Product`       | `RESTRICT` — impossible de supprimer un produit commandé     |
| `CustomerOrder` → `Client`    | `RESTRICT` — impossible de supprimer un client avec commandes|

### Transaction dans `OrdersService`

La création d'une commande est entièrement atomique via `DataSource.transaction()` :

1. Vérifie l'existence du client
2. Détecte les doublons de produits dans la liste
3. Pour chaque produit (trié par id pour éviter les deadlocks), décrémente le stock avec un `UPDATE ... WHERE stock >= qty` — si `affected = 0`, erreur 400 (stock insuffisant)
4. Calcule le total en centimes pour éviter les erreurs d'arrondi flottant
5. Sauvegarde la commande puis ses `OrderItem` avec le `unitPrice` snapshotté au moment de l'achat
6. Retourne la commande complète avec ses relations chargées

Si une étape échoue, toute la transaction est annulée (rollback automatique).

---

## Stack technique

| Outil             | Version    | Rôle                          |
|-------------------|------------|-------------------------------|
| NestJS            | ^12        | Framework Node.js             |
| TypeORM           | ^1.1       | ORM                           |
| MySQL             | 8.4        | Base de données               |
| `@nestjs/swagger` | ^12        | Documentation OpenAPI         |
| `class-validator` | ^0.15      | Validation des DTOs           |
| Docker / Compose  | >= 24      | Conteneurisation              |
| Vitest            | ^4         | Tests unitaires & e2e         |
| oxlint            | ^1         | Linting TypeScript            |
| Prettier          | ^3         | Formatage du code             |
| Node.js           | 22-alpine  | Runtime                       |
