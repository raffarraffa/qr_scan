# E-Scan QR WASM

Lector de códigos QR de alto rendimiento utilizando **ZXing WebAssembly** para un procesamiento rápido y eficiente directamente en el navegador.

## Características

- **Procesamiento WASM**: Utiliza la potencia de C++ compilado a WebAssembly para decodificar códigos QR.
- **PWA (Progressive Web App)**: Instalable en dispositivos móviles y funciona offline gracias a Service Workers.
- **Soporte Multicámara**: Selector de dispositivos para alternar entre cámaras frontales, traseras, macro y teleobjetivo.
- **Diseño Responsive**: Interfaz moderna y adaptable optimizada para dispositivos móviles con efectos de glassmorphism.
- **Feedback Visual**: Estados en tiempo real (Cargando, Escaneando, Éxito) y modales elegantes con SweetAlert2.
- **Alto Rendimiento**: Escalado de imagen inteligente para mejorar la detección en condiciones difíciles.

## Estructura del Proyecto

```text
/
├── index.html            # Punto de entrada principal
├── manifest.json         # Configuración de PWA
├── sw.js                 # Service Worker para modo offline
└── assets/
    ├── css/
    │   └── style.css     # Estilos premium (Glassmorphism, Responsivo)
    ├── js/
    │   ├── qr_scan.js    # Lógica de la cámara y escaneo (Refactoreado)
    │   └── zxing_reader.js # Wrapper de la librería ZXing
    └── wasm/
        └── zxing_reader.wasm # Binario WebAssembly de ZXing
```

## Requisitos

- **Acceso a Cámara**: El navegador debe tener permisos para acceder a la cámara del dispositivo.

## Tecnologías

- [ZXing (Zebra Crossing)](https://github.com/zxing-cpp/zxing-cpp) - Motor de escaneo.
- WebAssembly (WASM).
- Vanilla JavaScript (ES6+).
- CSS3 (Variables, Flexbox, Animations).
- [SweetAlert2](https://sweetalert2.github.io/) - Notificaciones.

## Notas de Implementación

- **locateFile**: Se ha implementado un sistema de rutas relativas para que el script `zxing_reader.js` encuentre correctamente el binario en `assets/wasm/`.
- **Escalado Dinámico**: El motor intenta leer a resolución original y, si falla, aplica un escalado de 1.5x para capturar detalles más pequeños.