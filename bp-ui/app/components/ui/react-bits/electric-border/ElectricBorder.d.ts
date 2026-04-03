import { ComponentType, ReactNode, CSSProperties } from "react";

interface ElectricBorderProps {
  children: ReactNode;
  color?: string;
  speed?: number;
  chaos?: number;
  thickness?: number;
  borderRadius?: number;
  className?: string;
  style?: CSSProperties;
}

declare const ElectricBorder: ComponentType<ElectricBorderProps>;
export default ElectricBorder;
