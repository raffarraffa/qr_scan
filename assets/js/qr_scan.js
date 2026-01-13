let zxingModule = null;
let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let startBtn = document.getElementById('startBtn');
let stopBtn = document.getElementById('stopBtn');
let statusDiv = document.getElementById('status');
let cameraSelect = document.getElementById('cameraSelect');
let stream = null;
let scanning = false;
let isPaused = false;
let animationId = null;
let selectedDeviceId = null;

async function initZXing() {
  try {
    updateStatus('Cargando módulos...', 'info');
    zxingModule = await ZXing({
      locateFile: (path) => {
        if (path.endsWith('.wasm')) {
          return 'assets/wasm/zxing_reader.wasm';
        }
        return path;
      }
    });
    updateStatus('Módulo cargado correctamente.', 'success');
  } catch (error) {
    updateStatus('Error al cargar el módulo: ' + error.message, 'error');
  }
}

function updateStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
}

async function startCamera() {
  try {
    updateStatus('Solicitando acceso a la cámara...', 'info');
    const configurations = [];
    if (selectedDeviceId) {
      configurations.push(
        {
          video: {
            deviceId: { exact: selectedDeviceId },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        },
        {
          video: {
            deviceId: { exact: selectedDeviceId }
          }
        }
      );
    }
    configurations.push(
      {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      },
      {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      },
      {
        video: {
          facingMode: 'environment'
        }
      },
      {
        video: true
      }
    );
    let lastError = null;
    for (let i = 0; i < configurations.length; i++) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(configurations[i]);
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          startBtn.disabled = true;
          stopBtn.disabled = false;
          scanning = true;
          updateStatus(`Cámara activa (${video.videoWidth}x${video.videoHeight}). Escaneando QR, códigos de barras y PDF417...`, 'scanning');
          scanBarcode();
        };
        return;
      } catch (err) {
        lastError = err;
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          throw new Error('Permiso de cámara denegado.');
        }
        continue;
      }
    }
    throw lastError || new Error('No se pudo acceder a la cámara.');
  } catch (error) {
    updateStatus('❌ Error: ' + error.message, 'error');
    if (error.name === 'NotAllowedError' || error.message.includes('denegado')) {
      setTimeout(() => {
        updateStatus('💡 Consejo: Verifica los permisos de cámara en la configuración del navegador', 'error');
      }, 2000);
    } else if (error.name === 'NotFoundError') {
      updateStatus('❌ No se encontró ninguna cámara en este dispositivo', 'error');
    } else if (error.name === 'NotReadableError') {
      updateStatus('❌ La cámara está siendo usada por otra aplicación', 'error');
    }
  }
}

function stopCamera() {
  scanning = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  video.srcObject = null;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  updateStatus('Cámara detenida', 'info');
}

// Formatos a intentar: QR, PDF417 y códigos de barras comunes
const FORMATS_TO_TRY = [
  'QRCode',  
  'Code128',
  'Code39',
  'Code93',
  'EAN13',
  'EAN8',
  'UPC_A',
  'UPC_E',
  'ITF',
  'Codabar'
];

function getFormatDisplayName(format) {
  const names = {
    'QRCode': 'Código QR',
    'Code128': 'Código de Barras (Code128)',
    'Code39': 'Código de Barras (Code39)',
    'Code93': 'Código de Barras (Code93)',
    'EAN13': 'Código de Barras (EAN-13)',
    'EAN8': 'Código de Barras (EAN-8)',
    'UPC_A': 'Código de Barras (UPC-A)',
    'UPC_E': 'Código de Barras (UPC-E)',
    'ITF': 'Código de Barras (ITF)',
    'Codabar': 'Código de Barras (Codabar)'
  };
  return names[format] || format;
}

function handleDetectionSuccess(result, format) {
  if (isPaused) return;
  isPaused = true;

  const displayName = getFormatDisplayName(format);

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: `${displayName} Detectado!`,
      text: result.text,
      icon: 'success',
      timer: 5000,
      timerProgressBar: true,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      heightAuto: false,
      customClass: {
        htmlContainer: 'swal-text-wrap'
      },
      didClose: () => {
        setTimeout(resumeScanning, 500);
      }
    });
  } else {
    alert(`${displayName} Detectado:\n\n${result.text}`);
    setTimeout(resumeScanning, 1000);
  }
  updateStatus(`${displayName} detectado!`, 'success');
}

function resumeScanning() {
  isPaused = false;
  if (scanning) {
    scanBarcode();
  }
}

