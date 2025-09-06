"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface EarthBackgroundProps {
  className?: string
  opacity?: number
}

export function EarthBackground({ className, opacity = 1 }: EarthBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<any>(null)

  useEffect(() => {
    let mounted = true

    const loadGlobe = async () => {
      if (!containerRef.current || !mounted) return

      try {
        // Load Three.js
        if (!window.THREE) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script")
            script.src = "https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js"
            script.async = true
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
          })
        }

        // Load Globe.gl
        if (!window.Globe) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script")
            script.src = "https://cdn.jsdelivr.net/npm/globe.gl@2.28.2/dist/globe.gl.min.js"
            script.async = true
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
          })
        }

        if (!mounted || !containerRef.current) return

        // Initialize the globe with space theme
        const globe = window
          .Globe()
          .globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
          .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
          .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
          .width(containerRef.current.clientWidth)
          .height(containerRef.current.clientHeight)
          .showGlobe(true)
          .showAtmosphere(true)
          .atmosphereColor("rgba(100, 149, 237, 0.6)")
          .atmosphereAltitude(0.2)

        // Add flight paths for visual interest
        const arcsData = Array.from({ length: 25 }, () => ({
          startLat: (Math.random() - 0.5) * 180,
          startLng: (Math.random() - 0.5) * 360,
          endLat: (Math.random() - 0.5) * 180,
          endLng: (Math.random() - 0.5) * 360,
          color: `rgba(100, 149, 237, ${0.3 + Math.random() * 0.4})`,
        }))

        globe
          .arcsData(arcsData)
          .arcColor("color")
          .arcDashLength(0.4)
          .arcDashGap(0.2)
          .arcDashAnimateTime(2000)
          .arcStroke(1)

        // Add major cities as glowing points
        const pointsData = [
          { lat: 40.7128, lng: -74.006, size: 0.15, color: "rgba(255, 255, 255, 0.8)" }, // New York
          { lat: 51.5074, lng: -0.1278, size: 0.15, color: "rgba(255, 255, 255, 0.8)" }, // London
          { lat: 35.6762, lng: 139.6503, size: 0.15, color: "rgba(255, 255, 255, 0.8)" }, // Tokyo
          { lat: -33.8688, lng: 151.2093, size: 0.15, color: "rgba(255, 255, 255, 0.8)" }, // Sydney
          { lat: 48.8566, lng: 2.3522, size: 0.15, color: "rgba(255, 255, 255, 0.8)" }, // Paris
          { lat: 55.7558, lng: 37.6176, size: 0.15, color: "rgba(255, 255, 255, 0.8)" }, // Moscow
          { lat: 39.9042, lng: 116.4074, size: 0.15, color: "rgba(255, 255, 255, 0.8)" }, // Beijing
          { lat: -22.9068, lng: -43.1729, size: 0.15, color: "rgba(255, 255, 255, 0.8)" }, // Rio
          { lat: 19.4326, lng: -99.1332, size: 0.15, color: "rgba(255, 255, 255, 0.8)" }, // Mexico City
          { lat: 1.3521, lng: 103.8198, size: 0.15, color: "rgba(255, 255, 255, 0.8)" }, // Singapore
        ]

        globe.pointsData(pointsData).pointColor("color").pointAltitude("size").pointRadius(0.03).pointsMerge(true)

        globe(containerRef.current)
        globeRef.current = globe

        // Enhanced controls for better interaction
        globe.controls().autoRotate = true
        globe.controls().autoRotateSpeed = 0.5
        globe.controls().enableZoom = true
        globe.controls().enablePan = true
        globe.controls().enableDamping = true
        globe.controls().dampingFactor = 0.1
        globe.controls().minDistance = 150
        globe.controls().maxDistance = 1000

        // Handle resize
        const handleResize = () => {
          if (globe && containerRef.current) {
            globe.width(containerRef.current.clientWidth).height(containerRef.current.clientHeight)
          }
        }

        window.addEventListener("resize", handleResize)

        return () => {
          window.removeEventListener("resize", handleResize)
          if (globe && globe.scene) {
            globe.scene().clear()
          }
        }
      } catch (error) {
        console.warn("Failed to load Earth background:", error)
      }
    }

    loadGlobe()

    return () => {
      mounted = false
      if (globeRef.current && globeRef.current.scene) {
        globeRef.current.scene().clear()
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 pointer-events-auto", className)}
      style={{
        opacity,
        zIndex: 1,
      }}
    />
  )
}
