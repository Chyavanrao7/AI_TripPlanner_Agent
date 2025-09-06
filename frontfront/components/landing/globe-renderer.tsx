"use client"

import { useEffect, useRef } from "react"

export function GlobeRenderer() {
  const globeContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true
    let globeInstance: any = null

    const loadGlobe = async () => {
      if (!globeContainerRef.current || !mounted) return

      try {
        // Ensure THREE and Globe are available globally
        // These scripts are expected to be loaded via CDN in public/index.html or similar
        // For Next.js, they are often pre-loaded or can be manually injected if not.
        // Given the previous code, they were manually injected.
        // If they are not globally available, this dynamic import approach might need a different strategy
        // or ensuring the CDN scripts are loaded before this component.
        // For now, assuming they become available via the previous script injection or Next.js environment.

        if (!window.THREE || !window.Globe) {
          // Fallback/ensure scripts are loaded if not already
          await new Promise((resolve, reject) => {
            const scriptThree = document.createElement("script")
            scriptThree.src = "https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js"
            scriptThree.async = true
            scriptThree.onload = () => {
              const scriptGlobe = document.createElement("script")
              scriptGlobe.src = "https://cdn.jsdelivr.net/npm/globe.gl@2.28.2/dist/globe.gl.min.js"
              scriptGlobe.async = true
              scriptGlobe.onload = resolve
              scriptGlobe.onerror = reject
              document.head.appendChild(scriptGlobe)
            }
            scriptThree.onerror = reject
            document.head.appendChild(scriptThree)
          })
        }

        if (!mounted || !globeContainerRef.current) return

        // Initialize the globe with space theme - pure globe with no markers
        globeInstance = window
          .Globe()
          .globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
          .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
          .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
          .width(globeContainerRef.current.clientWidth)
          .height(globeContainerRef.current.clientHeight)
          .showGlobe(true)
          .showAtmosphere(true)
          .atmosphereColor("rgba(100, 149, 237, 0.8)")
          .atmosphereAltitude(0.25)
          .pointsData([]) // Ensure no points are rendered
          .arcsData([]) // Ensure no arcs are rendered

        globeInstance(globeContainerRef.current)

        // Enhanced controls for better interaction
        const controls = globeInstance.controls()
        controls.autoRotate = true
        controls.autoRotateSpeed = 0.3
        controls.enableZoom = true
        controls.enablePan = true
        controls.enableDamping = true
        controls.dampingFactor = 0.1
        controls.minDistance = 200
        controls.maxDistance = 800

        // Handle resize
        const handleResize = () => {
          if (globeInstance && globeContainerRef.current) {
            globeInstance.width(globeContainerRef.current.clientWidth).height(globeContainerRef.current.clientHeight)
          }
        }

        window.addEventListener("resize", handleResize)

        return () => {
          window.removeEventListener("resize", handleResize)
          if (globeInstance && globeInstance.scene) {
            globeInstance.scene().clear()
            globeInstance = null // Clear instance
          }
        }
      } catch (error) {
        console.warn("Failed to load Earth background:", error)
      }
    }

    loadGlobe()

    return () => {
      mounted = false
      if (globeInstance && globeInstance.scene) {
        globeInstance.scene().clear()
      }
    }
  }, [])

  return <div ref={globeContainerRef} className="absolute inset-0 w-full h-full" />
}
