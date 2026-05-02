# Entity Relationship Diagram (ERD) & Data Model

This document describes the Firestore database structure for **KuraDex**.

## 📊 Database Schema Overview

KuraDex uses a flat Firestore structure for maximum query flexibility and performance. Relationships are established via `userId` or specific entity IDs (e.g., `sourceAnime`).

### 1. Users (`/users/{userId}`)
Stores user profile information and public showcase preferences.

| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | `string` | Primary Key (Firebase Auth UID) |
| `displayName` | `string` | Display name of the collector |
| `photoURL` | `string` | Avatar image URL |
| `featuredFigureIds` | `array<string>` | List of item IDs shown on top of the profile |
| `createdAt` | `timestamp` | Profile registration date |

### 2. Action Figures (`/actionFigures/{figureId}`)
The primary collection for physical items owned by the user.

| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | `string` | Owner reference |
| `characterName` | `string` | Name of the character |
| `maker` | `string` | Reference to a Maker name |
| `figureLine` | `string` | e.g. "Nendoroid", "Figma", "POP UP PARADE" |
| `scale` | `enum` | 1/1, 1/2, 1/4, 1/6, 1/7, 1/8 |
| `totalPrice` | `number` | Cost of the figure |
| `shippingCost` | `number` | Logistics cost |
| `sourceAnime` | `string` | Reference to an Anime title |
| `isGifted` | `boolean` | Flag for cost exemption in totals |
| `imageUrls` | `array<string>` | Gallery of photos |

### 3. Preorders (`/preorders/{preorderId}`)
Items paid or reserved that are not yet in hand.

| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | `string` | Owner reference |
| `figureName` | `string` | Future figure name |
| `seller` | `string` | e.g. "AmiAmi", "GoodSmile Shop" |
| `datePreordered` | `string` | Reservation date |
| `estimatedArrival` | `string` | ETA string |
| `preorderPrice` | `number` | Expected total cost |
| `downpayment` | `number` | Already paid amount |

### 4. Equipment (`/equipments/{equipmentId}`)
Logistics and display infrastructure costs.

| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | `string` | Owner reference |
| `description` | `string` | e.g. "IKEA Detolf", "Custom LED Strips" |
| `totalPrice` | `number` | Cost of the equipment |

### 5. Showcases (`/showcases/{showcaseId}`)
Shared or private curated collections.

| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | `string` | Owner reference |
| `name` | `string` | Title of the showcase |
| `description` | `string` | Exhibition text |
| `thumbnailUrl` | `string` | Hero image |
| `priority` | `number` | Order in list |

## 🔗 Relationships

- **User -> Figures/Preorders/Equipments/Showcases**: One-to-Many (via `userId`).
- **Figures -> Anime/Maker**: Soft relationship via string matching or ID references (managed by global collections `/anime` and `/makers`).

## 🛡️ Security Logic
- **Private Data**: Only the `userId` owner can write/delete their own items.
- **Public Data**: Showcases and User profiles are readable by anyone for community features.
