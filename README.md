# CalistenIA - Frontend

Aplicación móvil de fitness enfocada en calistenia con inteligencia artificial. Desarrollada con React Native y Expo.

## Descripción

CalistenIA es una aplicación de entrenamiento personal que combina calistenia con IA para generar rutinas personalizadas, rastrear progreso y proporcionar coaching inteligente a través de un chat interactivo.

## Características principales

- **Rutinas con IA**: Generación automática de entrenamientos HIIT, AMRAP y EMOM personalizados
- **Entrenamiento interactivo**: Timers, descansos y feedback de audio durante las sesiones
- **Chat inteligente**: Asistente virtual para consultas de fitness y generación de rutinas
- **Seguimiento de progreso**: Anillos de actividad estilo Apple Watch con historial de entrenamientos
- **Registro de alimentación**: Análisis nutricional de comidas mediante cámara con IA
- **Integración Spotify**: Playlists de workout durante el entrenamiento
- **Onboarding personalizado**: Cuestionario inicial para adaptar las rutinas al nivel del usuario

## Tecnologías

| Categoría | Tecnología |
|-----------|------------|
| Framework | React Native 0.81 |
| Plataforma | Expo SDK 54 |
| Navegación | React Navigation 7 |
| HTTP Client | Axios |
| Almacenamiento | AsyncStorage |
| Audio | expo-av |
| Cámara | expo-image-picker |
| Gráficos | react-native-svg |
| OAuth | expo-web-browser, expo-linking |

## Estructura del proyecto

```
├── App.js                    # Punto de entrada y navegación principal
├── src/
│   ├── api/                  # Clientes API
│   │   ├── client.js         # Configuración Axios
│   │   ├── auth.js           # Autenticación
│   │   ├── profile.js        # Perfil de usuario
│   │   ├── routines.js       # Rutinas
│   │   ├── training.js       # Sesiones de entrenamiento
│   │   ├── food.js           # Registro de alimentación
│   │   └── chat.js           # Chat con IA
│   ├── screens/              # Pantallas de la app
│   │   ├── AuthScreen.js     # Login/Registro
│   │   ├── RutinaScreen.js   # Rutina del día
│   │   ├── TrainingScreen.js # Sesión de entrenamiento activa
│   │   ├── ChatScreen.js     # Chat con IA
│   │   ├── ProgressScreen.js # Estadísticas y progreso
│   │   ├── ExercisesScreen.js# Lista de rutinas guardadas
│   │   ├── FoodScreen.js     # Registro nutricional
│   │   └── SpotifyAuthScreen.js # OAuth de Spotify
│   ├── components/           # Componentes reutilizables
│   │   └── OnboardingCarousel.js
│   ├── hooks/                # Custom hooks
│   │   └── useHealthData.js
│   └── styles/               # Estilos separados por pantalla
│       ├── appStyles.js
│       ├── rutinaStyles.js
│       └── ...
├── assets/                   # Iconos y splash screens
├── app.json                  # Configuración de Expo
└── package.json
```

## Instalación

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app (para desarrollo) o EAS Build (para APK/IPA)

### Pasos

1. Clonar el repositorio:
```bash
git clone https://github.com/Lingui14/Calistenia-Front-Expo.git
cd Calistenia-Front-Expo
```

2. Instalar dependencias:
```bash
npm install
```

3. Iniciar el servidor de desarrollo:
```bash
npm start
# o
expo start
```

4. Escanear el código QR con Expo Go (Android/iOS) o presionar `a` para Android emulator.

## Configuración

La aplicación se conecta al backend en Railway. La URL base está configurada en `src/api/client.js`:

```javascript
export const API_BASE_URL = 'https://calistenia-backend-production.up.railway.app';
```

Para desarrollo local, modificar esta URL apuntando al backend local.

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia Expo dev server |
| `npm run android` | Ejecuta en Android |
| `npm run ios` | Ejecuta en iOS |
| `npm run web` | Ejecuta en navegador |

## Build de producción

Para generar APK/AAB usando EAS Build:

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login en Expo
eas login

# Build para Android
eas build --platform android --profile preview
```

## Pantallas principales

### Rutina del día
Muestra la rutina activa con opción de generar nuevas rutinas con IA, iniciar entrenamiento y conectar Spotify.

### Entrenamiento
Sesión interactiva con timer, progreso por ejercicio, soporte para HIIT/AMRAP/EMOM y feedback de audio.

### Chat IA
Conversación con CalistenIA para consultas de fitness, generación de rutinas personalizadas y análisis de progreso.

### Progreso
Anillos de actividad (entrenamientos, minutos activos, calorías), historial de sesiones y estadísticas semanales/mensuales.

### Alimentación
Registro manual de comidas y análisis automático de fotos mediante IA con estimación de macronutrientes.

## Diseño

La aplicación utiliza un diseño minimalista en blanco y negro, sin emojis, enfocado en claridad y profesionalismo.

## Contribuir

1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Abrir Pull Request

## Autor

Carlos y Alessio-[@Sebastiux] [@Lingui14](https://github.com/Lingui14)

## Licencia

Este proyecto está bajo licencia privada.
