import React from 'react';

/**
 * LiquidGlassFilter — Real SVG Optical Refraction & Chromatic Aberration Filter
 * Inspired by liquid-glass.js & Apple optical glass shaders.
 * Displaces background graphics dynamically and creates spectral fringe at edges.
 */
export default function LiquidGlassFilter() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: -9999
      }}
    >
      <defs>
        {/* Optical Glass Refraction with Chromatic Dispersion */}
        <filter
          id="liquid-glass-distortion"
          x="-15%"
          y="-15%"
          width="130%"
          height="130%"
          colorInterpolationFilters="sRGB"
        >
          {/* Subtle harmonic liquid noise wave */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.015 0.015"
            numOctaves="2"
            result="noise"
            seed="23"
          />

          {/* Smooth height-map blur */}
          <feGaussianBlur in="noise" stdDeviation="2" result="smoothNoise" />

          {/* Displace the graphic with optical IOR simulation */}
          <feDisplacementMap
            in="SourceGraphic"
            in2="smoothNoise"
            scale="14"
            xChannelSelector="R"
            yChannelSelector="G"
            result="refracted"
          />

          {/* Chromatic Aberration: Spectral RGB channel split */}
          <feOffset in="refracted" dx="1.8" dy="0" result="redFringe" />
          <feOffset in="refracted" dx="-1.8" dy="0" result="cyanFringe" />

          {/* Re-blend channels with glass caustics */}
          <feBlend in="redFringe" in2="cyanFringe" mode="screen" result="chromaticGlass" />
          <feComposite in="chromaticGlass" in2="SourceGraphic" operator="over" />
        </filter>

        {/* High-Refraction Rim Flare for Buttons and Pills */}
        <filter
          id="liquid-glass-flare"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="turbulence"
            baseFrequency="0.02 0.02"
            numOctaves="3"
            result="turbulence"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="turbulence"
            scale="8"
            xChannelSelector="R"
            yChannelSelector="B"
            result="flareRefract"
          />
        </filter>
      </defs>
    </svg>
  );
}
