# E-Scan QR WASM

Lector de códigos QR de alto rendimiento utilizando **ZXing WebAssembly** para un procesamiento rápido y eficiente directamente en el navegador.

## Características

- **Procesamiento WASM**: Utiliza la potencia de C++ compilado a WebAssembly para decodificar códigos QR.
- **Soporte Multicámara**: Selector de dispositivos para alternar entre cámaras frontales, traseras, macro y teleobjetivo.
- **Diseño Responsive**: Interfaz moderna y adaptable optimizada para dispositivos móviles con efectos de glassmorphism.
- **Feedback Visual**: Estados en tiempo real (Cargando, Escaneando, Éxito) y modales elegantes con SweetAlert2.
- **Alto Rendimiento**: Escalado de imagen inteligente para mejorar la detección en condiciones difíciles.

## Estructura del Proyecto

```text
/
├── index.html            
└── assets/
    ├── css/
    │   └── style.css     
    ├── js/
    │   ├── qr_scan.js    
    │   └── zxing_reader.js 
    └── wasm/
        └── zxing_reader.wasm 
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

---
Creado para aplicaciones web modernas.
