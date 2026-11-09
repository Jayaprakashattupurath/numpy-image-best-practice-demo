import json
import sys
import numpy as np


def validate_and_reshape(payload):
    width = int(payload["width"])
    height = int(payload["height"])
    data = np.asarray(payload["data"], dtype=np.uint8)
    if data.size != width * height * 3:
        raise ValueError("Invalid image data length")
    return data.reshape((height, width, 3))


def box_blur_rgb(img_float):
    # img_float: H x W x 3 in [0,1], float32
    # Best practice: vectorized operations, explicit dtype, no Python pixel loops.
    padded = np.pad(img_float, ((1, 1), (1, 1), (0, 0)), mode="edge")
    out = (
        padded[:-2, :-2] + padded[:-2, 1:-1] + padded[:-2, 2:] +
        padded[1:-1, :-2] + padded[1:-1, 1:-1] + padded[1:-1, 2:] +
        padded[2:, :-2] + padded[2:, 1:-1] + padded[2:, 2:]
    ) / 9.0
    return out.astype(np.float32)


def process_image(img_u8):
    # 1) Convert to float32 [0,1] for stable math
    img = img_u8.astype(np.float32) / 255.0

    # 2) Denoise (light blur)
    denoised = box_blur_rgb(img)

    # 3) Auto-brightness (simple percentile stretch)
    low = np.percentile(denoised, 5)
    high = np.percentile(denoised, 95)
    stretched = np.clip((denoised - low) / max(high - low, 1e-6), 0.0, 1.0)

    # 4) Edge hint on luminance for "inspection" scenario
    lum = 0.2126 * stretched[:, :, 0] + 0.7152 * stretched[:, :, 1] + 0.0722 * stretched[:, :, 2]
    gx = np.abs(np.diff(lum, axis=1, prepend=lum[:, :1]))
    gy = np.abs(np.diff(lum, axis=0, prepend=lum[:1, :]))
    edge = np.clip((gx + gy) * 2.0, 0.0, 1.0)

    # 5) Blend edges subtly back into image
    enhanced = np.clip(stretched + edge[:, :, None] * 0.25, 0.0, 1.0)

    # 6) Convert back to uint8 for display/transmission
    out_u8 = (enhanced * 255.0 + 0.5).astype(np.uint8)

    return out_u8, {
        "mean_before": float(np.mean(img)),
        "mean_after": float(np.mean(enhanced)),
        "edge_strength": float(np.mean(edge))
    }


def main():
    raw = sys.stdin.read()
    payload = json.loads(raw)
    img = validate_and_reshape(payload)
    out_u8, metrics = process_image(img)

    response = {
        "width": out_u8.shape[1],
        "height": out_u8.shape[0],
        "data": out_u8.reshape(-1).tolist(),
        "metrics": metrics
    }
    sys.stdout.write(json.dumps(response))


if __name__ == "__main__":
    main()