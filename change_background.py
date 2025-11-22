#!/usr/bin/env python3
"""
Skrypt do zmiany tła obrazów w folderze assets z czarnego na fioletowy (#9333ea)
Zachowuje biały tekst/logo, zmienia tylko czarne tło.
"""

from PIL import Image
import os

# Kolor docelowy - fioletowy motyw aplikacji
TARGET_COLOR = (147, 51, 234)  # #9333ea w RGB

# Ścieżka do folderu assets
ASSETS_DIR = "./assets"

# Lista plików do przetworzenia
IMAGE_FILES = [
    "icon.png",
    "splash.png",
    "adaptive-icon.png",
    "favicon.png"
]

def change_background(image_path, output_path, target_bg_color):
    """
    Zmienia czarne tło obrazu na wybrany kolor.
    Zachowuje wszystkie inne kolory (w tym biały tekst).
    """
    print(f"Przetwarzanie: {image_path}")

    # Otwórz obraz
    img = Image.open(image_path)

    # Konwertuj do RGBA jeśli nie jest
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    # Pobierz dane pikseli
    pixels = img.load()
    width, height = img.size

    # Licznik zmienionych pikseli
    changed_pixels = 0

    # Przejdź przez wszystkie piksele
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]

            # Sprawdź czy piksel jest czarny (lub bardzo ciemny)
            # Tolerancja dla odcieni czerni
            if r < 30 and g < 30 and b < 30:
                # Zmień na fioletowy, zachowując alpha
                pixels[x, y] = (target_bg_color[0], target_bg_color[1], target_bg_color[2], a)
                changed_pixels += 1

    # Zapisz zmodyfikowany obraz
    img.save(output_path, 'PNG')
    print(f"✓ Zapisano: {output_path} (zmieniono {changed_pixels} pikseli)")

    return changed_pixels

def main():
    print("=" * 60)
    print("Zmiana tła obrazów w folderze assets")
    print(f"Nowy kolor tła: #{TARGET_COLOR[0]:02x}{TARGET_COLOR[1]:02x}{TARGET_COLOR[2]:02x}")
    print("=" * 60)
    print()

    total_changed = 0

    for filename in IMAGE_FILES:
        input_path = os.path.join(ASSETS_DIR, filename)

        if not os.path.exists(input_path):
            print(f"⚠ Plik nie znaleziony: {input_path}")
            continue

        # Zmień tło i nadpisz oryginalny plik
        output_path = input_path

        try:
            changed = change_background(input_path, output_path, TARGET_COLOR)
            total_changed += changed
            print()
        except Exception as e:
            print(f"✗ Błąd podczas przetwarzania {filename}: {e}")
            print()

    print("=" * 60)
    print(f"Zakończono! Łącznie zmieniono {total_changed} pikseli.")
    print("=" * 60)

if __name__ == "__main__":
    main()
