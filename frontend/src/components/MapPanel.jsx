import { useEffect, useRef, useState } from 'react'

export default function MapPanel({ onConfirm, onCancel, emoji, moduleName }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  
  // Default coordinates centered on Algiers or a generic region (approx 36.7538, 3.0588)
  const [coords, setCoords] = useState({ lat: 36.7538, lng: 3.0588 })

  useEffect(() => {
    if (!window.L) {
      console.error('Leaflet is not loaded from index.html')
      return
    }

    const L = window.L

    // Initialize map
    const map = L.map(mapContainerRef.current).setView([coords.lat, coords.lng], 13)
    mapRef.current = map

    // Dark-themed tiles to match the premium dark purple layout
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map)

    // Leaflet marker styling using standard colors or a custom emoji divicon
    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `<div style="font-size: 26px; transform: translate(-10px, -20px); filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">${emoji}</div>`,
      iconSize: [30, 30]
    })

    // Create marker
    const marker = L.marker([coords.lat, coords.lng], {
      draggable: true,
      icon: customIcon
    }).addTo(map)
    markerRef.current = marker

    // Handle marker drag
    marker.on('dragend', () => {
      const position = marker.getLatLng()
      setCoords({ lat: position.lat, lng: position.lng })
    })

    // Click map to place marker
    map.on('click', (e) => {
      marker.setLatLng(e.latlng)
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng })
    })

    // Fix map loading in hidden container issue
    setTimeout(() => {
      map.invalidateSize()
    }, 200)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [emoji])

  return (
    <div className="map-modal-overlay">
      <div className="map-modal-card">
        <div className="map-modal-header">
          <div className="map-modal-title">
            <span>📍</span> Geolocate Incident
          </div>
          <div className="map-modal-subtitle">
            Tag the position of the detected {moduleName.toLowerCase()} event.
          </div>
        </div>

        <div className="map-container-wrapper">
          <div ref={mapContainerRef} className="leaflet-map-element" />
        </div>

        <div className="map-coords-display">
          <div>Lat: <span>{coords.lat.toFixed(5)}</span></div>
          <div>Lng: <span>{coords.lng.toFixed(5)}</span></div>
        </div>

        <div className="map-modal-footer">
          <button className="btn" onClick={onCancel}>
            Skip Location
          </button>
          <button className="btn primary" onClick={() => onConfirm(coords.lat, coords.lng)}>
            Confirm & Save Event
          </button>
        </div>
      </div>
    </div>
  )
}
