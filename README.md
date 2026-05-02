# KuraDex 🎎

[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)](https://firebase.google.com/)

**KuraDex** is a minimalist, high-performance anime figure collection tracker and equipment manager. Designed specifically for serious collectors who want a beautiful interface to showcase their plastic crack, track preorders, and manage the logistics of display cabinets and pricing.

## ✨ Features

- 🏛️ **Digital Gallery**: Maintain a pristine record of your scale figures and prize figures.
- 📦 **Preorder Tracker**: Never lose track of estimated arrival dates or downpayments.
- 🛠️ **Equipment Inventory**: Manage shelving units, display cases, and lighting costs.
- 📈 **Collection Analytics**: Automatically calculate total collection value (including shipping costs).
- 🖼️ **Public Showcases**: Create curated exhibitions to share your collection with the community.
- 🌓 **Dynamic Interface**: Modern, minimalist design with support for both Light and Dark modes.

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Motion](https://motion.dev/) (Framer Motion)
- **Backend Service**: [Firebase](https://firebase.google.com/) (Authentication & Firestore)
- **State Management**: React Hooks + Context API
- **Form Handling**: React Hook Form + [Zod](https://zod.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Image Storage**: [Cloudinary](https://cloudinary.com/) (Integrated via SDK)

## 🚀 Getting Started

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment**:
   Create a `.env` file with your Firebase and Cloudinary credentials (follow `.env.example`).
4. **Run development server**:
   ```bash
   npm run dev
   ```

## 📁 Project Structure

- `src/pages`: Individual route components (Dashboard, Profile, Settings, etc.)
- `src/shared`: Reusable hooks, services, contexts, and utility functions.
- `src/components`: UI components (modals, forms, cards).
- `firebase-blueprint.json`: The source of truth for the database schema.

---
*Created with ❤️ for the Figure Collecting Community.*
