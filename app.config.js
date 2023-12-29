export default {
  "expo": {
    "name": "Where's Michi?",
    "owner": "xamin600",
    "slug": "Where's Michi?",
    "version": "1.0.1",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "jsEngine": 'jsc',
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
	"plugins": ["expo-image-picker"],
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "package": "com.xamin600.proyectomascotas", 
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "config": {
        "googleMaps": {
          "apiKey":"AIzaSyAozjCSYISlkP-mLiKk7r8zYmYgVZYIP-g",
        }
      },
	  "permissions": ["READ_EXTERNAL_STORAGE", "NOTIFICATIONS"]
    },
    "web": {
      "favicon": "./assets/favicon.png",
    },
    extra: {
      apiKey: "AIzaSyAozjCSYISlkP-mLiKk7r8zYmYgVZYIP-g",
      authDomain: "tfg-56e1b.firebaseapp.com",
      projectId: "tfg-56e1b",
      storageBucket: "tfg-56e1b.appspot.com",
      messagingSenderId: "54892743273",
      appId: "1:54892743273:web:007c4c189f1aac863330f8",
      measurementId: "G-6MFC6P2BV3",
      "eas": {
        "projectId": "63eedb2d-16ae-4c95-b5eb-a8a039b433a7"
      }
    }
  }
}