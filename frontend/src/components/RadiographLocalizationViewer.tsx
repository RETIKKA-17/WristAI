import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Eye, 
  Layers, 
  Flame, 
  ZoomIn, 
  Pencil, 
  Sliders, 
  Save, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Sparkles
} from 'lucide-react';
import { LocalizationInfo, ClinicianAnnotation, BoundingBox } from '../types';
import { saveCaseAnnotationApi, deleteCaseAnnotationApi, getAssetUrl } from '../services/api';

interface RadiographLocalizationViewerProps {
  imageUrl: string;
  gradcamUrl?: string;
  referenceHeatmapUrl?: string;
  caseId: string;
  aiPrediction: 'FRACTURE' | 'NORMAL' | 'UNCERTAIN';
  localization?: LocalizationInfo;
  initialAnnotations?: ClinicianAnnotation[];
  onAnnotationSaved?: (ann: ClinicianAnnotation) => void;
  onAnnotationDeleted?: (id: number) => void;
}

export type ViewMode = 'original' | 'reference' | 'ref_heatmap' | 'gradcam' | 'zoomed' | 'annotate';

interface RenderedMetrics {
  naturalWidth: number;
  naturalHeight: number;
  renderedWidth: number;
  renderedHeight: number;
  containerWidth: number;
  containerHeight: number;
}

