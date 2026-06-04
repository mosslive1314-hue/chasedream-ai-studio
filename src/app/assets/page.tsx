import { Suspense } from "react";
import AssetsScreen from "@/components/screens/AssetsScreen";

export default function AssetsPage() {
  return (
    <Suspense
      fallback={
        <div style={{
          height: "100svh", display: "flex", alignItems: "center", justifyContent: "center",
          background: "#F5F6FA", color: "#8892B0", fontSize: 14, fontFamily: "system-ui",
        }}>
          加载资产…
        </div>
      }
    >
      <AssetsScreen />
    </Suspense>
  );
}
