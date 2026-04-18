const VideoInsideShape = () => {
  // Define the original viewBox dimensions for normalization
  const viewBoxWidth = 1882;
  const viewBoxHeight = 925;

  // Function to normalize a coordinate (val / max)
  const normalize = (val, max) => val / max;

  // Original path data, but with coordinates normalized to the 0-1 range.
  // This path is used because it includes the complex cutout at the bottom center
  // visible in the screenshot, which is the key feature of the shape.
  const normalizedPathD = `
    M${normalize(60, viewBoxWidth)} ${normalize(32.5, viewBoxHeight)}
    H${normalize(1822, viewBoxWidth)}
    C${normalize(1837.19, viewBoxWidth)} ${normalize(32.5, viewBoxHeight)}
    ${normalize(1849.5, viewBoxWidth)} ${normalize(44.8122, viewBoxHeight)}
    ${normalize(1849.5, viewBoxWidth)} ${normalize(60, viewBoxHeight)}
    V${normalize(865, viewBoxHeight)}
    C${normalize(1849.5, viewBoxWidth)} ${normalize(880.188, viewBoxHeight)}
    ${normalize(1837.19, viewBoxWidth)} ${normalize(892.5, viewBoxHeight)}
    ${normalize(1822, viewBoxWidth)} ${normalize(892.5, viewBoxHeight)}
    H${normalize(1082.02, viewBoxWidth)}
    C${normalize(1074.83, viewBoxWidth)} ${normalize(892.5, viewBoxHeight)}
    ${normalize(1068.34, viewBoxWidth)} ${normalize(888.177, viewBoxHeight)}
    ${normalize(1065.56, viewBoxWidth)} ${normalize(881.539, viewBoxHeight)}
    L${normalize(1065.56, viewBoxWidth)} ${normalize(881.538, viewBoxHeight)}
    L${normalize(1064.96, viewBoxWidth)} ${normalize(880.101, viewBoxHeight)}
    C${normalize(1043.57, viewBoxWidth)} ${normalize(828.915, viewBoxHeight)}
    ${normalize(993.522, viewBoxWidth)} ${normalize(795.591, viewBoxHeight)}
    ${normalize(938.047, viewBoxWidth)} ${normalize(795.591, viewBoxHeight)}
    H${normalize(927.379, viewBoxWidth)}
    C${normalize(869.951, viewBoxWidth)} ${normalize(795.591, viewBoxHeight)}
    ${normalize(818.684, viewBoxWidth)} ${normalize(831.584, viewBoxHeight)}
    ${normalize(799.177, viewBoxWidth)} ${normalize(885.597, viewBoxHeight)}
    C${normalize(797.68, viewBoxWidth)} ${normalize(889.74, viewBoxHeight)}
    ${normalize(793.748, viewBoxWidth)} ${normalize(892.5, viewBoxHeight)}
    ${normalize(789.343, viewBoxWidth)} ${normalize(892.5, viewBoxHeight)}
    H${normalize(60, viewBoxWidth)}
    C${normalize(44.8122, viewBoxWidth)} ${normalize(892.5, viewBoxHeight)}
    ${normalize(32.5, viewBoxWidth)} ${normalize(880.188, viewBoxHeight)}
    ${normalize(32.5, viewBoxWidth)} ${normalize(865, viewBoxHeight)}
    V${normalize(60, viewBoxHeight)}
    C${normalize(32.5, viewBoxWidth)} ${normalize(44.8122, viewBoxHeight)}
    ${normalize(44.8122, viewBoxWidth)} ${normalize(32.5, viewBoxHeight)}
    ${normalize(60, viewBoxWidth)} ${normalize(32.5, viewBoxHeight)}Z
  `;

  return (
    <div className=" w-full  overflow-hidden">
      {/* VIDEO THAT WILL BE CLIPPED */}
      <video
        // NOTE: The video src is currently "./output_compressed.mkv".
        // Ensure this path is correct in your environment.
        src="./output_compressed.mkv"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-[86vh] object-cover"
        style={{
          clipPath: "url(#clipShape)",
        }}
      />

      {/* SVG DEFINING THE SHAPE */}
      <svg
        className="absolute inset-0 w-full  pointer-events-none"
        // The viewBox is technically ignored here due to clipPathUnits="objectBoundingBox",
        // but it provides context for the normalized coordinates.
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <clipPath id="clipShape" clipPathUnits="objectBoundingBox">
          <path
            d={normalizedPathD}
            fill="white" // Fill color is irrelevant for clipPath, but okay to keep
          />
        </clipPath>
      </svg>
    </div>
  );
};

export default VideoInsideShape;
