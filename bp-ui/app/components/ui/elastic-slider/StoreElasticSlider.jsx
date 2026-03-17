import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import './StoreElasticSlider.css';

const MAX_OVERFLOW = 50;

// Simple SVG icon components (no Chakra dependency)
const VolumeDown = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
  </svg>
);

const VolumeUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
  </svg>
);

const SkipBack = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
  </svg>
);

const SkipForward = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
  </svg>
);

export default function StoreElasticSlider({
  defaultValue = 50,
  startingValue = 0,
  maxValue = 100,
  className = '',
  isStepped = false,
  stepSize = 1,
  leftIcon = <VolumeDown />,
  rightIcon = <VolumeUp />,
  onChange,
  showValue = false,
  trackColor = 'var(--color-fear)',
  trackBg = 'rgba(37,48,120,0.5)',
}) {
  return (
    <div className={`store-slider-container ${className}`}>
      <Slider
        defaultValue={defaultValue}
        startingValue={startingValue}
        maxValue={maxValue}
        isStepped={isStepped}
        stepSize={stepSize}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        onChange={onChange}
        showValue={showValue}
        trackColor={trackColor}
        trackBg={trackBg}
      />
    </div>
  );
}

function Slider({ defaultValue, startingValue, maxValue, isStepped, stepSize, leftIcon, rightIcon, onChange, showValue, trackColor, trackBg }) {
  const [value, setValue] = useState(defaultValue);
  const sliderRef = useRef(null);
  const [region, setRegion] = useState('middle');
  const clientX = useMotionValue(0);
  const overflow = useMotionValue(0);
  const scale = useMotionValue(1);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useMotionValueEvent(clientX, 'change', latest => {
    if (sliderRef.current) {
      const { left, right } = sliderRef.current.getBoundingClientRect();
      let newValue;
      if (latest < left) { setRegion('left'); newValue = left - latest; }
      else if (latest > right) { setRegion('right'); newValue = latest - right; }
      else { setRegion('middle'); newValue = 0; }
      overflow.jump(decay(newValue, MAX_OVERFLOW));
    }
  });

  const handlePointerMove = e => {
    if (e.buttons > 0 && sliderRef.current) {
      const { left, width } = sliderRef.current.getBoundingClientRect();
      let newValue = startingValue + ((e.clientX - left) / width) * (maxValue - startingValue);
      if (isStepped) newValue = Math.round(newValue / stepSize) * stepSize;
      newValue = Math.min(Math.max(newValue, startingValue), maxValue);
      setValue(newValue);
      onChange?.(Math.round(newValue));
      clientX.jump(e.clientX);
    }
  };

  const handlePointerDown = e => {
    handlePointerMove(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = () => {
    animate(overflow, 0, { type: 'spring', bounce: 0.5 });
  };

  const getRangePercentage = () => {
    const totalRange = maxValue - startingValue;
    return totalRange === 0 ? 0 : ((value - startingValue) / totalRange) * 100;
  };

  return (
    <>
      <motion.div
        onHoverStart={() => animate(scale, 1.2)}
        onHoverEnd={() => animate(scale, 1)}
        onTouchStart={() => animate(scale, 1.2)}
        onTouchEnd={() => animate(scale, 1)}
        style={{ scale, opacity: useTransform(scale, [1, 1.2], [0.7, 1]) }}
        className="store-slider-wrapper"
      >
        <motion.div
          animate={{ scale: region === 'left' ? [1, 1.4, 1] : 1, transition: { duration: 0.25 } }}
          style={{ x: useTransform(() => (region === 'left' ? -overflow.get() / scale.get() : 0)) }}
        >
          {leftIcon}
        </motion.div>

        <div ref={sliderRef} className="store-slider-root"
          onPointerMove={handlePointerMove} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}
        >
          <motion.div
            style={{
              scaleX: useTransform(() => {
                if (sliderRef.current) { const { width } = sliderRef.current.getBoundingClientRect(); return 1 + overflow.get() / width; }
              }),
              scaleY: useTransform(overflow, [0, MAX_OVERFLOW], [1, 0.8]),
              transformOrigin: useTransform(() => {
                if (sliderRef.current) { const { left, width } = sliderRef.current.getBoundingClientRect(); return clientX.get() < left + width / 2 ? 'right' : 'left'; }
              }),
              height: useTransform(scale, [1, 1.2], [6, 12]),
              marginTop: useTransform(scale, [1, 1.2], [0, -3]),
              marginBottom: useTransform(scale, [1, 1.2], [0, -3]),
            }}
            className="store-slider-track-wrapper"
          >
            <div className="store-slider-track" style={{ backgroundColor: trackBg }}>
              <div className="store-slider-range" style={{ width: `${getRangePercentage()}%`, backgroundColor: trackColor }} />
            </div>
          </motion.div>
        </div>

        <motion.div
          animate={{ scale: region === 'right' ? [1, 1.4, 1] : 1, transition: { duration: 0.25 } }}
          style={{ x: useTransform(() => (region === 'right' ? overflow.get() / scale.get() : 0)) }}
        >
          {rightIcon}
        </motion.div>
      </motion.div>
      {showValue && <p className="store-slider-value">{Math.round(value)}</p>}
    </>
  );
}

function decay(value, max) {
  if(max === 0)
    return 0;
  const entry = value / max;
  return 2 * (1 / (1 + Math.exp(-entry)) - 0.5) * max;
}

// Export icon components for reuse
export { VolumeDown, VolumeUp, SkipBack, SkipForward };