async function listCameras() {
  try {
    let tempStream = null;
    try {
      tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
    } catch (err) {
      console.warn('No se pudieron obtener permisos iniciales:', err);
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    if (tempStream) {
      tempStream.getTracks().forEach(track => track.stop());
    }
    cameraSelect.innerHTML = '';
    if (videoDevices.length === 0) {
      cameraSelect.innerHTML = '<option value="">No se encontraron cámaras</option>';
      return;
    }
    videoDevices.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      let label = device.label || `Cámara ${index + 1}`;
      const labelLower = label.toLowerCase();
      const isBack = labelLower.includes('back') ||
        labelLower.includes('trasera') ||
        labelLower.includes('rear') ||
        labelLower.includes('environment');
      const isMacro = labelLower.includes('macro');
      const isWide = labelLower.includes('wide') || labelLower.includes('ultra');
      const isTele = labelLower.includes('tele') || labelLower.includes('zoom');
      if (isMacro) label += ' MACRO';
      else if (isWide) label += ' WIDE';
      else if (isTele) label += ' TELE';
      else if (isBack) label += ' PRINCIPAL';
      option.textContent = label;
      if (isBack && !isMacro && !isWide) {
        option.selected = true;
        selectedDeviceId = device.deviceId;
      }
      cameraSelect.appendChild(option);
    });
    if (!selectedDeviceId && videoDevices.length > 0) {
      selectedDeviceId = videoDevices[0].deviceId;
      cameraSelect.selectedIndex = 0;
    }
  } catch (error) {
    cameraSelect.innerHTML = '<option value="">Error al listar cámaras</option>';
  }
}

cameraSelect.addEventListener('change', (e) => {
  selectedDeviceId = e.target.value;
  if (scanning) {
    stopCamera();
    setTimeout(() => startCamera(), 500);
  }
});

function processImage(originalImageData) {
  if (!scanning || isPaused) return;
  try {
    // Intentar con imagen original primero
    for (const format of FORMATS_TO_TRY) {
      const result = tryReadBarcode(originalImageData, format);
      if (result) {
        handleDetectionSuccess(result, format);
        return;
      }
    }
    
    // Si no se detectó nada, intentar con escalado (útil para códigos pequeños)
    const scales = [1.5, 0.7];
    for (const scale of scales) {
      const scaledImageData = scaleImageData(originalImageData, scale);
      for (const format of FORMATS_TO_TRY) {
        const result = tryReadBarcode(scaledImageData, format);
        if (result) {
          handleDetectionSuccess(result, format);
          return;
        }
      }
    }
  } catch (error) {
    console.error('Scan error:', error);
  }
  scanBarcode();
}

function scaleImageData(imageData, scaleFactor) {
  const scaledWidth = Math.floor(imageData.width * scaleFactor);
  const scaledHeight = Math.floor(imageData.height * scaleFactor);
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = scaledWidth;
  tempCanvas.height = scaledHeight;
  const tempCtx = tempCanvas.getContext('2d');
  const tempCanvas2 = document.createElement('canvas');
  tempCanvas2.width = imageData.width;
  tempCanvas2.height = imageData.height;
  const tempCtx2 = tempCanvas2.getContext('2d');
  tempCtx2.putImageData(imageData, 0, 0);
  tempCtx.imageSmoothingEnabled = true;
  tempCtx.imageSmoothingQuality = 'high';
  tempCtx.drawImage(tempCanvas2, 0, 0, scaledWidth, scaledHeight);
  return tempCtx.getImageData(0, 0, scaledWidth, scaledHeight);
}

function tryReadBarcode(imageData, format) {
  const buffer = imageData.data;
  const len = buffer.length;
  const ptr = zxingModule._malloc(len);
  try {
    zxingModule.HEAPU8.set(buffer, ptr);
    const result = zxingModule.readBarcodeFromPixmap(
      ptr,
      imageData.width,
      imageData.height,
      true,
      format
    );
    if (result && result.text && result.text.length > 0) {
      return {
        text: result.text,
        format: format
      };
    }
  } catch (error) {
    console.error(`Error reading ${format}:`, error);
  } finally {
    zxingModule._free(ptr);
  }
  return null;
}

function scanBarcode() {
  if (!scanning || !zxingModule) return;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  requestAnimationFrame(() => processImage(originalImageData));
}

startBtn.addEventListener('click', startCamera);
stopBtn.addEventListener('click', stopCamera);
window.addEventListener('load', () => {
  initZXing();
  listCameras();
});