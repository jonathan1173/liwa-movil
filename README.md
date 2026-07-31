# Liwa Móvil 📱

Aplicación móvil desarrollada para la plataforma **Liwa**, construida con React Native y Expo. Permite a los usuarios registrarse, publicar productos/servicios, gestionar sus publicaciones, guardar favoritos y administrar su perfil.

---

## 🛠️ Tecnologías Utilizadas

- **Framework**: React Native con [Expo](https://expo.dev) (v54)
- **Navegación**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Lenguaje**: TypeScript
- **Backend & Base de datos**: [Supabase](https://supabase.com) (Autenticación y base de datos)
- **Gestión de imágenes**: `expo-image-picker`
- **Animaciones**: `react-native-reanimated`

---

## 📁 Estructura del Proyecto

```text
liwa-movil/
├── app/                  # Rutas y pantallas principales (Expo Router)
│   ├── (auth)/           # Flujo de autenticación (Login, Registro, Completar perfil)
│   ├── (tabs)/           # Navegación principal por pestañas
│   │   ├── inicio.tsx            # Feed / Catálogo principal
│   │   ├── favoritos.tsx         # Publicaciones guardadas
│   │   ├── publicar.tsx          # Formulario para crear publicaciones
│   │   ├── mis-publicaciones.tsx # Gestión de publicaciones propias
│   │   └── perfil.tsx            # Perfil del usuario
│   └── _layout.tsx       # Configuración global del Root Layout
├── components/           # Componentes UI reutilizables
├── lib/                  # Servicios e integraciones (Cliente Supabase)
├── constants/            # Colores, temas y constantes del sistema
└── assets/               # Imágenes, fuentes y recursos estáticos
```

---

## ✨ Funcionalidades Actuales

- **Autenticación**: Registro de nuevos usuarios, inicio de sesión y formulario para completar la información del perfil.
- **Exploración de Productos**: Pantalla principal con feed de publicaciones.
- **Creación de Publicaciones**: Carga de detalles e imágenes de productos/servicios.
- **Gestión Personal**: Vista y control de las publicaciones creadas por el usuario autenticado.
- **Favoritos**: Guardado de ítems de interés para acceso rápido.
- **Perfil de Usuario**: Consulta y actualización de datos personales.

---

## 🚀 Cómo Ejecutar el Proyecto

### 1. Requisitos previos
Tener instalado **Node.js** (v18 o superior) y la app **Expo Go** en tu dispositivo móvil o un emulador configurado.

### 2. Instalación de dependencias
```bash
npm install
```

### 3. Variables de entorno
Crea un archivo `.env` en la raíz del proyecto con las credenciales de tu proyecto de Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=tu_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 4. Iniciar el servidor de desarrollo
```bash
npx expo start
```
Escanea el código QR con **Expo Go** (Android) o la cámara (iOS).
