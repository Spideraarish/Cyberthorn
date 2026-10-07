import React from 'react';
import { ShaderGradientCanvas, ShaderGradient } from 'shadergradient';

export default function ShaderGradientBackground({
  opacity = 0.45,
  color1 = '#060a12',
  color2 = '#1e293b',
  color3 = '#0f2b3e',
  uSpeed = 0.18,
  uStrength = 2.2,
  uDensity = 1.2,
  type = 'waterPlane',
  className = ''
}) {
  return (
    <div 
      className={`shader-gradient-backdrop ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: opacity,
        overflow: 'hidden',
        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 38%, black 45%, transparent 95%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 38%, black 45%, transparent 95%)',
      }}
    >
      <ShaderGradientCanvas
        style={{ width: '100%', height: '100%' }}
        pixelDensity={1}
        fov={45}
      >
        <ShaderGradient
          type={type}
          animate="on"
          uSpeed={uSpeed}
          uStrength={uStrength}
          uDensity={uDensity}
          uFrequency={5.2}
          uAmplitude={0}
          color1={color1}
          color2={color2}
          color3={color3}
          cAzimuthAngle={180}
          cPolarAngle={85}
          cDistance={3.6}
          cameraZoom={1}
          lightType="3d"
          brightness={1.15}
          envPreset="city"
          grain="on"
        />
      </ShaderGradientCanvas>
    </div>
  );
}
