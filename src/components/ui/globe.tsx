'use client';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from 'react';
import type {GlobeMethods} from 'react-globe.gl';

// react-globe.gl is not updated to support React 18 strict mode.
const Globe: FC<any> = (props) => {
  const [Globe, setGlobe] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const mod = await import('react-globe.gl');
      setGlobe(() => mod.default);
    })();
  }, []);
  return Globe && <Globe {...props} />;
};

const ARC_REL_LEN = 0.4; // relative to whole arc
const FLIGHT_TIME = 1000;
const NUM_RINGS = 3;
const RINGS_MAX_R = 5; // deg
const RING_PROPAGATION_SPEED = 5; // deg/sec

type GlobeProps = {
  height: string | number;
  width: string | number;
};
export function GlobeComponent({height, width}: GlobeProps) {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const [arcsData, setArcsData] = useState<any[]>([]);
  const [ringsData, setRingsData] = useState<any[]>([]);

  const N = 30;
  const gData = useMemo(() => {
    return [...Array(N).keys()].map(() => ({
      lat: (Math.random() - 0.5) * 180,
      lng: (Math.random() - 0.5) * 360,
      size: Math.random() / 3,
      color: ['#3F51B5', '#9575CD', '#E8EAF6', '#FFFFFF'][
        Math.round(Math.random() * 3)
      ],
    }));
  }, []);

  const emitArc = useCallback(() => {
    // requestAnimationFrame usage is a workaround for a react-globe.gl bug
    requestAnimationFrame(() => {
      const gDataLen = gData.length;
      if (gDataLen < 2) return;
      // from
      const srcIdx = Math.floor(Math.random() * gDataLen);
      const src = gData[srcIdx];
      // to
      const dstIdx = Math.floor(Math.random() * gDataLen);
      const dst = gData[dstIdx];
      // add and remove arc after 1 cycle
      const arc = {src, dst};
      setArcsData((old) => [...old, arc]);
      setTimeout(
        () =>
          setArcsData((old) =>
            old.filter((a) => a !== arc)
          ),
        FLIGHT_TIME * 2
      );
      // add and remove rings
      const srcRing = {
        lat: src.lat,
        lng: src.lng,
      };
      const dstRing = {
        lat: dst.lat,
        lng: dst.lng,
      };
      setRingsData((old) => [...old, srcRing, dstRing]);
      setTimeout(
        () =>
          setRingsData((old) =>
            old.filter((r) => r !== srcRing && r !== dstRing)
          ),
        FLIGHT_TIME * ARC_REL_LEN
      );
    });
  }, [gData]);

  useEffect(() => {
    if (!globeEl.current) return;
    const globe = globeEl.current;
    // Auto-rotate
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.3;
    globe.controls().enableZoom = false;

    // emit arcs periodically
    const interval = setInterval(emitArc, 2000);
    return () => clearInterval(interval);
  }, [emitArc]);

  return (
    <Globe
      ref={globeEl}
      height={height}
      width={width}
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
      backgroundColor="#00000000"
      // Arcs
      arcsData={arcsData}
      arcColor={() => 'accent'}
      arcDashLength={ARC_REL_LEN}
      arcDashGap={2}
      arcDashInitialGap={(e: any) => e.order * 1}
      arcDashAnimateTime={FLIGHT_TIME}
      arcsTransitionDuration={0}
      // Rings
      ringsData={ringsData}
      ringColor={() => 'accent'}
      ringMaxRadius={RINGS_MAX_R}
      ringPropagationSpeed={RING_PROPAGATION_SPEED}
      ringRepeatPeriod={(FLIGHT_TIME * ARC_REL_LEN) / NUM_RINGS}
      // globe points
      pointsData={gData}
      pointAltitude="size"
      pointColor="color"
    />
  );
}
