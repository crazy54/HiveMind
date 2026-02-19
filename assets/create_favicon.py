"""Generate favicon from HiveMind logo."""
try:
    from PIL import Image
    
    # Load the actual HiveMind logo
    logo = Image.open('assets/HiveMind-white.png')
    
    # Convert to RGBA if needed
    if logo.mode != 'RGBA':
        logo = logo.convert('RGBA')
    
    # Resize to favicon sizes
    sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
    
    # Save as ICO with multiple sizes
    logo.save('assets/favicon.ico', format='ICO', sizes=sizes)
    print("✅ Favicon created successfully from HiveMind-white.png!")
    
except ImportError:
    print("⚠️  PIL not installed. Favicon not created.")
    print("   Install with: pip install Pillow")
except Exception as e:
    print(f"❌ Error creating favicon: {e}")
