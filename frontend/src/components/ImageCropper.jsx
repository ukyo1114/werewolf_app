import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

import {
  Box,
  Stack,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from "@chakra-ui/react";

import { CustomButton } from "./CustomComponents";

const ImageCropper = ({ imgSrc, setPic, onClose }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const cropImage = useCallback(async () => {
    try {
      const croppedImage = await getCroppedImg(imgSrc, croppedAreaPixels);
      setPic(croppedImage);
      onClose();
    } catch (e) {
      console.error(e);
    }
  }, [imgSrc, croppedAreaPixels, setPic, onClose]);

  const onMediaLoaded = () => {
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  return (
    <Stack w="100%" gap={4} overflow="auto">
      {imgSrc && (
        <Box position="relative" width="100%" height="400px">
          <Cropper
            image={imgSrc}
            crop={crop}
            zoom={zoom}
            maxZoom={5}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, croppedAreaPixels) =>
              setCroppedAreaPixels(croppedAreaPixels)
            }
            onMediaLoaded={onMediaLoaded}
          />
        </Box>
      )}

      <Slider
        aria-label="zoom-slider"
        value={zoom}
        min={1}
        max={5}
        step={0.1}
        onChange={(value) => setZoom(value)}
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>

      <CustomButton onClick={cropImage}>OK</CustomButton>
    </Stack>
  );
};

const createImage = (url) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
};

const getCroppedImg = async (imgSrc, croppedAreaPixels) => {
  try {
    const image = await createImage(imgSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 150;
    canvas.height = 150;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      150,
      150
    );

    const data = canvas.toDataURL("image/jpeg");
    return data;
  } catch (error) {
    console.error("Failed to crop the image:", error);
    throw error;
  }
};

export default ImageCropper;
