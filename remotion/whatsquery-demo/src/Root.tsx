import "./index.css";
import { Composition } from "remotion";
import { WhatsQueryDemo } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="WhatsQuerySaaSDemo"
        component={WhatsQueryDemo}
        durationInFrames={1800}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
