import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil, Eraser, Square, Circle, Type, Move, Undo, Redo, Download, Upload, Users, Palette, RotateCcw } from 'lucide-react';

const CollaborativeWhiteboard = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [users, setUsers] = useState([
    { id: 1, name: 'You', color: '#ff6b6b', active: true },
    { id: 2, name: 'Alice', color: '#4ecdc4', active: true },
    { id: 3, name: 'Bob', color: '#45b7d1', active: false }
  ]);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 1200;
    canvas.height = 800;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Save initial state
    saveToHistory();
    redrawCanvas();
  }, []);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(canvas.toDataURL());
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 0.5;
      const gridSize = 20 * zoom;
      
      for (let x = (pan.x % gridSize); x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = (pan.y % gridSize); y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }
  }, [showGrid, zoom, pan]);

  const getMousePos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom
    };
  }, [pan, zoom]);

  const startDrawing = useCallback((e) => {
    if (tool === 'pan') {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    const pos = getMousePos(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    setIsDrawing(true);
    
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, [tool, color, brushSize, getMousePos]);

  const draw = useCallback((e) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!isDrawing) return;

    const pos = getMousePos(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isDrawing, isPanning, lastPanPoint, getMousePos]);

  const stopDrawing = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  }, [isDrawing, isPanning, saveToHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        redrawCanvas();
      };
      img.src = history[historyIndex - 1];
    }
  }, [historyIndex, history, redrawCanvas]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        redrawCanvas();
      };
      img.src = history[historyIndex + 1];
    }
  }, [historyIndex, history, redrawCanvas]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    redrawCanvas();
    saveToHistory();
  }, [redrawCanvas, saveToHistory]);

  const downloadCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = canvas.toDataURL();
    link.click();
  }, []);

  const handleZoom = useCallback((delta) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 0.1), 3));
  }, []);

  const colors = ['#000000', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8'];

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Collaborative Whiteboard</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-600" />
              <div className="flex -space-x-2">
                {users.map(user => (
                  <div
                    key={user.id}
                    className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-semibold ${user.active ? 'opacity-100' : 'opacity-50'}`}
                    style={{ backgroundColor: user.color }}
                    title={user.name}
                  >
                    {user.name.charAt(0)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Toolbar */}
        <div className="bg-white shadow-sm border-r p-4 w-64">
          <div className="space-y-6">
            {/* Tools */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Tools</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'pen', icon: Pencil, label: 'Pen' },
                  { id: 'eraser', icon: Eraser, label: 'Eraser' },
                  { id: 'rectangle', icon: Square, label: 'Rectangle' },
                  { id: 'circle', icon: Circle, label: 'Circle' },
                  { id: 'text', icon: Type, label: 'Text' },
                  { id: 'pan', icon: Move, label: 'Pan' }
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setTool(id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      tool === id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-xs">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Colors</h3>
              <div className="grid grid-cols-4 gap-2">
                {colors.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      color === c ? 'border-gray-400' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="mt-2 w-full h-8 rounded border border-gray-300"
              />
            </div>

            {/* Brush Size */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Brush Size</h3>
              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600 mt-1">{brushSize}px</div>
            </div>

            {/* Actions */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Actions</h3>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <button
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    className="flex-1 p-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Undo className="w-4 h-4 mx-auto" />
                  </button>
                  <button
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    className="flex-1 p-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Redo className="w-4 h-4 mx-auto" />
                  </button>
                </div>
                <button
                  onClick={clearCanvas}
                  className="w-full p-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  <RotateCcw className="w-4 h-4 mx-auto mb-1" />
                  Clear
                </button>
                <button
                  onClick={downloadCanvas}
                  className="w-full p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  <Download className="w-4 h-4 mx-auto mb-1" />
                  Export
                </button>
              </div>
            </div>

            {/* View Options */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">View</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="mr-2"
                  />
                  Show Grid
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleZoom(-0.1)}
                    className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    -
                  </button>
                  <span className="text-sm">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => handleZoom(0.1)}
                    className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute cursor-crosshair"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0'
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
          
          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleZoom(-0.1)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                -
              </button>
              <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => handleZoom(0.1)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborativeWhiteboard;