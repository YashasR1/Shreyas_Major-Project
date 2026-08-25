import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Camera, X, CheckCircle2, AlertCircle, Loader2, RefreshCw, Scan, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FaceCaptureModal({ user, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState(null);
  const [detectionFeedback, setDetectionFeedback] = useState('Requesting web camera permission...');
  const [simulating, setSimulating] = useState(false);

  // Load @vladmandic/face-api neural models, boot web camera, and run a background shader warmup pass
  useEffect(() => {
    let isMounted = true;

    // Boot camera immediately without waiting for CDN download so user sees video instantly
    startCamera();

    async function loadModels() {
      try {
        const modelUrl = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        console.log('Loading face-api models from CDN...');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl),
        ]);

        // WARM-UP PASS: Run dummy detection to force TensorFlow WebGL/CPU shader compilation in background!
        // This eliminates the 10-15 second lag on the user's first real capture click!
        try {
          console.log('Running neural engine warm-up pass...');
          const dummyCanvas = document.createElement('canvas');
          dummyCanvas.width = 320;
          dummyCanvas.height = 320;
          await faceapi.detectSingleFace(
            dummyCanvas,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
          );
          console.log('⚡ Neural engine warmed up! Face scanning will now execute near-instantaneously.');
        } catch (warmupErr) {
          console.warn('Warmup warning (ignored):', warmupErr);
        }

        if (isMounted) {
          setModelsLoaded(true);
          setDetectionFeedback('⚡ Neural models warmed up & camera ready! Position face and tap Capture.');
        }
      } catch (err) {
        console.error('Error loading face-api models:', err);
        if (isMounted) {
          setError('Failed to load neural models from CDN. You can use Quick Demo Simulation below.');
        }
      }
    }
    loadModels();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
        };
        setCameraActive(true);
        setDetectionFeedback('Webcam feed active! Align face inside frame and click Capture.');
      } else {
        setCameraActive(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        }, 100);
      }
    } catch (err) {
      console.warn('Webcam permission denied or device not found:', err);
      setError('Webcam device unavailable or permission denied. Please enable camera permissions in your browser bar.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleExecuteCapture = async () => {
    if (!modelsLoaded || !videoRef.current || !cameraActive) return;

    setDetecting(true);
    setError(null);
    setDetectionFeedback('📸 Snapshot frozen! Computing 128-point vector (you can relax now)...');

    const video = videoRef.current;

    try {
      // 1. INSTANT FREEZE FRAME: Pause the live webcam feed instantly!
      // This prevents blurring or encoding distortion if the person moves or steps away during calculation.
      video.pause();

      // 2. Draw frozen video frame onto an immutable offscreen photo canvas
      const snapshotCanvas = document.createElement('canvas');
      snapshotCanvas.width = video.videoWidth || 640;
      snapshotCanvas.height = video.videoHeight || 480;
      const ctx = snapshotCanvas.getContext('2d');
      ctx.drawImage(video, 0, 0, snapshotCanvas.width, snapshotCanvas.height);

      // 3. Run face recognition on the static snapshot (Optimized inputSize 320 for sub-second speed)
      const detection = await faceapi
        .detectSingleFace(
          snapshotCanvas,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        // Resume video stream so user can reposition and try again
        video.play();
        setError('No clear face detected in snapshot! Ensure optimal lighting, face camera directly, and try again.');
        setDetecting(false);
        setDetectionFeedback('Webcam resumed. Align face inside frame and click Capture.');
        return;
      }

      // CRITICAL INSTRUCTION / COMMENT FROM USER:
      // Convert Float32Array to standard JavaScript array using Array.from(descriptor) before executing Supabase UPDATE
      const float32Descriptor = detection.descriptor;
      const standardJsArray = Array.from(float32Descriptor);

      console.log('Successfully captured Face Descriptor from frozen snapshot:', {
        type: float32Descriptor.constructor.name,
        convertedType: Array.isArray(standardJsArray) ? 'Array' : 'Unknown',
        length: standardJsArray.length
      });

      setDetectionFeedback('✅ 128-point facial encoding successfully verified! Saving to database...');

      stopCamera();
      setTimeout(() => {
        onCapture(standardJsArray);
      }, 500);

    } catch (err) {
      console.error('Capture Error:', err);
      if (video) video.play();
      setError('An error occurred while computing face vector: ' + err.message);
      setDetecting(false);
    }
  };

  const handleSimulateCapture = () => {
    setSimulating(true);
    setDetectionFeedback('Generating synthetic 128-point facial encoding array for demo...');
    stopCamera();

    setTimeout(() => {
      const simulatedDescriptor = Array.from({ length: 128 }, (_, i) => parseFloat((Math.sin(i + 1) * 0.5 + 0.5).toFixed(4)));
      console.log('Simulated capture executed. Converted Array length:', simulatedDescriptor.length);
      onCapture(simulatedDescriptor);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-white border border-gray-200 shadow-2xl rounded-3xl overflow-hidden relative flex flex-col">
        {/* Top Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>Biometric Facial Recognition</span>
              </h3>
              <p className="text-xs font-mono text-gray-500">128-Point Neural Vector Encoding</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport content */}
        <div className="p-6 flex-1 flex flex-col items-center">
          <div className="w-full max-w-lg aspect-video bg-gray-900 rounded-2xl border border-gray-200 overflow-hidden relative flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${!cameraActive ? 'opacity-0 absolute pointer-events-none' : 'opacity-100'}`}
            />
            <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

            {/* Facial alignment overlay HUD */}
            {cameraActive ? (
              <div className="absolute inset-0 pointer-events-none rounded-2xl flex items-center justify-center z-20">
                {/* Sci-Fi HUD Brackets */}
                <div className="relative w-56 h-72">
                  <motion.div
                    className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 ${detecting ? 'border-orange-500' : 'border-blue-500'}`}
                    animate={{ x: [0, -5, 0], y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                  <motion.div
                    className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 ${detecting ? 'border-orange-500' : 'border-blue-500'}`}
                    animate={{ x: [0, 5, 0], y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                  <motion.div
                    className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 ${detecting ? 'border-orange-500' : 'border-blue-500'}`}
                    animate={{ x: [0, -5, 0], y: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                  <motion.div
                    className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 ${detecting ? 'border-orange-500' : 'border-blue-500'}`}
                    animate={{ x: [0, 5, 0], y: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />

                  {/* Sweeping Scanner Line */}
                  {!detecting && (
                    <motion.div
                      className="absolute left-0 w-full h-[2px] bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                    />
                  )}

                  <div className={`absolute inset-0 flex items-center justify-center transition-colors duration-500 ${detecting ? 'bg-orange-500/10' : 'bg-transparent'}`}>
                    {detecting && <Scan className="w-16 h-16 text-orange-400 animate-spin" style={{ animationDuration: '3s' }} />}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                <Camera className="w-16 h-16 text-gray-400 mb-3 animate-pulse" />
                <span className="font-mono text-sm text-gray-300">
                  {error ? 'Webcam feed offline.' : 'Connecting to live web camera...'}
                </span>
              </div>
            )}

            {/* Status indicator pill */}
            <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-200 text-xs flex items-center gap-2 text-gray-700 font-mono shadow-sm">
              {!modelsLoaded || detecting ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 flex-shrink-0" />
              ) : error ? (
                <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              )}
              <span className="truncate">{detectionFeedback}</span>
            </div>
          </div>

          {error && (
            <div className="w-full max-w-lg mt-4 p-3.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="block mb-0.5 font-bold">Webcam Notice:</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Action Footer Button Grid */}
          <div className="w-full max-w-lg mt-6 space-y-3">
            <button
              onClick={handleExecuteCapture}
              disabled={!modelsLoaded || !cameraActive || detecting || simulating}
              className="w-full py-3.5 rounded-xl bg-blue-800 hover:bg-blue-900 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {detecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Snapshot Frozen! Computing Vector & Calling Array.from()...</span>
                </>
              ) : (
                <>
                  <Scan className="w-5 h-5" />
                  <span>Capture Snapshot & Save 128-pt Vector</span>
                </>
              )}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-500 text-xs font-mono uppercase">OR QUICK DEMO</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <button
              onClick={handleSimulateCapture}
              disabled={detecting || simulating}
              className="w-full py-2.5 px-4 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-mono font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              {simulating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Injecting Synthetic 128-pt Array...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Simulate Instant Facial Encoding (Bypasses WebCam)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
