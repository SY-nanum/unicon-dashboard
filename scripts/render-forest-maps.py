"""
Pre-render GeoTIFF forest data to PNG map images for web display.
Generates biomass + age + site-index maps for each country with data.
Output: public/maps/{COUNTRY}_{variable}_{year}.png + legend metadata JSON.
"""

import sys, os, json, glob
sys.stdout.reconfigure(encoding='utf-8')

import numpy as np
import rasterio
from rasterio.plot import reshape_as_image

# Ensure output directory exists
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'maps')
os.makedirs(OUT_DIR, exist_ok=True)

# Color maps: value range → RGBA
def colormap_biomass(val, vmin=0, vmax=220):
    """Green gradient: light → dark green for biomass (t/ha)."""
    t = np.clip((val - vmin) / (vmax - vmin), 0, 1)
    r = np.uint8(240 - t * 200)
    g = np.uint8(250 - t * 80)
    b = np.uint8(230 - t * 200)
    return r, g, b

def colormap_age(val, vmin=0, vmax=80):
    """Brown → Green gradient for forest age (years)."""
    t = np.clip((val - vmin) / (vmax - vmin), 0, 1)
    r = np.uint8(180 - t * 140)
    g = np.uint8(120 + t * 110)
    b = np.uint8(60 + t * 20)
    return r, g, b

def colormap_siteindex(val, vmin=8, vmax=26):
    """Blue → Red gradient for site index (m)."""
    t = np.clip((val - vmin) / (vmax - vmin), 0, 1)
    r = np.uint8(50 + t * 200)
    g = np.uint8(100 + t * 50 - t * t * 100)
    b = np.uint8(220 - t * 180)
    return r, g, b

def render_band_to_png(tif_path, band_idx, colormap_fn, out_path, vmin, vmax):
    """Render a single GeoTIFF band to a PNG using the given colormap."""
    with rasterio.open(tif_path) as ds:
        band = ds.read(band_idx).astype(np.float32)
        mask = np.isfinite(band)

        # Create RGBA image
        h, w = band.shape
        img = np.zeros((h, w, 4), dtype=np.uint8)

        # Apply colormap to valid pixels
        valid_vals = band[mask]
        r, g, b = colormap_fn(valid_vals, vmin, vmax)
        img[mask, 0] = r
        img[mask, 1] = g
        img[mask, 2] = b
        img[mask, 3] = 255  # opaque
        # NaN pixels stay transparent (alpha=0)

        # Save as PNG
        try:
            from PIL import Image
        except ImportError:
            import subprocess
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-q', 'Pillow'])
            from PIL import Image

        pil_img = Image.fromarray(img, 'RGBA')
        pil_img.save(out_path)

        bounds = {
            'west': ds.bounds.left,
            'south': ds.bounds.bottom,
            'east': ds.bounds.right,
            'north': ds.bounds.top,
        }
        return bounds, {'min': float(np.nanmin(valid_vals)), 'max': float(np.nanmax(valid_vals)), 'mean': float(np.nanmean(valid_vals))}

def process_country(country_code):
    """Generate all map images for a country."""
    hist_path = os.path.join('data', 'forest', 'GeoTIFF_Historical', f'{country_code}_17Band_Historical.tif')
    out_path_2050 = os.path.join('data', 'forest', 'GeoTIFF_Outputs', f'{country_code}_2050_Dashboard.tif')

    results = {}

    if os.path.exists(hist_path):
        # Biomass 2024 (latest historical, band 8)
        png = os.path.join(OUT_DIR, f'{country_code}_biomass_2024.png')
        bounds, stats = render_band_to_png(hist_path, 8, colormap_biomass, png, 0, 220)
        results['biomass_2024'] = {'file': f'/maps/{country_code}_biomass_2024.png', 'bounds': bounds, 'stats': stats, 'unit': 't/ha', 'label': f'바이오매스 ({country_code}, 2024)'}
        print(f'  ✓ {country_code} biomass 2024: {stats["min"]:.0f}-{stats["max"]:.0f} t/ha')

        # Site Index (band 17)
        png = os.path.join(OUT_DIR, f'{country_code}_siteindex.png')
        bounds, stats = render_band_to_png(hist_path, 17, colormap_siteindex, png, 8, 26)
        results['siteindex'] = {'file': f'/maps/{country_code}_siteindex.png', 'bounds': bounds, 'stats': stats, 'unit': 'm', 'label': f'지위지수 ({country_code})'}
        print(f'  ✓ {country_code} site index: {stats["min"]:.0f}-{stats["max"]:.0f} m')

        # Age 2024 (band 16)
        png = os.path.join(OUT_DIR, f'{country_code}_age_2024.png')
        bounds, stats = render_band_to_png(hist_path, 16, colormap_age, png, 0, 80)
        results['age_2024'] = {'file': f'/maps/{country_code}_age_2024.png', 'bounds': bounds, 'stats': stats, 'unit': 'yr', 'label': f'임령 ({country_code}, 2024)'}
        print(f'  ✓ {country_code} age 2024: {stats["min"]:.0f}-{stats["max"]:.0f} yr')

    if os.path.exists(out_path_2050):
        # Biomass 2050 (band 1)
        png = os.path.join(OUT_DIR, f'{country_code}_biomass_2050.png')
        bounds, stats = render_band_to_png(out_path_2050, 1, colormap_biomass, png, 0, 220)
        results['biomass_2050'] = {'file': f'/maps/{country_code}_biomass_2050.png', 'bounds': bounds, 'stats': stats, 'unit': 't/ha', 'label': f'바이오매스 ({country_code}, 2050 예측)'}
        print(f'  ✓ {country_code} biomass 2050: {stats["min"]:.0f}-{stats["max"]:.0f} t/ha')

    return results

if __name__ == '__main__':
    # Process key countries
    countries = ['KOR', 'JPN', 'CHN', 'USA', 'CAN', 'AUS', 'DEU', 'BRA', 'IDN', 'IND', 'RUS', 'GBR', 'FRA']
    all_meta = {}

    for code in countries:
        hist = os.path.join('data', 'forest', 'GeoTIFF_Historical', f'{code}_17Band_Historical.tif')
        if os.path.exists(hist):
            print(f'{code}:')
            all_meta[code] = process_country(code)
        else:
            print(f'{code}: no GeoTIFF found, skipping')

    # Save metadata
    meta_path = os.path.join(OUT_DIR, 'meta.json')
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(all_meta, f, ensure_ascii=False, indent=2)
    print(f'\nMetadata saved to {meta_path}')
    print(f'Total countries processed: {len(all_meta)}')
