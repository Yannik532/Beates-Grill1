#!/usr/bin/bash

# Bildoptimierungs-Script für Beate's Grill Website
# Dieses Script optimiert alle Bilder für bessere Web-Performance

# Erstelle Verzeichnis für optimierte Bilder
mkdir -p img/optimized

echo "🖼️  Optimiere Bilder für Web-Performance..."

# Installiere notwendige Tools (falls nicht vorhanden)
if ! command -v convert &> /dev/null; then
    echo "ImageMagick wird installiert..."
    sudo apt-get update
    sudo apt-get install -y imagemagick
fi

if ! command -v cwebp &> /dev/null; then
    echo "WebP Tools werden installiert..."
    sudo apt-get install -y webp
fi

# Funktion zum Optimieren der Bilder
optimize_image() {
    local input_file="$1"
    local output_dir="$2"
    local max_width="$3"
    local quality="$4"
    
    local filename=$(basename "$input_file")
    local name="${filename%.*}"
    local ext="${filename##*.}"
    
    echo "Optimiere: $filename"
    
    # Erstelle verschiedene Größen für responsive Design
    # Original optimiert
    convert "$input_file" -resize "${max_width}x" -quality "$quality" "$output_dir/${name}_optimized.jpg"
    
    # Thumbnail (für Gallery)
    convert "$input_file" -resize "400x400^" -gravity center -crop "400x400+0+0" -quality "85" "$output_dir/${name}_thumb.jpg"
    
    # WebP Version (moderne Browser)
    cwebp -q "$quality" "$input_file" -o "$output_dir/${name}.webp"
    
    # Mobile optimiert (kleinere Größe)
    convert "$input_file" -resize "800x" -quality "80" "$output_dir/${name}_mobile.jpg"
}

# Optimiere Hero-Bilder (große Hintergrundbilder)
echo "📸 Optimiere Hero-Bilder..."
optimize_image "img/hero.jpg" "img/optimized" "1920" "85"
optimize_image "img/Karte.jpg" "img/optimized" "1920" "85"
optimize_image "img/Raum.jpg" "img/optimized" "1920" "85"
optimize_image "img/Außen.jpg" "img/optimized" "1920" "85"

# Optimiere Slider-Bilder
echo "🎠 Optimiere Slider-Bilder..."
optimize_image "img/Currywurst.jpg" "img/optimized" "800" "85"
optimize_image "img/Jägerschnitzel_1.jpg" "img/optimized" "800" "85"
optimize_image "img/Gyros.jpg" "img/optimized" "800" "85"
optimize_image "img/Pommes.jpg" "img/optimized" "800" "85"

# Optimiere Gallery-Bilder
echo "🖼️  Optimiere Gallery-Bilder..."
for file in img/raum*.jpg img/buffet*.jpg img/fleischspiesse.jpg; do
    if [[ -f "$file" ]]; then
        optimize_image "$file" "img/optimized" "1200" "85"
    fi
done

# Optimiere restliche Bilder
echo "📷 Optimiere restliche Bilder..."
for file in img/Tisch.jpg img/Buffet.jpg; do
    if [[ -f "$file" ]]; then
        optimize_image "$file" "img/optimized" "1200" "85"
    fi
done

echo "✅ Bildoptimierung abgeschlossen!"
echo ""
echo "📊 Größenvergleich:"
echo "Vorher:"
du -sh img/*.jpg | head -10

echo ""
echo "Nachher:"
du -sh img/optimized/*.jpg | head -10

echo ""
echo "🚀 Nächste Schritte:"
echo "1. Prüfe die optimierten Bilder in img/optimized/"
echo "2. Ersetze die Bildverweise in den HTML-Dateien"
echo "3. Implementiere responsive Bilder mit srcset"
echo "4. Teste die Website-Performance"