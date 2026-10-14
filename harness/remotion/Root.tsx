import React from "react";
import { CalculateMetadataFunction, Composition } from "remotion";
import { Episode } from "./Episode";
import { PaperBase } from "./PaperBase";
import { EpisodeProps } from "./types";

const defaults: EpisodeProps = {
  fps: 30,
  width: 1920,
  height: 1080,
  durationInFrames: 90,
  audio: null,
  font: { family: "Lora" },
  fonts: [],
  brand: { font: "Lora", hand: "Dancing Script", mono: "Xanh Mono", gold: "#c9a24a", paper: "#f4e6c8", red: "#b3261e" },
  scenes: [],
};

const calculateMetadata: CalculateMetadataFunction<EpisodeProps> = ({ props }) => ({
  fps: props.fps,
  width: props.width,
  height: props.height,
  durationInFrames: Math.max(1, props.durationInFrames),
});

export const Root: React.FC = () => (
  <>
    <Composition id="PaperBase" component={PaperBase} fps={30} width={2400} height={1350} durationInFrames={1} />
    <Composition
    id="Episode"
    component={Episode}
    defaultProps={defaults}
    calculateMetadata={calculateMetadata}
    fps={30}
    width={1920}
    height={1080}
    durationInFrames={90}
  />
  </>
);