export const RadiographLocalizationViewer: React.FC<RadiographLocalizationViewerProps> = ({
  imageUrl,
  gradcamUrl,
  referenceHeatmapUrl,
  caseId,
  aiPrediction,
  localization,
  initialAnnotations = [],
  onAnnotationSaved,
  onAnnotationDeleted
}) => {
  // Default to reference view for fracture cases, original for normal
  const [viewMode, setViewMode] = useState<ViewMode>(
    aiPrediction === 'NORMAL' ? 'original' : 'reference'
  );
  const [annotations, setAnnotations] = useState<ClinicianAnnotation[]>(initialAnnotations);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDraftBox, setCurrentDraftBox] = useState<BoundingBox | null>(null);
  const [savingAnnotation, setSavingAnnotation] = useState(false);
  const [annotationNotes, setAnnotationNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [highContrastZoom, setHighContrastZoom] = useState(false);

  // Measured rendered dimensions of the actual image bitmap
  const [metrics, setMetrics] = useState<RenderedMetrics | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const zoomCanvasRef = useRef<HTMLCanvasElement>(null);
  const mainZoomCanvasRef = useRef<HTMLCanvasElement>(null);

  // Sync annotations when props change
  useEffect(() => {
    setAnnotations(initialAnnotations);
  }, [initialAnnotations]);

  // Determine if active reference box exists
  const hasReferenceBox = Boolean(
    aiPrediction !== 'NORMAL' && 
    localization?.has_localization && 
    localization.bounding_box
  );

  const hasManual = annotations.length > 0;
  const latestManual = hasManual ? annotations[0] : null;

  // Active box based on viewMode
  const activeBox: BoundingBox | null = (() => {
    if (viewMode === 'original' || viewMode === 'gradcam') return null;
    if (currentDraftBox) return currentDraftBox;
    if (viewMode === 'annotate') {
      if (latestManual) {
        return {
          x_min: latestManual.x_min,
          y_min: latestManual.y_min,
          x_max: latestManual.x_max,
          y_max: latestManual.y_max
        };
      }
      return null;
    }
    // In reference, ref_heatmap, or zoomed mode
    if (hasReferenceBox && localization?.bounding_box) {
      return localization.bounding_box;
    }
    if (viewMode === 'reference' && latestManual) {
      return {
        x_min: latestManual.x_min,
        y_min: latestManual.y_min,
        x_max: latestManual.x_max,
        y_max: latestManual.y_max
      };
    }
    return null;
  })();

  const activeLabel: string = (() => {
    if (currentDraftBox) return 'NEW CLINICIAN DRAFT';
    if (viewMode === 'annotate' && latestManual) return latestManual.label || 'CLINICIAN ANNOTATION';
    if (viewMode === 'ref_heatmap') return 'PDF REFERENCE-GUIDED FRACTURE REGION – NOT AI DETECTION';
    if (hasReferenceBox && localization) return 'FRACTURE REGION';
    if (latestManual) return 'CLINICIAN ANNOTATION';
    return 'FRACTURE REGION';
  })();

  const isClinicianSource = Boolean(currentDraftBox || (viewMode === 'annotate') || (!hasReferenceBox && latestManual));

  // Compute exact rendered dimensions of the image inside stage
  const recalculateDimensions = useCallback(() => {
    const img = imgRef.current;
    const stage = stageRef.current;
    if (!img || !stage) return;

    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    if (!nw || !nh) return;

    const rect = img.getBoundingClientRect();
    const newMetrics: RenderedMetrics = {
      naturalWidth: nw,
      naturalHeight: nh,
      renderedWidth: rect.width || img.clientWidth,
      renderedHeight: rect.height || img.clientHeight,
      containerWidth: stage.clientWidth,
      containerHeight: stage.clientHeight
    };

    setMetrics(newMetrics);
  }, []);

  // Recalculate dimensions on initial mount, cached images, URL change, or viewMode change
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      recalculateDimensions();
    }
  }, [imageUrl, gradcamUrl, viewMode, recalculateDimensions]);

  // Update metrics on window resize and stage resize via ResizeObserver
  useEffect(() => {
    window.addEventListener('resize', recalculateDimensions);
    const stage = stageRef.current;
    let observer: ResizeObserver | null = null;
    if (stage && window.ResizeObserver) {
      observer = new ResizeObserver(() => recalculateDimensions());
      observer.observe(stage);
    }
    return () => {
      window.removeEventListener('resize', recalculateDimensions);
      if (observer) observer.disconnect();
    };
  }, [recalculateDimensions]);

  // Render high-precision canvas-based zoomed fracture preview in panel
  useEffect(() => {
    if (!activeBox || !imgRef.current) return;
    const canvas = zoomCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imgRef.current;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    if (!nw || !nh) return;

    // Calculate source crop coordinates from original natural bitmap
    const sx = activeBox.x_min * nw;
    const sy = activeBox.y_min * nh;
    const sw = Math.max(1, (activeBox.x_max - activeBox.x_min) * nw);
    const sh = Math.max(1, (activeBox.y_max - activeBox.y_min) * nh);

    canvas.width = 440;
    canvas.height = 240;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (highContrastZoom) {
      ctx.filter = 'contrast(1.45) brightness(1.08)';
    } else {
      ctx.filter = 'none';
    }

    // Draw magnified crop
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    // Subtle crosshair in center
    ctx.filter = 'none';
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();

  }, [activeBox, viewMode, highContrastZoom, metrics]);

  // Render main stage zoomed canvas when viewMode === 'zoomed'
  useEffect(() => {
    if (viewMode !== 'zoomed' || !activeBox || !imgRef.current) return;
    const canvas = mainZoomCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imgRef.current;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    if (!nw || !nh) return;

    const sx = activeBox.x_min * nw;
    const sy = activeBox.y_min * nh;
    const sw = Math.max(1, (activeBox.x_max - activeBox.x_min) * nw);
    const sh = Math.max(1, (activeBox.y_max - activeBox.y_min) * nh);

    canvas.width = 600;
    canvas.height = 420;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (highContrastZoom) {
      ctx.filter = 'contrast(1.45) brightness(1.08)';
    } else {
      ctx.filter = 'none';
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    // Delineate center target reticle
    ctx.filter = 'none';
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

  }, [viewMode, activeBox, highContrastZoom, metrics]);

  // Handle clinician annotation drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (viewMode !== 'annotate') return;
    const target = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - target.left;
    const clickY = e.clientY - target.top;

    const normX = Math.max(0, Math.min(1, clickX / target.width));
    const normY = Math.max(0, Math.min(1, clickY / target.height));

    setIsDrawing(true);
    setDrawStart({ x: normX, y: normY });
    setCurrentDraftBox({
      x_min: normX,
      y_min: normY,
      x_max: normX,
      y_max: normY
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart) return;
    const target = e.currentTarget.getBoundingClientRect();
    const curX = e.clientX - target.left;
    const curY = e.clientY - target.top;

    const normX = Math.max(0, Math.min(1, curX / target.width));
    const normY = Math.max(0, Math.min(1, curY / target.height));

    const x_min = Math.min(drawStart.x, normX);
    const x_max = Math.max(drawStart.x, normX);
    const y_min = Math.min(drawStart.y, normY);
    const y_max = Math.max(drawStart.y, normY);

    setCurrentDraftBox({
      x_min,
      y_min,
      x_max,
      y_max,
      width: x_max - x_min,
      height: y_max - y_min
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentDraftBox && (currentDraftBox.x_max - currentDraftBox.x_min < 0.02 || currentDraftBox.y_max - currentDraftBox.y_min < 0.02)) {
      setCurrentDraftBox(null);
    }
  };

  const handleSaveClinicianAnnotation = async () => {
    if (!currentDraftBox) return;
    try {
      setSavingAnnotation(true);
      const res = await saveCaseAnnotationApi(caseId, {
        x_min: currentDraftBox.x_min,
        y_min: currentDraftBox.y_min,
        x_max: currentDraftBox.x_max,
        y_max: currentDraftBox.y_max,
        label: 'CLINICIAN ANNOTATION',
        notes: annotationNotes.trim() || undefined
      });
      setAnnotations([res, ...annotations]);
      setCurrentDraftBox(null);
      setAnnotationNotes('');
      setSaveSuccess(true);
      if (onAnnotationSaved) onAnnotationSaved(res);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save annotation');
    } finally {
      setSavingAnnotation(false);
    }
  };

  const handleDeleteAnnotation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this clinician annotation?')) return;
    try {
      await deleteCaseAnnotationApi(caseId, id);
      setAnnotations(annotations.filter(a => a.id !== id));
      if (onAnnotationDeleted) onAnnotationDeleted(id);
    } catch (err: any) {
      alert(err.message || 'Failed to delete annotation');
    }
  };

  return (
    <div className="space-y-4">
      {/* ---------------- VIEW MODE SWITCHER TOOLBAR ---------------- */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 1. Original X-ray */}
          <button
            type="button"
            onClick={() => setViewMode('original')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'original'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Original X-ray</span>
          </button>

          {/* 2. PDF Reference Fracture Box */}
          <button
            type="button"
            onClick={() => setViewMode('reference')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'reference'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>PDF Reference Fracture Box</span>
            {hasReferenceBox && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-300 animate-pulse ml-0.5" />
            )}
          </button>

          {/* 3. PDF Reference-Guided Fracture Region */}
          <button
            type="button"
            onClick={() => setViewMode('ref_heatmap')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'ref_heatmap'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>PDF Reference-Guided Fracture Region</span>
            {hasReferenceBox && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse ml-0.5" />
            )}
          </button>

          {/* 4. Attention Heatmap */}
          {gradcamUrl && (
            <button
              type="button"
              onClick={() => setViewMode('gradcam')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'gradcam'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Attention Heatmap</span>
            </button>
          )}

          {/* 5. Zoomed Fracture Region */}
          <button
            type="button"
            onClick={() => setViewMode('zoomed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'zoomed'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>Zoomed Fracture Region</span>
          </button>

          {/* Clinician Annotation Tool */}
          <button
            type="button"
            onClick={() => setViewMode('annotate')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'annotate'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Interactive Clinician Annotation Tool"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Annotate</span>
            {annotations.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/40 rounded-full font-mono">
                {annotations.length}
              </span>
            )}
          </button>
        </div>

        {/* Status Tag on Toolbar */}
        <div className="text-[11px] px-2.5 py-1 bg-slate-800/80 rounded-lg text-slate-300 border border-slate-700/60 flex items-center gap-1.5">
          {viewMode === 'reference' && hasReferenceBox && (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="font-semibold text-rose-300">
                PDF REFERENCE ANNOTATION – NOT AI DETECTION
              </span>
              {localization?.reference_case_id && (
                <span className="text-[9px] font-mono px-1 py-0.2 bg-rose-950 text-rose-300 rounded border border-rose-800">
                  {localization.reference_case_id}
                </span>
              )}
            </>
          )}
          {viewMode === 'reference' && !hasReferenceBox && aiPrediction !== 'NORMAL' && (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="font-semibold text-amber-300">Fracture localization unavailable</span>
            </>
          )}
          {viewMode === 'reference' && aiPrediction === 'NORMAL' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-emerald-300">Normal reference image</span>
            </>
          )}
          {viewMode === 'ref_heatmap' && hasReferenceBox && (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-semibold text-amber-300">
                PDF Reference-Guided Fracture Region – Not AI Detection
              </span>
              {localization?.reference_case_id && (
                <span className="text-[9px] font-mono px-1 py-0.2 bg-amber-950 text-amber-300 rounded border border-amber-800">
                  {localization.reference_case_id}
                </span>
              )}
            </>
          )}
          {viewMode === 'ref_heatmap' && !hasReferenceBox && aiPrediction !== 'NORMAL' && (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="font-semibold text-amber-300">Fracture localization unavailable</span>
            </>
          )}
          {viewMode === 'ref_heatmap' && aiPrediction === 'NORMAL' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-emerald-300">Normal reference image</span>
            </>
          )}
          {viewMode === 'original' && (
            <>
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Original X-ray</span>
            </>
          )}
          {viewMode === 'gradcam' && (
            <>
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-slate-200">Attention Heatmap</span>
            </>
          )}
          {viewMode === 'zoomed' && (
            <>
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-purple-200">
                {hasReferenceBox ? `Zoomed Fracture Region (${localization?.reference_case_id || 'Reference'})` : 'Zoomed View'}
              </span>
            </>
          )}
          {viewMode === 'annotate' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-200">Drag to Mark Fracture Region</span>
            </>
          )}
        </div>
      </div>

      {/* ---------------- MAIN RADIOGRAPH STAGE ---------------- */}
      <div 
        ref={stageRef}
        className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center min-h-[480px] select-none p-3"
      >
        {/* VIEW 5: ZOOMED FRACTURE REGION IN MAIN STAGE */}
        {viewMode === 'zoomed' ? (
          hasReferenceBox && activeBox ? (
            <div className="flex flex-col items-center justify-center space-y-3 py-2 w-full max-w-xl">
              <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl p-1">
                <canvas
                  ref={mainZoomCanvasRef}
                  className="max-h-[420px] max-w-full rounded shadow block"
                />
                <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-xs text-[10px] text-white px-2.5 py-1 rounded font-mono border border-slate-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>ZOOMED FRACTURE REGION — HIGH RESOLUTION INSET</span>
                </div>
                {localization?.reference_case_id && (
                  <div className="absolute top-3 right-3 bg-rose-950/90 text-rose-300 text-[10px] font-mono font-bold px-2 py-1 rounded border border-rose-800">
                    {localization.reference_case_id}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between w-full text-xs text-slate-400 px-2 font-mono">
                <span>Box: [{activeBox.x_min.toFixed(5)}, {activeBox.y_min.toFixed(5)}, {activeBox.x_max.toFixed(5)}, {activeBox.y_max.toFixed(5)}]</span>
                <span className="text-rose-400 font-bold">PDF Reference Fracture Box Inset</span>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 space-y-2">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto opacity-75" />
              <h4 className="text-sm font-bold text-slate-200">
                {aiPrediction === 'NORMAL' ? 'Normal Reference Image' : 'Zoom Preview Unavailable'}
              </h4>
              <p className="text-xs text-slate-400 max-w-md">
                {aiPrediction === 'NORMAL' 
                  ? 'No fracture bounding box is present on normal reference radiographs.'
                  : 'Fracture localization unavailable for this image. Zoom inset is only available for verified reference fracture cases.'}
              </p>
            </div>
          )
        ) : (
          /* VIEWS 1, 2, 3, 4, 6: BASE RADIOGRAPH + OVERLAYS */
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
              position: 'relative',
              display: 'inline-block',
              maxWidth: '100%',
              margin: '0 auto',
              lineHeight: 0
            }}
            className={`${viewMode === 'annotate' ? 'cursor-crosshair' : 'cursor-default'}`}
          >
            {/* Base Radiograph or Grad-CAM */}
            <img
              ref={imgRef}
              src={viewMode === 'gradcam' && gradcamUrl ? getAssetUrl(gradcamUrl) : getAssetUrl(imageUrl)}
              crossOrigin="anonymous"
              alt="Wrist Radiograph"
              onLoad={recalculateDimensions}
              style={{
                display: 'block',
                maxHeight: '520px',
                width: 'auto',
                height: 'auto',
                maxWidth: '100%',
                objectFit: 'contain',
                borderRadius: '6px'
              }}
              className="pointer-events-none select-none"
              draggable={false}
            />

            {/* ---------------- 2. PDF REFERENCE FRACTURE BOX OVERLAY ---------------- */}
            {/* Clear red rectangular border, transparent interior, red FRACTURE REGION label */}
            {activeBox && (viewMode === 'reference' || viewMode === 'annotate') && (
              <div
                style={{
                  position: 'absolute',
                  left: `${activeBox.x_min * 100}%`,
                  top: `${activeBox.y_min * 100}%`,
                  width: `${(activeBox.x_max - activeBox.x_min) * 100}%`,
                  height: `${(activeBox.y_max - activeBox.y_min) * 100}%`,
                  boxSizing: 'border-box'
                }}
                className={`pointer-events-none ${
                  isClinicianSource 
                    ? 'border-2 border-emerald-500 bg-emerald-500/10' 
                    : 'border-2 border-red-600 bg-transparent'
                }`}
              >
                {/* Small red FRACTURE REGION label matching PDF annotation style */}
                <div
                  className={`absolute -top-5 left-0 text-[9px] font-bold uppercase px-1.5 py-0.5 whitespace-nowrap tracking-wide flex items-center gap-1 ${
                    isClinicianSource
                      ? 'bg-emerald-600 text-white rounded-t'
                      : 'bg-red-600 text-white rounded-t'
                  }`}
                >
                  <span>{activeLabel}</span>
                  {localization?.reference_case_id && !isClinicianSource && (
                    <span className="text-[8px] font-mono px-1 py-0.2 bg-red-800 rounded text-red-100">
                      {localization.reference_case_id}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* ---------------- 3. PDF REFERENCE-GUIDED FRACTURE HEATMAP OVERLAY ---------------- */}
            {/* Soft red/yellow smooth gradient inside the verified reference fracture region */}
            {viewMode === 'ref_heatmap' && hasReferenceBox && activeBox && (
              <div
                style={{
                  position: 'absolute',
                  left: `${activeBox.x_min * 100}%`,
                  top: `${activeBox.y_min * 100}%`,
                  width: `${(activeBox.x_max - activeBox.x_min) * 100}%`,
                  height: `${(activeBox.y_max - activeBox.y_min) * 100}%`,
                  boxSizing: 'border-box'
                }}
                className="pointer-events-none border-2 border-red-500/90 rounded-xs overflow-visible"
              >
                {/* Smooth radial gradient overlay: warm red core, yellow transition, fading seamlessly to transparent */}
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.72) 0%, rgba(249, 115, 22, 0.52) 40%, rgba(234, 179, 8, 0.28) 70%, transparent 100%)',
                    boxShadow: 'inset 0 0 12px rgba(239, 68, 68, 0.35)'
                  }}
                  className="w-full h-full"
                />

                {/* Small red/amber label tag */}
                <div className="absolute -top-5 left-0 text-[9px] font-bold uppercase px-1.5 py-0.5 whitespace-nowrap tracking-wide flex items-center gap-1 bg-gradient-to-r from-red-600 to-amber-600 text-white rounded-t shadow-xs">
                  <span>PDF REFERENCE-GUIDED FRACTURE REGION – NOT AI DETECTION</span>
                  {localization?.reference_case_id && (
                    <span className="text-[8px] font-mono px-1 py-0.2 bg-red-900 rounded text-red-100">
                      {localization.reference_case_id}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Saved Clinician Annotations (when viewing annotate mode) */}
            {viewMode === 'annotate' && annotations.map((ann, idx) => (
              <div
                key={ann.id || idx}
                style={{
                  position: 'absolute',
                  left: `${ann.x_min * 100}%`,
                  top: `${ann.y_min * 100}%`,
                  width: `${(ann.x_max - ann.x_min) * 100}%`,
                  height: `${(ann.y_max - ann.y_min) * 100}%`,
                  boxSizing: 'border-box'
                }}
                className="border-2 border-emerald-400 bg-emerald-500/15 pointer-events-none"
              >
                <div className="absolute -top-5 left-0 text-[9px] font-bold bg-emerald-700 text-white px-1.5 py-0.2 rounded-t flex items-center gap-1">
                  <span>{ann.label}</span>
                  <span className="opacity-75">({ann.clinician_name})</span>
                </div>
              </div>
            ))}

          </div>
        )}

        {/* ---------------- STAGE NOTICES & EXPLANATIONS ---------------- */}

        {/* Overlay Notice for NORMAL Radiographs */}
        {(viewMode === 'reference' || viewMode === 'ref_heatmap') && aiPrediction === 'NORMAL' && (
          <div className="absolute bottom-4 left-4 right-4 bg-emerald-950/85 backdrop-blur-xs border border-emerald-500/30 p-3 rounded-xl text-emerald-100 flex items-center gap-2.5 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold">Normal reference image:</span> No fracture box or heatmap displayed. Intact wrist anatomy.
            </div>
          </div>
        )}

        {/* Overlay Notice for Unmatched Uploads */}
        {(viewMode === 'reference' || viewMode === 'ref_heatmap') && !hasReferenceBox && aiPrediction !== 'NORMAL' && (
          <div className="absolute bottom-4 left-4 right-4 bg-amber-950/85 backdrop-blur-xs border border-amber-500/30 p-3 rounded-xl text-amber-100 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-amber-300">Fracture localization unavailable:</span>
                <span className="ml-1 text-amber-200/90">
                  Image does not match the 4 verified reference pairs. Bounding boxes are never copied from other cases.
                </span>
              </div>
            </div>
            <button
              onClick={() => setViewMode('annotate')}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-bold shrink-0 transition cursor-pointer"
            >
              Draw Clinician Box
            </button>
          </div>
        )}

        {/* Notice for PDF Reference-Guided Fracture Region */}
        {viewMode === 'ref_heatmap' && hasReferenceBox && (
          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-xs border border-amber-500/40 p-3 rounded-xl text-slate-100 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <Flame className="w-4 h-4 text-amber-400 shrink-0" />
              <span>PDF Reference-Guided Fracture Region – Not AI Detection</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Soft heatmap visualization mapped directly within verified reference fracture coordinates from <span className="font-semibold text-white">wrist_xray_dataset.pdf</span>. Bounded within the reference fracture box. This is an anatomical reference visualization, not automated AI model attention.
            </p>
          </div>
        )}


      </div>

      {/* ---------------- SECTION: ZOOMED FRACTURE PREVIEW PANEL ---------------- */}
      {hasReferenceBox && activeBox && (viewMode === 'reference' || viewMode === 'ref_heatmap' || viewMode === 'zoomed') && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <ZoomIn className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Zoomed Fracture Region
                  </h4>
                  {localization?.reference_case_id && (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-extrabold border border-rose-200">
                      {localization.reference_case_id}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  {isClinicianSource ? 'Clinician Verified Region of Interest' : 'Exact PDF Reference Bounding Box Crop'}
                </p>
              </div>
            </div>

            {/* Inset Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHighContrastZoom(!highContrastZoom)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 transition cursor-pointer ${
                  highContrastZoom
                    ? 'bg-slate-900 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>{highContrastZoom ? 'High-Contrast On' : 'Standard Contrast'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Cropped Magnifier Window (Canvas-based pixel-perfect extraction!) */}
            <div className="md:col-span-7 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner h-60 flex items-center justify-center relative p-1">
              <canvas
                ref={zoomCanvasRef}
                className="max-h-full max-w-full rounded shadow"
              />
              <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-[10px] text-white px-2 py-0.5 rounded font-mono border border-slate-700">
                HIGH-RESOLUTION INSET
              </div>
            </div>

            {/* Coordinate Metrics & Details */}
            <div className="md:col-span-5 space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <span>Normalized Coordinates</span>
                  <span className="font-mono text-[10px] text-blue-600">[0.00 – 1.00]</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">X MIN</span>
                    <span className="font-bold text-slate-800">{activeBox.x_min.toFixed(5)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">X MAX</span>
                    <span className="font-bold text-slate-800">{activeBox.x_max.toFixed(5)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Y MIN</span>
                    <span className="font-bold text-slate-800">{activeBox.y_min.toFixed(5)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Y MAX</span>
                    <span className="font-bold text-slate-800">{activeBox.y_max.toFixed(5)}</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-rose-50/60 rounded-xl border border-rose-100 text-[11px] text-rose-900 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {isClinicianSource ? (
                    <span><strong>Manual Review:</strong> Marked directly by clinician reviewer. Saved separately from automated classifier predictions.</span>
                  ) : (
                    <span><strong>PDF REFERENCE ANNOTATION – NOT AI DETECTION ({localization?.reference_case_id}):</strong> Mapped directly from clean-annotated counterpart in <code className="font-mono text-[10px]">wrist_xray_dataset.pdf</code>. Not predicted by AI model.</span>
                  )}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ---------------- SECTION: CLINICIAN ANNOTATION CONTROLS (WHEN IN ANNOTATE MODE) ---------------- */}
      {viewMode === 'annotate' && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-emerald-700" />
              <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                Clinician Annotation Tool
              </h4>
            </div>
            {saveSuccess && (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Annotation Saved to Database
              </span>
            )}
          </div>

          <p className="text-xs text-emerald-800 leading-relaxed">
            Click and drag anywhere on the radiograph above to delineate the suspected fracture line or cortical disruption. Manual annotations are stored separately from AI classifier outputs.
          </p>

          {currentDraftBox && (
            <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">New Draft Annotation Selected:</span>
                <span className="font-mono text-emerald-700 font-semibold text-[11px]">
                  ({currentDraftBox.x_min.toFixed(3)}, {currentDraftBox.y_min.toFixed(3)}) to ({currentDraftBox.x_max.toFixed(3)}, {currentDraftBox.y_max.toFixed(3)})
                </span>
              </div>

              <input
                type="text"
                placeholder="Optional clinical findings or anatomical notes (e.g., 'Metaphyseal cortical step-off')..."
                value={annotationNotes}
                onChange={(e) => setAnnotationNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveClinicianAnnotation}
                  disabled={savingAnnotation}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingAnnotation ? 'Saving...' : 'Save Clinician Annotation'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentDraftBox(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  Discard Draft
                </button>
              </div>
            </div>
          )}

          {/* List of Existing Clinician Annotations */}
          {annotations.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-950 uppercase">
                Saved Clinician Annotations ({annotations.length})
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {annotations.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-2.5 bg-white rounded-xl border border-emerald-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{ann.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          [{ann.x_min.toFixed(3)}, {ann.y_min.toFixed(3)} - {ann.x_max.toFixed(3)}, {ann.y_max.toFixed(3)}]
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        By <span className="font-semibold text-slate-700">{ann.clinician_name}</span> • {ann.notes || 'No notes added'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAnnotation(ann.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete Annotation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
